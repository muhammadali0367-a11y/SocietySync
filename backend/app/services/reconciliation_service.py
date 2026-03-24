import re
import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from app.models.models import (
    Invoice, Payment, Resident, BankStatement,
    InvoiceStatus, PaymentMethod,
)


def parse_bank_statement_csv(content: str) -> list[dict]:
    """Parse a CSV bank statement into structured transactions.

    Expected CSV columns: Date, Description, Credit, Debit, Balance
    """
    lines = content.strip().split("\n")
    if len(lines) < 2:
        return []

    headers = [h.strip().lower() for h in lines[0].split(",")]
    transactions = []

    for line in lines[1:]:
        if not line.strip():
            continue
        values = [v.strip() for v in line.split(",")]
        if len(values) < len(headers):
            continue

        row = dict(zip(headers, values))
        credit = float(row.get("credit", "0") or "0")
        if credit > 0:
            transactions.append({
                "date": row.get("date", ""),
                "description": row.get("description", ""),
                "amount": credit,
                "reference": row.get("reference", row.get("description", "")),
            })

    return transactions


def match_transaction_to_invoice(
    db: Session,
    society_id: str,
    transaction: dict,
) -> Optional[dict]:
    """Try to match a bank transaction to a pending invoice.

    Matching strategies:
    1. Invoice number in description
    2. House number + amount match
    3. Resident name + amount match
    """
    description = transaction.get("description", "").upper()
    amount = transaction.get("amount", 0)

    # Strategy 1: Look for invoice number pattern in description
    inv_pattern = r"INV-[A-Z]+-\d+-\d+"
    inv_match = re.search(inv_pattern, description)
    if inv_match:
        invoice = (
            db.query(Invoice)
            .filter(
                Invoice.invoice_number == inv_match.group(),
                Invoice.society_id == society_id,
                Invoice.status.in_([InvoiceStatus.PENDING, InvoiceStatus.OVERDUE]),
            )
            .first()
        )
        if invoice and abs(invoice.total_amount - amount) < 1:
            return {"invoice": invoice, "confidence": "high", "strategy": "invoice_number"}

    # Strategy 2: Match by amount + house number in description
    pending_invoices = (
        db.query(Invoice)
        .filter(
            Invoice.society_id == society_id,
            Invoice.status.in_([InvoiceStatus.PENDING, InvoiceStatus.OVERDUE]),
        )
        .all()
    )

    for invoice in pending_invoices:
        resident = db.query(Resident).filter(Resident.id == invoice.resident_id).first()
        if not resident:
            continue

        # Check if house number appears in description
        house_num = resident.house_number.upper().replace("-", "").replace(" ", "")
        desc_clean = description.replace("-", "").replace(" ", "")

        if house_num in desc_clean and abs(invoice.total_amount - amount) < 1:
            return {"invoice": invoice, "confidence": "medium", "strategy": "house_amount"}

        # Check if resident name appears in description
        name_parts = resident.name.upper().split()
        if any(part in description for part in name_parts) and abs(invoice.total_amount - amount) < 1:
            return {"invoice": invoice, "confidence": "medium", "strategy": "name_amount"}

    # Strategy 3: Amount-only match (low confidence, only if unique)
    amount_matches = [
        inv for inv in pending_invoices
        if abs(inv.total_amount - amount) < 1
    ]
    if len(amount_matches) == 1:
        return {"invoice": amount_matches[0], "confidence": "low", "strategy": "amount_only"}

    return None


def reconcile_bank_statement(
    db: Session,
    society_id: str,
    csv_content: str,
    filename: str,
    auto_confirm_high: bool = True,
) -> dict:
    """Process a bank statement and auto-reconcile payments."""
    transactions = parse_bank_statement_csv(csv_content)

    statement = BankStatement(
        id=str(uuid.uuid4()),
        society_id=society_id,
        filename=filename,
        total_transactions=len(transactions),
    )
    db.add(statement)

    matched = 0
    unmatched = 0
    total_matched_amount = 0.0
    details = []

    for txn in transactions:
        result = match_transaction_to_invoice(db, society_id, txn)

        if result:
            invoice = result["invoice"]
            confidence = result["confidence"]

            should_auto_apply = auto_confirm_high and confidence == "high"

            if should_auto_apply:
                payment = Payment(
                    id=str(uuid.uuid4()),
                    invoice_id=invoice.id,
                    resident_id=invoice.resident_id,
                    amount=txn["amount"],
                    payment_method=PaymentMethod.BANK_TRANSFER,
                    reference_number=txn.get("reference", ""),
                    is_auto_reconciled=True,
                    bank_statement_line=txn.get("description", ""),
                    verified=True,
                    verified_at=datetime.utcnow(),
                )
                db.add(payment)

                invoice.paid_amount += txn["amount"]
                if invoice.paid_amount >= invoice.total_amount:
                    invoice.status = InvoiceStatus.PAID
                    invoice.paid_at = datetime.utcnow()
                else:
                    invoice.status = InvoiceStatus.PARTIALLY_PAID

                total_matched_amount += txn["amount"]

            matched += 1
            details.append({
                "transaction": txn,
                "invoice_number": invoice.invoice_number,
                "confidence": confidence,
                "strategy": result["strategy"],
                "auto_applied": should_auto_apply,
            })
        else:
            unmatched += 1
            details.append({
                "transaction": txn,
                "invoice_number": None,
                "confidence": None,
                "strategy": None,
                "auto_applied": False,
            })

    statement.matched_transactions = matched
    statement.unmatched_transactions = unmatched
    statement.processed = True

    db.commit()

    return {
        "statement_id": statement.id,
        "total_transactions": len(transactions),
        "matched": matched,
        "unmatched": unmatched,
        "total_amount_matched": total_matched_amount,
        "details": details,
    }
