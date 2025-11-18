from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date, datetime

# ==========================
# 1️⃣ Usuario
# ==========================
class UserBase(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    role: str  # "vendedor" o "contratador"

class UserCreate(UserBase):
    password: str  # viene sin hash desde el frontend

class UserOut(UserBase):
    id: int
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        orm_mode = True


class UserLogin(BaseModel):
    email: str
    password: str


# ==========================
# 2️⃣ Habilidad
# ==========================
class SkillBase(BaseModel):
    name: str
    description: Optional[str] = None

class SkillCreate(SkillBase):
    pass

class SkillOut(SkillBase):
    id: int
    class Config:
        orm_mode = True


# ==========================
# 3️⃣ Relación Usuario-Habilidad
# ==========================
class UserSkillOut(BaseModel):
    user_id: int
    skill: SkillOut
    class Config:
        orm_mode = True


# ==========================
# 4️⃣ Servicio
# ==========================
class ServiceBase(BaseModel):
    title: str
    description: Optional[str] = None
    price: float
    is_active: Optional[bool] = True

class ServiceCreate(ServiceBase):
    vendor_id: int
    skill_id: int  # 🔹 nueva línea

class ServiceOut(ServiceBase):
    id: int
    created_at: Optional[datetime]
    vendor: UserOut
    skill: Optional[SkillOut]  # <- antes era sin Optional
    class Config:
        orm_mode = True



# ==========================
# 5️⃣ Trabajo
# ==========================
class JobBase(BaseModel):
    status: Optional[str] = "pendiente"
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    total_amount: Optional[float] = None

class JobCreate(JobBase):
    contractor_id: int
    vendor_id: int
    service_id: int

class JobOut(JobBase):
    id: int
    created_at: Optional[datetime]
    contractor_user: UserOut
    vendor_user: UserOut
    service: ServiceOut
    class Config:
        orm_mode = True


# ==========================
# 6️⃣ Reseña
# ==========================
class ReviewBase(BaseModel):
    rating: int
    comment: Optional[str] = None

class ReviewCreate(ReviewBase):
    job_id: int

class ReviewOut(ReviewBase):
    id: int
    created_at: Optional[datetime]
    job_id: int
    class Config:
        orm_mode = True


# ==========================
# 7️⃣ Pago
# ==========================
class PaymentBase(BaseModel):
    amount: float
    method: Optional[str] = None
    status: Optional[str] = "pendiente"

class PaymentCreate(PaymentBase):
    job_id: int

class PaymentOut(PaymentBase):
    id: int
    created_at: Optional[datetime]
    job_id: int
    class Config:
        orm_mode = True
