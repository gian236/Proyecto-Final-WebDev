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


# ==========================
# Skills
# ==========================
def get_skills(db: Session):
    return db.query(models.Skill).all()

def assign_skills(db: Session, user_id: int, skill_ids: list[int]):
    # Primero borramos las skills existentes del usuario (opcional)
    db.query(models.UserSkill).filter(models.UserSkill.user_id == user_id).delete()

    # Ahora agregamos las nuevas skills
    for skill_id in skill_ids:
        db_skill = models.UserSkill(user_id=user_id, skill_id=skill_id)
        db.add(db_skill)
    db.commit()

    return {"user_id": user_id, "skills_assigned": skill_ids}


