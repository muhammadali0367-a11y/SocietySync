"""Seed script to populate the database with sample data for demo purposes."""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from datetime import date, datetime
from app.database import SessionLocal, engine, Base
from app.models.models import (
    Society, Resident, Invoice, ResidentStatus, InvoiceStatus,
)
from app.services.qr_service import generate_gate_qr, generate_payment_qr
from app.services.invoice_service import generate_invoice_number
import uuid

Base.metadata.create_all(bind=engine)


def seed():
    db = SessionLocal()

    # Check if already seeded
    if db.query(Society).first():
        print("Database already seeded. Skipping.")
        db.close()
        return

    # Create a sample society
    society = Society(
        id=str(uuid.uuid4()),
        name="Green Valley Society",
        address="Main Boulevard, Raiwind Road, Lahore",
        city="Lahore",
        total_houses=50,
        monthly_fee=3000.0,
        late_fee_percentage=10.0,
        grace_period_days=7,
        bank_account_title="Green Valley Society",
        bank_account_number="1234567890",
        bank_name="HBL",
        easypaisa_number="03001234567",
        jazzcash_number="03021234567",
        contact_email="admin@greenvalley.pk",
        contact_phone="04235678901",
    )
    db.add(society)

    # Create sample residents
    sample_residents = [
        {"name": "Ahmed Khan", "phone": "03001111111", "house_number": "A-1", "block": "A", "house_type": "10-marla"},
        {"name": "Fatima Zahra", "phone": "03002222222", "house_number": "A-2", "block": "A", "house_type": "10-marla"},
        {"name": "Muhammad Ali", "phone": "03003333333", "house_number": "A-3", "block": "A", "house_type": "5-marla"},
        {"name": "Ayesha Siddiqui", "phone": "03004444444", "house_number": "B-1", "block": "B", "house_type": "1-kanal"},
        {"name": "Hassan Raza", "phone": "03005555555", "house_number": "B-2", "block": "B", "house_type": "10-marla"},
        {"name": "Zainab Bibi", "phone": "03006666666", "house_number": "B-3", "block": "B", "house_type": "5-marla"},
        {"name": "Usman Tariq", "phone": "03007777777", "house_number": "C-1", "block": "C", "house_type": "10-marla"},
        {"name": "Sana Malik", "phone": "03008888888", "house_number": "C-2", "block": "C", "house_type": "5-marla"},
        {"name": "Bilal Ahmed", "phone": "03009999999", "house_number": "C-3", "block": "C", "house_type": "1-kanal"},
        {"name": "Nadia Hussain", "phone": "03010000000", "house_number": "C-4", "block": "C", "house_type": "10-marla"},
    ]

    residents = []
    for r in sample_residents:
        resident = Resident(
            id=str(uuid.uuid4()),
            society_id=society.id,
            name=r["name"],
            phone=r["phone"],
            whatsapp=r["phone"],
            email=f"{r['name'].lower().replace(' ', '.')}@gmail.com",
            house_number=r["house_number"],
            block=r["block"],
            house_type=r["house_type"],
        )
        resident.gate_qr_code = generate_gate_qr(resident.id, resident.house_number, resident.name)
        db.add(resident)
        residents.append(resident)

    # Create invoices for current and previous month
    billing_months = ["2026-02", "2026-03"]
    for month_idx, billing_month in enumerate(billing_months):
        for i, resident in enumerate(residents):
            inv_num = generate_invoice_number(society.name, billing_month, i + 1)
            qr_data = generate_payment_qr(
                amount=society.monthly_fee,
                invoice_number=inv_num,
                resident_name=resident.name,
                easypaisa_number=society.easypaisa_number,
                jazzcash_number=society.jazzcash_number,
                bank_account=society.bank_account_number,
                bank_name=society.bank_name,
            )

            if billing_month == "2026-02":
                due = date(2026, 2, 15)
                # Make some paid, some overdue
                if i < 7:
                    status = InvoiceStatus.PAID
                    paid_amount = society.monthly_fee
                    paid_at = datetime(2026, 2, 10)
                else:
                    status = InvoiceStatus.OVERDUE
                    paid_amount = 0.0
                    paid_at = None
                    # Mark these residents as defaulters
                    resident.status = ResidentStatus.DEFAULTER
                    resident.gate_entry_allowed = False
                    resident.outstanding_balance = society.monthly_fee
            else:
                due = date(2026, 3, 15)
                status = InvoiceStatus.PENDING
                paid_amount = 0.0
                paid_at = None

            invoice = Invoice(
                id=str(uuid.uuid4()),
                society_id=society.id,
                resident_id=resident.id,
                invoice_number=inv_num,
                billing_month=billing_month,
                amount=society.monthly_fee,
                late_fee=300.0 if status == InvoiceStatus.OVERDUE else 0.0,
                total_amount=society.monthly_fee + (300.0 if status == InvoiceStatus.OVERDUE else 0.0),
                paid_amount=paid_amount,
                status=status,
                due_date=due,
                payment_qr_data=qr_data,
                paid_at=paid_at,
                notification_sent=True,
            )
            db.add(invoice)

    db.commit()
    society_name = society.name
    society_id = society.id
    num_residents = len(residents)
    num_invoices = num_residents * len(billing_months)
    db.close()
    print("Database seeded successfully with sample data!")
    print(f"Society: {society_name} (ID: {society_id})")
    print(f"Residents: {num_residents}")
    print(f"Invoices: {num_invoices}")


if __name__ == "__main__":
    seed()
