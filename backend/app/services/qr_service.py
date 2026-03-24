import qrcode
import io
import base64
import json
from typing import Optional


def generate_payment_qr(
    amount: float,
    invoice_number: str,
    resident_name: str,
    easypaisa_number: Optional[str] = None,
    jazzcash_number: Optional[str] = None,
    bank_account: Optional[str] = None,
    bank_name: Optional[str] = None,
) -> str:
    """Generate a QR code containing payment information."""
    payment_data = {
        "invoice": invoice_number,
        "amount": amount,
        "name": resident_name,
    }

    if easypaisa_number:
        payment_data["easypaisa"] = easypaisa_number
    if jazzcash_number:
        payment_data["jazzcash"] = jazzcash_number
    if bank_account:
        payment_data["bank_account"] = bank_account
        payment_data["bank_name"] = bank_name

    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(json.dumps(payment_data))
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)

    return base64.b64encode(buffer.getvalue()).decode("utf-8")


def generate_gate_qr(resident_id: str, house_number: str, name: str) -> str:
    """Generate a QR code for gate entry verification."""
    gate_data = {
        "type": "gate_entry",
        "resident_id": resident_id,
        "house": house_number,
        "name": name,
    }

    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(json.dumps(gate_data))
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)

    return base64.b64encode(buffer.getvalue()).decode("utf-8")
