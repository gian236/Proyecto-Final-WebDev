# routers/users.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import crud, schemas
from ..database import get_db
from ..crud import verify_password
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

# Obtener un usuario por ID
@router.get("/{user_id}", response_model=schemas.UserOut)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user

# Actualizar perfil de usuario
@router.put("/{user_id}", response_model=schemas.UserOut)
def update_user(user_id: int, user_update: schemas.UserUpdate, db: Session = Depends(get_db)):
    """Actualizar información del perfil del usuario"""
    updated_user = crud.update_user(db, user_id, user_update)
    if not updated_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return updated_user

# Login
@router.post("/login")
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(crud.models.User).filter(crud.models.User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.password_hash):
        raise HTTPException(status_code=400, detail="Email o contraseña incorrectos")
    return {
        "access_token": "fake-jwt-token",
        "user": {
            "id": db_user.id,
            "name": db_user.name,
            "email": db_user.email,
            "phone": db_user.phone,
            "role": db_user.role,
            "created_at": db_user.created_at,
            "profile_picture_url": db_user.profile_picture_url,
            "location": db_user.location,
            "bio": db_user.bio
        }
    }

class SkillAssignment(BaseModel):
    skill_ids: List[int]

# Get user's skills
@router.get("/{user_id}/skills", response_model=List[schemas.UserSkillOut])
def get_user_skills(user_id: int, db: Session = Depends(get_db)):
    """Obtener todas las skills de un usuario"""
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return crud.get_user_skills(db, user_id)

# Assign skills to user
@router.post("/{user_id}/skills")
def assign_skills_to_user(user_id: int, skills: SkillAssignment, db: Session = Depends(get_db)):
    """Asignar skills a un usuario"""
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return crud.assign_skills(db, user_id, skills.skill_ids)

# Remove skill from user
@router.delete("/{user_id}/skills/{skill_id}")
def remove_skill_from_user(user_id: int, skill_id: int, db: Session = Depends(get_db)):
    """Eliminar una skill de un usuario"""
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return crud.remove_user_skill(db, user_id, skill_id)

# Add single skill to user
@router.post("/{user_id}/skills/{skill_id}")
def add_skill_to_user(user_id: int, skill_id: int, db: Session = Depends(get_db)):
    """Agregar una skill a un usuario"""
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return crud.assign_skills(db, user_id, [skill_id])

# Get user's services (for vendors)
@router.get("/{user_id}/services", response_model=List[schemas.ServiceOut])
def get_user_services(user_id: int, db: Session = Depends(get_db)):
    """Obtener todos los servicios de un vendedor"""
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return crud.get_services_by_vendor(db, user_id)

# Get jobs as vendor
@router.get("/{user_id}/jobs-as-vendor", response_model=List[schemas.JobOut])
def get_user_jobs_as_vendor(user_id: int, db: Session = Depends(get_db)):
    """Obtener todos los trabajos donde el usuario es el vendedor"""
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return crud.get_jobs_by_vendor(db, user_id)

# Get jobs as contractor
@router.get("/{user_id}/jobs-as-contractor", response_model=List[schemas.JobOut])
def get_user_jobs_as_contractor(user_id: int, db: Session = Depends(get_db)):
    """Obtener todos los trabajos donde el usuario es el contratador"""
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return crud.get_jobs_by_contractor(db, user_id)