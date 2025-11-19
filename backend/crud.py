from sqlalchemy.orm import Session
from sqlalchemy import desc, text
from sqlalchemy import func
from . import models, schemas
from datetime import datetime
from passlib.context import CryptContext

# Inicializa el hasher de contraseñas
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

def hash_password(password: str) -> str:
    """
    Hashea la contraseña usando passlib + argon2.
    """
    if not isinstance(password, str):
        raise ValueError("Password must be a string")
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifica que la contraseña en texto plano coincida con el hash usando argon2.
    """
    if not isinstance(plain_password, str):
        raise ValueError("Password must be a string")
    return pwd_context.verify(plain_password, hashed_password)

# ==========================
# Usuarios
# ==========================
def create_user(db: Session, user: schemas.UserCreate):
    db_user = models.User(
        name=user.name,
        email=user.email,
        phone=user.phone,
        role=user.role,
        password_hash=hash_password(user.password),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_users(db: Session):
    return db.query(models.User).all()

# Obtener un usuario por id
def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()


def update_user(db: Session, user_id: int, user_update: schemas.UserUpdate):
    """Actualizar información del usuario"""
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        return None
    
    # Update only provided fields
    if user_update.name is not None:
        db_user.name = user_update.name
    if user_update.phone is not None:
        db_user.phone = user_update.phone
    if user_update.profile_picture_url is not None:
        db_user.profile_picture_url = user_update.profile_picture_url
    if user_update.location is not None:
        db_user.location = user_update.location
    if user_update.bio is not None:
        db_user.bio = user_update.bio
    
    db_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_user)
    return db_user


# ==========================
# Servicios
# ==========================
def create_service(db: Session, service: schemas.ServiceCreate):
    db_service = models.Service(
        vendor_id=service.vendor_id,
        skill_id=service.skill_id,  # 🔹 asociamos la skill
        title=service.title,
        description=service.description,
        price=service.price,
        is_active=service.is_active,
        created_at=datetime.utcnow()
    )
    db.add(db_service)
    db.commit()
    db.refresh(db_service)
    return db_service

def get_services(db: Session):
    # Incluye la relación con skill para que ServiceOut pueda mostrarla
    return db.query(models.Service).join(models.Skill).all()

def search_services(
    db: Session,
    query: str = "",
    skill_ids: list[int] = None,
    min_price: float = None,
    max_price: float = None,
    min_rating: float = None,
    sort_by: str = "relevance"
):
    q = db.query(models.Service).join(models.Skill, isouter=True)

    # 🔹 Full Text Search (PostgreSQL)
    if query:
        ts_query = func.plainto_tsquery('spanish', query)
        q = q.filter(
            func.to_tsvector('spanish', models.Service.title + ' ' + models.Service.description)
            .op('@@')(ts_query)
        )

    # 🔹 Filtrar por skills
    if skill_ids:
        q = q.filter(models.Service.skill_id.in_(skill_ids))

    # 🔹 Filtros de precio
    if min_price is not None:
        q = q.filter(models.Service.price >= min_price)
    if max_price is not None:
        q = q.filter(models.Service.price <= max_price)

    # 🔹 Filtro por rating promedio
    if min_rating is not None:
        q = q.join(models.Service.reviews, isouter=True) \
             .group_by(models.Service.id) \
             .having(func.avg(models.Review.rating) >= min_rating)

    # 🔹 Ordenamiento
    if sort_by == "price_asc":
        q = q.order_by(models.Service.price.asc())
    elif sort_by == "price_desc":
        q = q.order_by(models.Service.price.desc())
    elif sort_by == "rating_desc":
        q = q.join(models.Service.reviews, isouter=True) \
             .group_by(models.Service.id) \
             .order_by(func.avg(models.Review.rating).desc())
    elif sort_by == "relevance" and query:
        rank_expr = func.ts_rank_cd(
            func.to_tsvector('spanish', models.Service.title + ' ' + models.Service.description),
            func.plainto_tsquery('spanish', query)
        ).label('rank')

        q = q.add_columns(rank_expr).order_by(desc(text("rank")))


    return q.all()


def update_service(db: Session, service_id: int, service: schemas.ServiceUpdate):
    """Actualizar un servicio existente"""
    db_service = db.query(models.Service).filter(models.Service.id == service_id).first()
    if not db_service:
        return None
    
    # Update only provided fields
    if service.title is not None:
        db_service.title = service.title
    if service.description is not None:
        db_service.description = service.description
    if service.price is not None:
        db_service.price = service.price
    if service.skill_id is not None:
        db_service.skill_id = service.skill_id
    if service.is_active is not None:
        db_service.is_active = service.is_active
    if service.image_url is not None:
        db_service.image_url = service.image_url
    
    db.commit()
    db.refresh(db_service)
    return db_service


def delete_service(db: Session, service_id: int):
    """Eliminar un servicio"""
    db_service = db.query(models.Service).filter(models.Service.id == service_id).first()
    if not db_service:
        return None
    
    db.delete(db_service)
    db.commit()
    return True



# ==========================
# Skills
# ==========================
def get_skills(db: Session):
    return db.query(models.Skill).all()

def assign_skills(db: Session, user_id: int, skill_ids: list[int]):
    # Agregamos las nuevas skills si no existen
    for skill_id in skill_ids:
        # Verificar si ya existe
        existing_skill = db.query(models.UserSkill).filter(
            models.UserSkill.user_id == user_id,
            models.UserSkill.skill_id == skill_id
        ).first()
        
        if not existing_skill:
            db_skill = models.UserSkill(user_id=user_id, skill_id=skill_id)
            db.add(db_skill)
            
    db.commit()

    return {"user_id": user_id, "skills_assigned": skill_ids}


def get_user_skills(db: Session, user_id: int):
    """Obtener todas las skills de un usuario"""
    user_skills = db.query(models.UserSkill).filter(models.UserSkill.user_id == user_id).all()
    return user_skills


def remove_user_skill(db: Session, user_id: int, skill_id: int):
    """Eliminar una skill de un usuario"""
    user_skill = db.query(models.UserSkill).filter(
        models.UserSkill.user_id == user_id,
        models.UserSkill.skill_id == skill_id
    ).first()
    
    if not user_skill:
        return None
    
    db.delete(user_skill)
    db.commit()
    return {"message": "Skill eliminada exitosamente", "user_id": user_id, "skill_id": skill_id}


def get_services_by_vendor(db: Session, vendor_id: int):
    """Obtener todos los servicios de un vendedor"""
    services = db.query(models.Service).filter(models.Service.vendor_id == vendor_id).all()
    return services


def get_jobs_by_vendor(db: Session, vendor_id: int):
    """Obtener todos los trabajos donde el usuario es el vendedor"""
    jobs = db.query(models.Job).filter(models.Job.vendor_id == vendor_id).all()
    return jobs


def get_jobs_by_contractor(db: Session, contractor_id: int):
    """Obtener todos los trabajos donde el usuario es el contratador"""
    jobs = db.query(models.Job).filter(models.Job.contractor_id == contractor_id).all()
    return jobs
