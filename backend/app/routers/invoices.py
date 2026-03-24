from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from app.database import get_db
from app.models.models import Invoice, InvoiceStatus
from app.schemas.schemas import (
    InvoiceCreate, InvoiceBulkCreate, InvoiceResponse,
)
from app.services.invoice_service import (
    generate_bulk_invoices, check_overdue_invoices, apply_defaulter_rules,
)

router = APIRouter(prefix="/api/invoices", tags=["Invoices"])


@router.get("/", response_model=List[InvoiceResponse])
def list_invoices(
    society_id: str,
    billing_month: Optional[str] = None,
    status: Optional[InvoiceStatus] = None,
    resident_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = (
        db.query(Invoice)
        .options(joinedload(Invoice.resident))
        .filter(Invoice.society_id == society_id)
    )
    if billing_month:
        query = query.filter(Invoice.billing_month == billing_month)
    if status:
        query = query.filter(Invoice.status == status)
    if resident_id:
        query = query.filter(Invoice.resident_id == resident_id)
    return query.order_by(Invoice.created_at.desc()).all()


@router.get("/{invoice_id}", response_model=InvoiceResponse)
def get_invoice(invoice_id: str, db: Session = Depends(get_db)):
    invoice = (
        db.query(Invoice)
        .options(joinedload(Invoice.resident))
        .filter(Invoice.id == invoice_id)
        .first()
    )
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice


@router.post("/bulk", response_model=List[InvoiceResponse])
def create_bulk_invoices(data: InvoiceBulkCreate, db: Session = Depends(get_db)):
    try:
        invoices = generate_bulk_invoices(
            db, data.society_id, data.billing_month, data.due_date
        )
        return invoices
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/check-overdue")
def check_overdue(society_id: str, db: Session = Depends(get_db)):
    overdue = check_overdue_invoices(db, society_id)
    defaulters = apply_defaulter_rules(db, society_id)
    return {
        "overdue_count": len(overdue),
        "new_defaulters": len(defaulters),
        "defaulter_names": [d.name for d in defaulters],
    }


@router.put("/{invoice_id}/cancel")
def cancel_invoice(invoice_id: str, db: Session = Depends(get_db)):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    invoice.status = InvoiceStatus.CANCELLED
    db.commit()
    return {"message": "Invoice cancelled"}
