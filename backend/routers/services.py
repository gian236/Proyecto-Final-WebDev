# backend/routers/services.py
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.sql import text
from typing import Optional, List
from ..database import get_db
from .. import crud, schemas

router = APIRouter(prefix="/services", tags=["services"])

@router.post("/", response_model=schemas.ServiceOut)
def create_service(service: schemas.ServiceCreate, db: Session = Depends(get_db)):
    return crud.create_service(db, service)

@router.get("/", response_model=list[schemas.ServiceOut])
def get_services(db: Session = Depends(get_db)):
    return crud.get_services(db)

# ⚠️ IMPORTANTE: /search debe estar ANTES de /{service_id}
# porque FastAPI evalúa las rutas en orden y "search" podría
# ser interpretado como un service_id si está después
@router.get("/search", response_model=list[schemas.ServiceOut])
def search_services(
    db: Session = Depends(get_db),
    query: Optional[str] = Query("", description="Texto a buscar (full text search)"),
    skill_ids: Optional[List[int]] = Query(None, description="IDs de skills, p.ej. ?skill_ids=1&skill_ids=2"),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    min_rating: Optional[float] = Query(None),
    sort_by: Optional[str] = Query("relevance", description="relevance | price_asc | price_desc | rating_desc")
):
    params = {
        "query": query or "",
        "to_tsvector_lang": "spanish",
        "plainto_tsquery_lang": "spanish"
    }

    filters = ["TRUE"]
    if skill_ids:
        filters.append("s.skill_id = ANY(:skill_ids)")
        params["skill_ids"] = skill_ids
    if min_price is not None:
        filters.append("s.price >= :min_price")
        params["min_price"] = min_price
    if max_price is not None:
        filters.append("s.price <= :max_price")
        params["max_price"] = max_price
    if min_rating is not None:
        filters.append("COALESCE(rps.avg_rating, 0) >= :min_rating")
        params["min_rating"] = min_rating

    where_clause = " AND ".join(filters)

    if sort_by == "price_asc":
        order_clause = "s.price ASC"
    elif sort_by == "price_desc":
        order_clause = "s.price DESC"
    elif sort_by == "rating_desc":
        order_clause = "COALESCE(rps.avg_rating, 0) DESC NULLS LAST"
    else:
        order_clause = "rank DESC"

    query_text = text(f"""
        WITH reviews_per_service AS (
            SELECT j.service_id AS service_id, AVG(r.rating) as avg_rating
            FROM jobs j
            LEFT JOIN reviews r ON r.job_id = j.id
            GROUP BY j.service_id
        )
        SELECT
            s.id,
            s.vendor_id,
            s.skill_id,
            s.title,
            s.description,
            s.price,
            s.is_active,
            s.created_at,
            s.image_url,
            COALESCE(rps.avg_rating, 0) AS avg_rating_calc,
            u.id AS vendor_id_sel,
            u.name AS vendor_name,
            u.email AS vendor_email,
            u.phone AS vendor_phone,
            u.role AS vendor_role,
            u.profile_picture_url AS vendor_profile_picture_url,
            u.created_at AS vendor_created_at,
            u.updated_at AS vendor_updated_at,
            sk.id AS skill_id_sel,
            sk.name AS skill_name,
            ts_rank_cd(
                to_tsvector(:to_tsvector_lang, COALESCE(s.title,'') || ' ' || COALESCE(s.description,'')),
                plainto_tsquery(:plainto_tsquery_lang, :query)
            ) AS rank
        FROM services s
        LEFT JOIN reviews_per_service rps ON rps.service_id = s.id
        LEFT JOIN users u ON u.id = s.vendor_id
        LEFT JOIN skills sk ON sk.id = s.skill_id
        WHERE {where_clause}
        ORDER BY {order_clause}
    """)

    result = db.execute(query_text, params).mappings().all()

    services = []
    for row in result:
        skill_data = None
        if row["skill_id_sel"] is not None:
            skill_data = {
                "id": row["skill_id_sel"],
                "name": row["skill_name"],
                "description": None
            }

        services.append({
            "id": row["id"],
            "title": row["title"],
            "description": row["description"],
            "price": float(row["price"]) if row["price"] is not None else None,
            "is_active": bool(row["is_active"]) if row["is_active"] is not None else True,
            "created_at": row["created_at"],
            "image_url": row["image_url"],
            "vendor": {
                "id": row["vendor_id_sel"],
                "name": row["vendor_name"],
                "email": row["vendor_email"],
                "phone": row["vendor_phone"],
                "role": row["vendor_role"],
                "profile_picture_url": row["vendor_profile_picture_url"],
                "created_at": row["vendor_created_at"],
                "updated_at": row["vendor_updated_at"],
            },
            "skill": skill_data,
        })

    return services


@router.get("/vendor/{vendor_id}", response_model=list[schemas.ServiceOut])
def get_vendor_services(vendor_id: int, db: Session = Depends(get_db)):
    """Obtener todos los servicios de un vendedor específico"""
    
    query_text = text("""
        WITH reviews_per_service AS (
            SELECT j.service_id AS service_id, AVG(r.rating) as avg_rating
            FROM jobs j
            LEFT JOIN reviews r ON r.job_id = j.id
            GROUP BY j.service_id
        )
        SELECT
            s.id,
            s.vendor_id,
            s.skill_id,
            s.title,
            s.description,
            s.price,
            s.is_active,
            s.created_at,
            s.image_url,
            COALESCE(rps.avg_rating, 0) AS avg_rating_calc,
            u.id AS vendor_id_sel,
            u.name AS vendor_name,
            u.email AS vendor_email,
            u.phone AS vendor_phone,
            u.role AS vendor_role,
            u.profile_picture_url AS vendor_profile_picture_url,
            u.created_at AS vendor_created_at,
            u.updated_at AS vendor_updated_at,
            sk.id AS skill_id_sel,
            sk.name AS skill_name
        FROM services s
        LEFT JOIN reviews_per_service rps ON rps.service_id = s.id
        LEFT JOIN users u ON u.id = s.vendor_id
        LEFT JOIN skills sk ON sk.id = s.skill_id
        WHERE s.vendor_id = :vendor_id
        ORDER BY s.created_at DESC
    """)
    
    result = db.execute(query_text, {"vendor_id": vendor_id}).mappings().all()
    
    services = []
    for row in result:
        skill_data = None
        if row["skill_id_sel"] is not None:
            skill_data = {
                "id": row["skill_id_sel"],
                "name": row["skill_name"],
                "description": None
            }

        services.append({
            "id": row["id"],
            "title": row["title"],
            "description": row["description"],
            "price": float(row["price"]) if row["price"] is not None else None,
            "is_active": bool(row["is_active"]) if row["is_active"] is not None else True,
            "created_at": row["created_at"],
            "image_url": row["image_url"],
            "avg_rating": float(row["avg_rating_calc"]) if row["avg_rating_calc"] is not None else 0.0,
            "vendor": {
                "id": row["vendor_id_sel"],
                "name": row["vendor_name"],
                "email": row["vendor_email"],
                "phone": row["vendor_phone"],
                "role": row["vendor_role"],
                "profile_picture_url": row["vendor_profile_picture_url"],
                "created_at": row["vendor_created_at"],
                "updated_at": row["vendor_updated_at"],
            },
            "skill": skill_data,
        })

    return services



@router.get("/{service_id}", response_model=schemas.ServiceOut)
def get_service(service_id: int, db: Session = Depends(get_db)):
    """Obtener un servicio específico por ID con toda su información"""
    
    # Query con rating promedio
    query_text = text("""
        WITH reviews_per_service AS (
            SELECT j.service_id AS service_id, AVG(r.rating) as avg_rating
            FROM jobs j
            LEFT JOIN reviews r ON r.job_id = j.id
            GROUP BY j.service_id
        )
        SELECT
            s.id,
            s.vendor_id,
            s.skill_id,
            s.title,
            s.description,
            s.price,
            s.is_active,
            s.created_at,
            s.image_url,
            COALESCE(rps.avg_rating, 0) AS avg_rating_calc,
            u.id AS vendor_id_sel,
            u.name AS vendor_name,
            u.email AS vendor_email,
            u.phone AS vendor_phone,
            u.role AS vendor_role,
            u.profile_picture_url AS vendor_profile_picture_url,
            u.created_at AS vendor_created_at,
            u.updated_at AS vendor_updated_at,
            sk.id AS skill_id_sel,
            sk.name AS skill_name
        FROM services s
        LEFT JOIN reviews_per_service rps ON rps.service_id = s.id
        LEFT JOIN users u ON u.id = s.vendor_id
        LEFT JOIN skills sk ON sk.id = s.skill_id
        WHERE s.id = :service_id
    """)
    
    result = db.execute(query_text, {"service_id": service_id}).mappings().first()
    
    if not result:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    
    skill_data = None
    if result["skill_id_sel"] is not None:
        skill_data = {
            "id": result["skill_id_sel"],
            "name": result["skill_name"],
            "description": None
        }
    
    return {
        "id": result["id"],
        "title": result["title"],
        "description": result["description"],
        "price": float(result["price"]) if result["price"] is not None else None,
        "is_active": bool(result["is_active"]) if result["is_active"] is not None else True,
        "created_at": result["created_at"],
        "image_url": result["image_url"],
        "vendor": {
            "id": result["vendor_id_sel"],
            "name": result["vendor_name"],
            "email": result["vendor_email"],
            "phone": result["vendor_phone"],
            "role": result["vendor_role"],
            "profile_picture_url": result["vendor_profile_picture_url"],
            "created_at": result["vendor_created_at"],
            "updated_at": result["vendor_updated_at"],
        },
        "skill": skill_data,
    }


@router.put("/{service_id}", response_model=schemas.ServiceOut)
def update_service(service_id: int, service: schemas.ServiceUpdate, db: Session = Depends(get_db)):
    """Actualizar un servicio existente"""
    updated_service = crud.update_service(db, service_id, service)
    if not updated_service:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    return updated_service


@router.delete("/{service_id}")
def delete_service(service_id: int, db: Session = Depends(get_db)):
    """Eliminar un servicio"""
    result = crud.delete_service(db, service_id)
    if not result:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    return {"message": "Servicio eliminado exitosamente"}
