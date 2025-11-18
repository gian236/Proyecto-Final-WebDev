# backend/routers/services.py
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy.sql import text
from typing import Optional, List
from ..database import get_db
from .. import crud, schemas  # si los usas en otras rutas del archivo

router = APIRouter(prefix="/services", tags=["services"])

@router.post("/", response_model=schemas.ServiceOut)
def create_service(service: schemas.ServiceCreate, db: Session = Depends(get_db)):
    return crud.create_service(db, service)

@router.get("/", response_model=list[schemas.ServiceOut])
def get_services(db: Session = Depends(get_db)):
    return crud.get_services(db)


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
            COALESCE(rps.avg_rating, 0) AS avg_rating_calc,
            u.id AS vendor_id_sel,
            u.name AS vendor_name,
            u.email AS vendor_email,
            u.phone AS vendor_phone,
            u.role AS vendor_role,
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

    # <-- crucial: use .mappings().all() to get dict-like rows accesible por nombre
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
            "vendor": {
                "id": row["vendor_id_sel"],
                "name": row["vendor_name"],
                "email": row["vendor_email"],
                "phone": row["vendor_phone"],
                "role": row["vendor_role"],
                "created_at": row["vendor_created_at"],
                "updated_at": row["vendor_updated_at"],
            },
            "skill": skill_data,  # ahora puede ser None
        })


    return services
