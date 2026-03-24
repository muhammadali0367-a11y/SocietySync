"""Notification service for WhatsApp and Email integration.

This module provides stub implementations for notification delivery.
In production, integrate with:
- WhatsApp Business API or services like Twilio/WATI
- SMTP or services like SendGrid for email
"""

import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.models import NotificationLog, NotificationType, Invoice, Resident


def send_invoice_notification(
    db: Session,
    invoice: Invoice,
    resident: Resident,
) -> NotificationLog:
    """Send invoice notification to a resident via their preferred channel."""
    message = _build_invoice_message(invoice, resident)

    log = NotificationLog(
        id=str(uuid.uuid4()),
        resident_id=resident.id,
        invoice_id=invoice.id,
        notification_type=resident.notification_preference,
        message=message,
        sent_at=datetime.utcnow(),
        delivered=True,  # Stub: mark as delivered
    )

    if resident.notification_preference == NotificationType.WHATSAPP:
        _send_whatsapp(resident.whatsapp or resident.phone, message)
    elif resident.notification_preference == NotificationType.EMAIL:
        _send_email(resident.email, "Invoice - " + invoice.invoice_number, message)
    else:
        _send_sms(resident.phone, message)

    db.add(log)
    db.commit()
    return log


def send_payment_reminder(
    db: Session,
    invoice: Invoice,
    resident: Resident,
) -> NotificationLog:
    """Send a payment reminder for an overdue invoice."""
    message = _build_reminder_message(invoice, resident)

    log = NotificationLog(
        id=str(uuid.uuid4()),
        resident_id=resident.id,
        invoice_id=invoice.id,
        notification_type=resident.notification_preference,
        message=message,
        sent_at=datetime.utcnow(),
        delivered=True,
    )

    invoice.reminder_count += 1

    db.add(log)
    db.commit()
    return log


def send_defaulter_notice(
    db: Session,
    resident: Resident,
    outstanding_amount: float,
) -> NotificationLog:
    """Send a defaulter notice when gate entry is restricted."""
    message = (
        f"Dear {resident.name},\n\n"
        f"Your gate entry has been restricted due to outstanding dues of Rs. {outstanding_amount:,.0f}.\n"
        f"House: {resident.house_number}\n\n"
        f"Please clear your dues to restore access.\n\n"
        f"- Society Management"
    )

    log = NotificationLog(
        id=str(uuid.uuid4()),
        resident_id=resident.id,
        notification_type=resident.notification_preference,
        message=message,
        sent_at=datetime.utcnow(),
        delivered=True,
    )

    db.add(log)
    db.commit()
    return log


def _build_invoice_message(invoice: Invoice, resident: Resident) -> str:
    return (
        f"Assalam-o-Alaikum {resident.name},\n\n"
        f"Your maintenance invoice has been generated:\n"
        f"Invoice: {invoice.invoice_number}\n"
        f"Month: {invoice.billing_month}\n"
        f"Amount: Rs. {invoice.total_amount:,.0f}\n"
        f"Due Date: {invoice.due_date}\n"
        f"House: {resident.house_number}\n\n"
        f"Please pay via EasyPaisa/JazzCash/Bank Transfer.\n"
        f"Reference: {invoice.invoice_number}\n\n"
        f"JazakAllah Khair\n"
        f"- Society Management"
    )


def _build_reminder_message(invoice: Invoice, resident: Resident) -> str:
    return (
        f"Reminder: Dear {resident.name},\n\n"
        f"Your invoice {invoice.invoice_number} for Rs. {invoice.total_amount:,.0f} "
        f"is overdue. Due date was {invoice.due_date}.\n"
        f"Late fee of Rs. {invoice.late_fee:,.0f} has been applied.\n\n"
        f"Please pay immediately to avoid gate entry restrictions.\n\n"
        f"- Society Management"
    )


def _send_whatsapp(phone: str, message: str):
    """Stub: Send WhatsApp message via Business API."""
    # TODO: Integrate with WhatsApp Business API (e.g., Twilio, WATI)
    print(f"[WhatsApp] To: {phone}\n{message}")


def _send_email(email: str, subject: str, message: str):
    """Stub: Send email via SMTP or API."""
    # TODO: Integrate with SMTP or SendGrid
    print(f"[Email] To: {email}, Subject: {subject}\n{message}")


def _send_sms(phone: str, message: str):
    """Stub: Send SMS."""
    # TODO: Integrate with SMS gateway
    print(f"[SMS] To: {phone}\n{message}")
