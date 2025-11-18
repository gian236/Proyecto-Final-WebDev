# routers/users.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import crud, schemas
from ..database import get_db
from ..crud import verify_password  # tu función actual
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/users", tags=["users"])

# Registro
@router.post("/", response_model=schemas.UserOut)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    return crud.create_user(db, user)

# Obtener todos los usuarios
@router.get("/", response_model=list[schemas.UserOut])
def get_users(db: Session = Depends(get_db)):
    return crud.get_users(db)

# Login
@router.post("/login")
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(crud.models.User).filter(crud.models.User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.password_hash):
        raise HTTPException(status_code=400, detail="Email o contraseña incorrectos")
    # Para simplificar, retornamos un token ficticio y datos de usuario
    return {
        "access_token": "fake-jwt-token",
        "user": {
            "id": db_user.id,
            "name": db_user.name,
            "email": db_user.email,
            "role": db_user.role
        }
    }

@router.post("/{user_id}/skills")
def assign_skills_to_user(user_id: int, skill_ids: list[int], db: Session = Depends(get_db)):
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return crud.assign_skills(db, user_id, skill_ids)

class SkillAssignment(BaseModel):
    skill_ids: List[int]

@router.post("/{user_id}/skills")
def assign_skills_to_user(user_id: int, skills: SkillAssignment, db: Session = Depends(get_db)):
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return crud.assign_skills(db, user_id, skills.skill_ids)