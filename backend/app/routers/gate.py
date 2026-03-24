from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import uuid
from app.database import get_db
from app.models.models import Resident, GateLog, ResidentStatus
from app.schemas.schemas import GateVerifyRequest, GateLogResponse

router = APIRouter(prefix="/api/gate", tags=["Gate Entry"])


@router.post("/verify")
def verify_gate_entry(data: GateVerifyRequest, db: Session = Depends(get_db)):
    """Verify if a resident is allowed entry through the gate."""
    resident = db.query(Resident).filter(Resident.id == data.resident_id).first()
    if not resident:
        return {
            "allowed": False,
            "reason": "Resident not found",
            "resident": None,
        }

    allowed = resident.gate_entry_allowed
    reason = None
    if not allowed:
        if resident.status == ResidentStatus.DEFAULTER:
            reason = f"Payment defaulter - Outstanding Rs. {resident.outstanding_balance:,.0f}"
        elif resident.status == ResidentStatus.BLOCKED:
            reason = "Entry blocked by management"
        elif resident.status == ResidentStatus.INACTIVE:
            reason = "Inactive resident"
        else:
            reason = "Gate entry not allowed"

    # Log the gate entry attempt
    log = GateLog(
        id=str(uuid.uuid4()),
        resident_id=resident.id,
        direction="entry",
        allowed=allowed,
        denied_reason=reason,
    )
    db.add(log)
    db.commit()

    return {
        "allowed": allowed,
        "reason": reason,
        "resident": {
            "name": resident.name,
            "house_number": resident.house_number,
            "block": resident.block,
            "status": resident.status.value,
        },
    }


@router.get("/logs", response_model=List[GateLogResponse])
def get_gate_logs(
    society_id: str,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """Get recent gate entry/exit logs."""
    return (
        db.query(GateLog)
        .join(Resident)
        .filter(Resident.society_id == society_id)
        .order_by(GateLog.scanned_at.desc())
        .limit(limit)
        .all()
    )
