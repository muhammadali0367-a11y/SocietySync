from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.models import Society
from app.schemas.schemas import SocietyCreate, SocietyUpdate, SocietyResponse

router = APIRouter(prefix="/api/societies", tags=["Societies"])


@router.get("/", response_model=List[SocietyResponse])
def list_societies(db: Session = Depends(get_db)):
    return db.query(Society).all()


@router.get("/{society_id}", response_model=SocietyResponse)
def get_society(society_id: str, db: Session = Depends(get_db)):
    society = db.query(Society).filter(Society.id == society_id).first()
    if not society:
        raise HTTPException(status_code=404, detail="Society not found")
    return society


@router.post("/", response_model=SocietyResponse)
def create_society(data: SocietyCreate, db: Session = Depends(get_db)):
    society = Society(**data.model_dump())
    db.add(society)
    db.commit()
    db.refresh(society)
    return society


@router.put("/{society_id}", response_model=SocietyResponse)
def update_society(society_id: str, data: SocietyUpdate, db: Session = Depends(get_db)):
    society = db.query(Society).filter(Society.id == society_id).first()
    if not society:
        raise HTTPException(status_code=404, detail="Society not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(society, key, value)
    db.commit()
    db.refresh(society)
    return society


@router.delete("/{society_id}")
def delete_society(society_id: str, db: Session = Depends(get_db)):
    society = db.query(Society).filter(Society.id == society_id).first()
    if not society:
        raise HTTPException(status_code=404, detail="Society not found")
    db.delete(society)
    db.commit()
    return {"message": "Society deleted"}
