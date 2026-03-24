from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime, date
from app.models.models import InvoiceStatus, ResidentStatus, PaymentMethod, NotificationType


# --- Society Schemas ---
class SocietyCreate(BaseModel):
    name: str
    address: Optional[str] = None
    city: str = "Lahore"
    total_houses: int = 0
    monthly_fee: float = 0.0
    late_fee_percentage: float = 10.0
    grace_period_days: int = 7
    bank_account_title: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_name: Optional[str] = None
    easypaisa_number: Optional[str] = None
    jazzcash_number: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None


class SocietyUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    total_houses: Optional[int] = None
    monthly_fee: Optional[float] = None
    late_fee_percentage: Optional[float] = None
    grace_period_days: Optional[int] = None
    bank_account_title: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_name: Optional[str] = None
    easypaisa_number: Optional[str] = None
    jazzcash_number: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None


class SocietyResponse(BaseModel):
    id: str
    name: str
    address: Optional[str]
    city: str
    total_houses: int
    monthly_fee: float
    late_fee_percentage: float
    grace_period_days: int
    bank_account_title: Optional[str]
    bank_account_number: Optional[str]
    bank_name: Optional[str]
    easypaisa_number: Optional[str]
    jazzcash_number: Optional[str]
    contact_email: Optional[str]
    contact_phone: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# --- Resident Schemas ---
class ResidentCreate(BaseModel):
    society_id: str
    name: str
    cnic: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    whatsapp: Optional[str] = None
    house_number: str
    block: Optional[str] = None
    house_type: Optional[str] = None
    is_owner: bool = True
    notification_preference: NotificationType = NotificationType.WHATSAPP


class ResidentUpdate(BaseModel):
    name: Optional[str] = None
    cnic: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    whatsapp: Optional[str] = None
    house_number: Optional[str] = None
    block: Optional[str] = None
    house_type: Optional[str] = None
    is_owner: Optional[bool] = None
    status: Optional[ResidentStatus] = None
    gate_entry_allowed: Optional[bool] = None
    notification_preference: Optional[NotificationType] = None


class ResidentResponse(BaseModel):
    id: str
    society_id: str
    name: str
    cnic: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    whatsapp: Optional[str]
    house_number: str
    block: Optional[str]
    house_type: Optional[str]
    is_owner: bool
    status: ResidentStatus
    gate_entry_allowed: bool
    gate_qr_code: Optional[str]
    outstanding_balance: float
    notification_preference: NotificationType
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# --- Invoice Schemas ---
class InvoiceCreate(BaseModel):
    society_id: str
    resident_id: str
    billing_month: str  # YYYY-MM
    amount: float
    due_date: date


class InvoiceBulkCreate(BaseModel):
    society_id: str
    billing_month: str  # YYYY-MM
    due_date: date


class InvoiceResponse(BaseModel):
    id: str
    society_id: str
    resident_id: str
    invoice_number: str
    billing_month: str
    amount: float
    late_fee: float
    total_amount: float
    paid_amount: float
    status: InvoiceStatus
    due_date: date
    payment_qr_data: Optional[str]
    issued_at: datetime
    paid_at: Optional[datetime]
    notification_sent: bool
    reminder_count: int
    created_at: datetime
    resident: Optional[ResidentResponse] = None

    class Config:
        from_attributes = True


# --- Payment Schemas ---
class PaymentCreate(BaseModel):
    invoice_id: str
    resident_id: str
    amount: float
    payment_method: PaymentMethod = PaymentMethod.BANK_TRANSFER
    transaction_id: Optional[str] = None
    reference_number: Optional[str] = None


class PaymentResponse(BaseModel):
    id: str
    invoice_id: str
    resident_id: str
    amount: float
    payment_method: PaymentMethod
    transaction_id: Optional[str]
    reference_number: Optional[str]
    is_auto_reconciled: bool
    bank_statement_line: Optional[str]
    paid_at: datetime
    verified: bool
    verified_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


# --- Gate Log Schemas ---
class GateVerifyRequest(BaseModel):
    resident_id: str


class GateLogResponse(BaseModel):
    id: str
    resident_id: str
    direction: Optional[str]
    allowed: bool
    denied_reason: Optional[str]
    scanned_at: datetime

    class Config:
        from_attributes = True


# --- Bank Statement Schemas ---
class BankStatementResponse(BaseModel):
    id: str
    society_id: str
    filename: str
    uploaded_at: datetime
    processed: bool
    matched_transactions: int
    unmatched_transactions: int
    total_transactions: int

    class Config:
        from_attributes = True


class ReconciliationResult(BaseModel):
    total_transactions: int
    matched: int
    unmatched: int
    total_amount_matched: float
    details: List[dict]


# --- Dashboard Schemas ---
class DashboardStats(BaseModel):
    total_residents: int
    active_residents: int
    defaulters: int
    total_invoices_this_month: int
    paid_invoices: int
    pending_invoices: int
    overdue_invoices: int
    total_collected: float
    total_pending: float
    recovery_rate: float
