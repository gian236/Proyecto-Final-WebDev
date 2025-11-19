# backend/routers/reviews.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import crud, schemas, models

router = APIRouter(prefix="/reviews", tags=["reviews"])

@router.post("/", response_model=schemas.ReviewOut)
def create_review(review: schemas.ReviewCreate, db: Session = Depends(get_db)):
    """Crear una nueva reseña para un trabajo completado"""
    # Verificar si el job existe
    job = db.query(models.Job).filter(models.Job.id == review.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Trabajo no encontrado")
    
    # Verificar si ya existe una review para este job
    existing_review = db.query(models.Review).filter(models.Review.job_id == review.job_id).first()
    if existing_review:
        raise HTTPException(status_code=400, detail="Ya existe una reseña para este trabajo")

    db_review = models.Review(
        job_id=review.job_id,
        rating=review.rating,
        comment=review.comment
    )
    db.add(db_review)
    db.commit()
    db.refresh(db_review)
    return db_review

@router.get("/service/{service_id}", response_model=List[schemas.ReviewOut])
def get_service_reviews(service_id: int, db: Session = Depends(get_db)):
    """Obtener todas las reseñas de un servicio específico"""
    # Hacemos un join con Job para filtrar por service_id
    reviews = db.query(models.Review).join(models.Job).filter(models.Job.service_id == service_id).all()
    return reviews
