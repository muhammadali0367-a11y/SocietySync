from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.database import get_db
from app.models.models import Payment, Invoice, InvoiceStatus, Resident, ResidentStatus
from app.schemas.schemas import PaymentCreate, PaymentResponse, BankStatementResponse, ReconciliationResult
from app.services.reconciliation_service import reconcile_bank_statement

router = APIRouter(prefix="/api/payments", tags=["Payments"])


@router.get("/", response_model=List[PaymentResponse])
def list_payments(
    society_id: str = None,
    invoice_id: str = None,
    resident_id: str = None,
    db: Session = Depends(get_db),
):
    query = db.query(Payment)
    if invoice_id:
        query = query.filter(Payment.invoice_id == invoice_id)
    if resident_id:
        query = query.filter(Payment.resident_id == resident_id)
    if society_id:
        query = query.join(Invoice).filter(Invoice.society_id == society_id)
    return query.order_by(Payment.paid_at.desc()).all()


@router.post("/", response_model=PaymentResponse)
def record_payment(data: PaymentCreate, db: Session = Depends(get_db)):
    invoice = db.query(Invoice).filter(Invoice.id == data.invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    payment = Payment(**data.model_dump())
    payment.verified = True
    payment.verified_at = datetime.utcnow()
    db.add(payment)

    # Update invoice status
    invoice.paid_amount += data.amount
    if invoice.paid_amount >= invoice.total_amount:
        invoice.status = InvoiceStatus.PAID
        invoice.paid_at = datetime.utcnow()
    else:
        invoice.status = InvoiceStatus.PARTIALLY_PAID

    # Check if resident can be un-defaulted
    resident = db.query(Resident).filter(Resident.id == data.resident_id).first()
    if resident and resident.status == ResidentStatus.DEFAULTER:
        overdue_count = (
            db.query(Invoice)
            .filter(
                Invoice.resident_id == resident.id,
                Invoice.status == InvoiceStatus.OVERDUE,
            )
            .count()
        )
        if overdue_count == 0:
            resident.status = ResidentStatus.ACTIVE
            resident.gate_entry_allowed = True

    db.commit()
    db.refresh(payment)
    return payment


@router.post("/reconcile")
async def reconcile_statement(
    society_id: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    content = await file.read()
    csv_content = content.decode("utf-8")
    result = reconcile_bank_statement(db, society_id, csv_content, file.filename)
    return result
