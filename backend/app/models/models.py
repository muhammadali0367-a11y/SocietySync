import uuid
from datetime import datetime, date
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Date,
    ForeignKey, Text, Enum as SAEnum,
)
from sqlalchemy.orm import relationship
from app.database import Base
import enum


def generate_uuid():
    return str(uuid.uuid4())


class InvoiceStatus(str, enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    OVERDUE = "overdue"
    PARTIALLY_PAID = "partially_paid"
    CANCELLED = "cancelled"


class ResidentStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    DEFAULTER = "defaulter"
    BLOCKED = "blocked"


class PaymentMethod(str, enum.Enum):
    EASYPAISA = "easypaisa"
    JAZZCASH = "jazzcash"
    BANK_TRANSFER = "bank_transfer"
    ONE_LINK = "1link"
    CASH = "cash"
    OTHER = "other"


class NotificationType(str, enum.Enum):
    WHATSAPP = "whatsapp"
    EMAIL = "email"
    SMS = "sms"


# --- Society ---
class Society(Base):
    __tablename__ = "societies"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String(200), nullable=False)
    address = Column(Text)
    city = Column(String(100), default="Lahore")
    total_houses = Column(Integer, default=0)
    monthly_fee = Column(Float, default=0.0)
    late_fee_percentage = Column(Float, default=10.0)
    grace_period_days = Column(Integer, default=7)
    bank_account_title = Column(String(200))
    bank_account_number = Column(String(50))
    bank_name = Column(String(100))
    easypaisa_number = Column(String(20))
    jazzcash_number = Column(String(20))
    contact_email = Column(String(200))
    contact_phone = Column(String(20))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    residents = relationship("Resident", back_populates="society", cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="society", cascade="all, delete-orphan")


# --- Resident ---
class Resident(Base):
    __tablename__ = "residents"

    id = Column(String, primary_key=True, default=generate_uuid)
    society_id = Column(String, ForeignKey("societies.id"), nullable=False)
    name = Column(String(200), nullable=False)
    cnic = Column(String(15))
    phone = Column(String(20))
    email = Column(String(200))
    whatsapp = Column(String(20))
    house_number = Column(String(20), nullable=False)
    block = Column(String(20))
    house_type = Column(String(50))  # e.g., 5-marla, 10-marla, 1-kanal
    is_owner = Column(Boolean, default=True)
    status = Column(SAEnum(ResidentStatus), default=ResidentStatus.ACTIVE)
    gate_entry_allowed = Column(Boolean, default=True)
    gate_qr_code = Column(String(500))
    outstanding_balance = Column(Float, default=0.0)
    notification_preference = Column(SAEnum(NotificationType), default=NotificationType.WHATSAPP)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    society = relationship("Society", back_populates="residents")
    invoices = relationship("Invoice", back_populates="resident", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="resident", cascade="all, delete-orphan")
    gate_logs = relationship("GateLog", back_populates="resident", cascade="all, delete-orphan")


# --- Invoice ---
class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(String, primary_key=True, default=generate_uuid)
    society_id = Column(String, ForeignKey("societies.id"), nullable=False)
    resident_id = Column(String, ForeignKey("residents.id"), nullable=False)
    invoice_number = Column(String(50), unique=True, nullable=False)
    billing_month = Column(String(7), nullable=False)  # YYYY-MM
    amount = Column(Float, nullable=False)
    late_fee = Column(Float, default=0.0)
    total_amount = Column(Float, nullable=False)
    paid_amount = Column(Float, default=0.0)
    status = Column(SAEnum(InvoiceStatus), default=InvoiceStatus.PENDING)
    due_date = Column(Date, nullable=False)
    payment_qr_data = Column(Text)
    issued_at = Column(DateTime, default=datetime.utcnow)
    paid_at = Column(DateTime)
    notification_sent = Column(Boolean, default=False)
    reminder_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    society = relationship("Society", back_populates="invoices")
    resident = relationship("Resident", back_populates="invoices")
    payments = relationship("Payment", back_populates="invoice", cascade="all, delete-orphan")


# --- Payment ---
class Payment(Base):
    __tablename__ = "payments"

    id = Column(String, primary_key=True, default=generate_uuid)
    invoice_id = Column(String, ForeignKey("invoices.id"), nullable=False)
    resident_id = Column(String, ForeignKey("residents.id"), nullable=False)
    amount = Column(Float, nullable=False)
    payment_method = Column(SAEnum(PaymentMethod), default=PaymentMethod.BANK_TRANSFER)
    transaction_id = Column(String(100))
    reference_number = Column(String(100))
    is_auto_reconciled = Column(Boolean, default=False)
    bank_statement_line = Column(Text)
    paid_at = Column(DateTime, default=datetime.utcnow)
    verified = Column(Boolean, default=False)
    verified_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

    invoice = relationship("Invoice", back_populates="payments")
    resident = relationship("Resident", back_populates="payments")


# --- Gate Log ---
class GateLog(Base):
    __tablename__ = "gate_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    resident_id = Column(String, ForeignKey("residents.id"), nullable=False)
    direction = Column(String(10))  # entry / exit
    allowed = Column(Boolean, default=True)
    denied_reason = Column(String(200))
    scanned_at = Column(DateTime, default=datetime.utcnow)

    resident = relationship("Resident", back_populates="gate_logs")


# --- Bank Statement Upload ---
class BankStatement(Base):
    __tablename__ = "bank_statements"

    id = Column(String, primary_key=True, default=generate_uuid)
    society_id = Column(String, ForeignKey("societies.id"), nullable=False)
    filename = Column(String(300), nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    processed = Column(Boolean, default=False)
    matched_transactions = Column(Integer, default=0)
    unmatched_transactions = Column(Integer, default=0)
    total_transactions = Column(Integer, default=0)


# --- Notification Log ---
class NotificationLog(Base):
    __tablename__ = "notification_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    resident_id = Column(String, ForeignKey("residents.id"), nullable=False)
    invoice_id = Column(String, ForeignKey("invoices.id"))
    notification_type = Column(SAEnum(NotificationType))
    message = Column(Text)
    sent_at = Column(DateTime, default=datetime.utcnow)
    delivered = Column(Boolean, default=False)
    error = Column(Text)
