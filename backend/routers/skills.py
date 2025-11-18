# backend/routers/skills.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .. import crud, schemas
from ..database import get_db

router = APIRouter(prefix="/skills", tags=["skills"])

@router.get("/", response_model=list[schemas.SkillOut])
def get_all_skills(db: Session = Depends(get_db)):
    return crud.get_skills(db)
