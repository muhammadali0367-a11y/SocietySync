from datetime import datetime, date
from sqlalchemy.orm import Session
from app.models.models import Invoice, Resident, Society, InvoiceStatus, ResidentStatus
from app.services.qr_service import generate_payment_qr
import uuid


def generate_invoice_number(society_name: str, billing_month: str, index: int) -> str:
    """Generate a unique invoice number."""
    prefix = "".join(w[0] for w in society_name.split()[:3]).upper()
    month_part = billing_month.replace("-", "")
    return f"INV-{prefix}-{month_part}-{index:04d}"


def create_invoice_for_resident(
    db: Session,
    society: Society,
    resident: Resident,
    billing_month: str,
    due_date: date,
    index: int,
) -> Invoice:
    """Create a single invoice for a resident."""
    invoice_number = generate_invoice_number(society.name, billing_month, index)
    amount = society.monthly_fee

    # Generate payment QR code
    qr_data = generate_payment_qr(
        amount=amount,
        invoice_number=invoice_number,
        resident_name=resident.name,
        easypaisa_number=society.easypaisa_number,
        jazzcash_number=society.jazzcash_number,
        bank_account=society.bank_account_number,
        bank_name=society.bank_name,
    )

    invoice = Invoice(
        id=str(uuid.uuid4()),
        society_id=society.id,
        resident_id=resident.id,
        invoice_number=invoice_number,
        billing_month=billing_month,
        amount=amount,
        late_fee=0.0,
        total_amount=amount,
        due_date=due_date,
        payment_qr_data=qr_data,
        status=InvoiceStatus.PENDING,
    )

    db.add(invoice)
    return invoice


def generate_bulk_invoices(
    db: Session, society_id: str, billing_month: str, due_date: date
) -> list[Invoice]:
    """Generate invoices for all active residents of a society."""
    society = db.query(Society).filter(Society.id == society_id).first()
    if not society:
        raise ValueError("Society not found")

    residents = (
        db.query(Resident)
        .filter(
            Resident.society_id == society_id,
            Resident.status.in_([ResidentStatus.ACTIVE, ResidentStatus.DEFAULTER]),
        )
        .all()
    )

    # Check for existing invoices this month
    existing = (
        db.query(Invoice)
        .filter(
            Invoice.society_id == society_id,
            Invoice.billing_month == billing_month,
        )
        .all()
    )
    existing_resident_ids = {inv.resident_id for inv in existing}

    invoices = []
    index = len(existing) + 1
    for resident in residents:
        if resident.id in existing_resident_ids:
            continue
        invoice = create_invoice_for_resident(
            db, society, resident, billing_month, due_date, index
        )
        invoices.append(invoice)
        index += 1

    db.commit()
    return invoices


def check_overdue_invoices(db: Session, society_id: str) -> list[Invoice]:
    """Mark overdue invoices and update resident status."""
    today = date.today()
    overdue_invoices = (
        db.query(Invoice)
        .filter(
            Invoice.society_id == society_id,
            Invoice.status == InvoiceStatus.PENDING,
            Invoice.due_date < today,
        )
        .all()
    )

    for invoice in overdue_invoices:
        society = db.query(Society).filter(Society.id == society_id).first()
        invoice.status = InvoiceStatus.OVERDUE
        invoice.late_fee = invoice.amount * (society.late_fee_percentage / 100)
        invoice.total_amount = invoice.amount + invoice.late_fee

        # Update resident outstanding balance
        resident = db.query(Resident).filter(Resident.id == invoice.resident_id).first()
        if resident:
            resident.outstanding_balance = (
                db.query(Invoice)
                .filter(
                    Invoice.resident_id == resident.id,
                    Invoice.status.in_([InvoiceStatus.PENDING, InvoiceStatus.OVERDUE]),
                )
                .count()
            ) * invoice.total_amount

    db.commit()
    return overdue_invoices


def apply_defaulter_rules(db: Session, society_id: str, max_overdue: int = 2):
    """Mark residents as defaulters if they have too many overdue invoices."""
    residents = (
        db.query(Resident)
        .filter(Resident.society_id == society_id, Resident.status == ResidentStatus.ACTIVE)
        .all()
    )

    defaulters = []
    for resident in residents:
        overdue_count = (
            db.query(Invoice)
            .filter(
                Invoice.resident_id == resident.id,
                Invoice.status == InvoiceStatus.OVERDUE,
            )
            .count()
        )
        if overdue_count >= max_overdue:
            resident.status = ResidentStatus.DEFAULTER
            resident.gate_entry_allowed = False
            defaulters.append(resident)

    db.commit()
    return defaulters
