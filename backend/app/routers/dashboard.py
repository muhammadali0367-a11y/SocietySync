from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from app.database import get_db
from app.models.models import Resident, Invoice, ResidentStatus, InvoiceStatus
from app.schemas.schemas import DashboardStats

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/{society_id}", response_model=DashboardStats)
def get_dashboard(society_id: str, db: Session = Depends(get_db)):
    current_month = datetime.now().strftime("%Y-%m")

    total_residents = db.query(Resident).filter(Resident.society_id == society_id).count()
    active_residents = (
        db.query(Resident)
        .filter(Resident.society_id == society_id, Resident.status == ResidentStatus.ACTIVE)
        .count()
    )
    defaulters = (
        db.query(Resident)
        .filter(Resident.society_id == society_id, Resident.status == ResidentStatus.DEFAULTER)
        .count()
    )

    month_invoices = (
        db.query(Invoice)
        .filter(Invoice.society_id == society_id, Invoice.billing_month == current_month)
    )
    total_invoices = month_invoices.count()
    paid_invoices = month_invoices.filter(Invoice.status == InvoiceStatus.PAID).count()
    pending_invoices = month_invoices.filter(Invoice.status == InvoiceStatus.PENDING).count()
    overdue_invoices = month_invoices.filter(Invoice.status == InvoiceStatus.OVERDUE).count()

    total_collected = (
        db.query(func.coalesce(func.sum(Invoice.paid_amount), 0))
        .filter(Invoice.society_id == society_id, Invoice.billing_month == current_month)
        .scalar()
    )
    total_pending_amount = (
        db.query(func.coalesce(func.sum(Invoice.total_amount - Invoice.paid_amount), 0))
        .filter(
            Invoice.society_id == society_id,
            Invoice.billing_month == current_month,
            Invoice.status.in_([InvoiceStatus.PENDING, InvoiceStatus.OVERDUE]),
        )
        .scalar()
    )

    recovery_rate = (total_collected / (total_collected + total_pending_amount) * 100) if (total_collected + total_pending_amount) > 0 else 0

    return DashboardStats(
        total_residents=total_residents,
        active_residents=active_residents,
        defaulters=defaulters,
        total_invoices_this_month=total_invoices,
        paid_invoices=paid_invoices,
        pending_invoices=pending_invoices,
        overdue_invoices=overdue_invoices,
        total_collected=float(total_collected),
        total_pending=float(total_pending_amount),
        recovery_rate=round(recovery_rate, 1),
    )
