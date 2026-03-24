from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.models import Resident, ResidentStatus
from app.schemas.schemas import ResidentCreate, ResidentUpdate, ResidentResponse
from app.services.qr_service import generate_gate_qr

router = APIRouter(prefix="/api/residents", tags=["Residents"])


@router.get("/", response_model=List[ResidentResponse])
def list_residents(
    society_id: str,
    status: Optional[ResidentStatus] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Resident).filter(Resident.society_id == society_id)
    if status:
        query = query.filter(Resident.status == status)
    if search:
        query = query.filter(
            (Resident.name.ilike(f"%{search}%"))
            | (Resident.house_number.ilike(f"%{search}%"))
            | (Resident.phone.ilike(f"%{search}%"))
        )
    return query.order_by(Resident.house_number).all()


@router.get("/{resident_id}", response_model=ResidentResponse)
def get_resident(resident_id: str, db: Session = Depends(get_db)):
    resident = db.query(Resident).filter(Resident.id == resident_id).first()
    if not resident:
        raise HTTPException(status_code=404, detail="Resident not found")
    return resident


@router.post("/", response_model=ResidentResponse)
def create_resident(data: ResidentCreate, db: Session = Depends(get_db)):
    resident = Resident(**data.model_dump())
    # Generate gate QR code
    resident.gate_qr_code = generate_gate_qr(
        resident.id, resident.house_number, resident.name
    )
    db.add(resident)
    db.commit()
    db.refresh(resident)
    return resident


@router.put("/{resident_id}", response_model=ResidentResponse)
def update_resident(resident_id: str, data: ResidentUpdate, db: Session = Depends(get_db)):
    resident = db.query(Resident).filter(Resident.id == resident_id).first()
    if not resident:
        raise HTTPException(status_code=404, detail="Resident not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(resident, key, value)
    db.commit()
    db.refresh(resident)
    return resident


@router.delete("/{resident_id}")
def delete_resident(resident_id: str, db: Session = Depends(get_db)):
    resident = db.query(Resident).filter(Resident.id == resident_id).first()
    if not resident:
        raise HTTPException(status_code=404, detail="Resident not found")
    db.delete(resident)
    db.commit()
    return {"message": "Resident deleted"}


@router.get("/defaulters/list", response_model=List[ResidentResponse])
def list_defaulters(society_id: str, db: Session = Depends(get_db)):
    return (
        db.query(Resident)
        .filter(
            Resident.society_id == society_id,
            Resident.status == ResidentStatus.DEFAULTER,
        )
        .all()
    )
