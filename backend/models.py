from sqlalchemy import (
    Column, Integer, String, Text, ForeignKey, Numeric,
    Boolean, Date, TIMESTAMP
)
from sqlalchemy.orm import relationship
from .database import Base

# ==========================
# 1️⃣ Usuario
# ==========================
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(Text, nullable=False)
    phone = Column(String(20))
    role = Column(String(20), nullable=False)  # vendedor / contratador
    profile_picture_url = Column(Text)  # URL or path to profile picture
    location = Column(String(200))  # User location
    bio = Column(Text)  # User biography
    created_at = Column(TIMESTAMP)
    updated_at = Column(TIMESTAMP)

    # Relaciones
    skills = relationship("UserSkill", back_populates="user")
    services = relationship("Service", back_populates="vendor", cascade="all, delete-orphan")
    jobs_as_vendor = relationship("Job", back_populates="vendor_user", foreign_keys="Job.vendor_id")
    jobs_as_contractor = relationship("Job", back_populates="contractor_user", foreign_keys="Job.contractor_id")


# ==========================
# Habilidad
# ==========================
class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(Text)

    users = relationship("UserSkill", back_populates="skill")


# ==========================
# Relación Usuario-Habilidad
# ==========================
class UserSkill(Base):
    __tablename__ = "user_skills"

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    skill_id = Column(Integer, ForeignKey("skills.id", ondelete="CASCADE"), primary_key=True)

    user = relationship("User", back_populates="skills")
    skill = relationship("Skill", back_populates="users")


# ==========================
#  Servicio
# ==========================
class Service(Base):
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    skill_id = Column(Integer, ForeignKey("skills.id", ondelete="SET NULL"))  # nueva columna
    title = Column(String(100), nullable=False)
    description = Column(Text)
    price = Column(Numeric(10, 2), nullable=False)
    is_active = Column(Boolean, default=True)
    image_url = Column(Text, nullable=True)  # Nueva: foto del servicio
    created_at = Column(TIMESTAMP)

    # Relaciones
    vendor = relationship("User", back_populates="services")
    skill = relationship("Skill")  # relación directa con Skill
    jobs = relationship("Job", back_populates="service", cascade="all, delete-orphan")


# ==========================
# Trabajo
# ==========================
class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    contractor_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    vendor_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    service_id = Column(Integer, ForeignKey("services.id"))
    status = Column(String(20), default="pendiente")
    start_date = Column(Date)
    end_date = Column(Date)
    total_amount = Column(Numeric(10, 2))
    client_confirmed = Column(Boolean, default=False)
    vendor_confirmed = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP)

    service = relationship("Service", back_populates="jobs")
    contractor_user = relationship("User", back_populates="jobs_as_contractor", foreign_keys=[contractor_id])
    vendor_user = relationship("User", back_populates="jobs_as_vendor", foreign_keys=[vendor_id])
    reviews = relationship("Review", back_populates="job", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="job", cascade="all, delete-orphan")


# ==========================
# Reseña
# ==========================
class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"))
    rating = Column(Integer)
    comment = Column(Text)
    created_at = Column(TIMESTAMP)

    job = relationship("Job", back_populates="reviews")


# ==========================
# Pago
# ==========================
class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"))
    amount = Column(Numeric(10, 2), nullable=False)
    method = Column(String(50))
    status = Column(String(20), default="pendiente")
    created_at = Column(TIMESTAMP)

    job = relationship("Job", back_populates="payments")
