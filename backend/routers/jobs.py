# backend/routers/jobs.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import crud, schemas, models

router = APIRouter(prefix="/jobs", tags=["jobs"])

@router.post("/", response_model=schemas.JobOut)
def create_job(job: schemas.JobCreate, db: Session = Depends(get_db)):
    """Crear un nuevo trabajo (contratación de servicio)"""
    # Verificar que el servicio existe
    service = db.query(models.Service).filter(models.Service.id == job.service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    
    # Crear el trabajo
    db_job = models.Job(
        contractor_id=job.contractor_id,
        vendor_id=job.vendor_id,
        service_id=job.service_id,
        status=job.status or "pendiente",
        start_date=job.start_date,
        end_date=job.end_date,
        total_amount=job.total_amount or service.price
    )
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job

@router.get("/", response_model=List[schemas.JobOut])
def get_jobs(db: Session = Depends(get_db)):
    """Obtener todos los trabajos"""
    return db.query(models.Job).all()

@router.get("/{job_id}", response_model=schemas.JobOut)
def get_job(job_id: int, db: Session = Depends(get_db)):
    """Obtener un trabajo específico por ID"""
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Trabajo no encontrado")
    return job

@router.get("/user/{user_id}", response_model=List[schemas.JobOut])
def get_user_jobs(user_id: int, db: Session = Depends(get_db)):
    """Obtener todos los trabajos de un usuario (como contratador o vendedor)"""
    jobs = db.query(models.Job).filter(
        (models.Job.contractor_id == user_id) | (models.Job.vendor_id == user_id)
    ).all()
    return jobs


@router.get("/vendor/{vendor_id}", response_model=List[schemas.JobOut])
def get_vendor_jobs(vendor_id: int, db: Session = Depends(get_db)):
    """Obtener todos los trabajos donde el usuario es el vendedor"""
    jobs = db.query(models.Job).filter(models.Job.vendor_id == vendor_id).all()
    return jobs


@router.get("/contractor/{contractor_id}", response_model=List[schemas.JobOut])
def get_contractor_jobs(contractor_id: int, db: Session = Depends(get_db)):
    """Obtener todos los trabajos donde el usuario es el contratador"""
    jobs = db.query(models.Job).filter(models.Job.contractor_id == contractor_id).all()
    return jobs


from pydantic import BaseModel

class JobAction(BaseModel):
    user_id: int

@router.put("/{job_id}/accept")
def accept_job(job_id: int, action: JobAction, db: Session = Depends(get_db)):
    """El vendedor acepta el trabajo"""
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Trabajo no encontrado")
    
    if job.vendor_id != action.user_id:
        raise HTTPException(status_code=403, detail="Solo el vendedor puede aceptar el trabajo")
        
    if job.status != "pendiente":
        raise HTTPException(status_code=400, detail="El trabajo no está pendiente")
        
    job.status = "en_progreso"
    db.commit()
    db.refresh(job)
    return job

@router.put("/{job_id}/complete")
def complete_job(job_id: int, action: JobAction, db: Session = Depends(get_db)):
    """Confirmar finalización del trabajo (requiere confirmación de ambas partes)"""
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Trabajo no encontrado")
        
    if action.user_id == job.contractor_id:
        job.client_confirmed = True
    elif action.user_id == job.vendor_id:
        job.vendor_confirmed = True
    else:
        raise HTTPException(status_code=403, detail="Usuario no autorizado para este trabajo")
        
    if job.client_confirmed and job.vendor_confirmed:
        job.status = "completado"
        
    db.commit()
    db.refresh(job)
    return job

@router.put("/{job_id}/status")
def update_job_status(job_id: int, status: str, db: Session = Depends(get_db)):
    """Actualizar el estado de un trabajo (Admin/Debug)"""
    valid_statuses = ["pendiente", "en_progreso", "completado", "cancelado"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Estado inválido. Debe ser uno de: {valid_statuses}")
    
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Trabajo no encontrado")
    
    job.status = status
    db.commit()
    db.refresh(job)
    return {"message": "Estado actualizado exitosamente", "job": job}
