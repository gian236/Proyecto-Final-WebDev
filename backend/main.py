from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from . import models
from .database import engine
from .routers import users, services, skills, jobs, reviews

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Backend de Marketplace de Servicios")

import os
from dotenv import load_dotenv

load_dotenv()

# --- CORS ---
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

allowed_origins_env = os.getenv("ALLOWED_ORIGINS")
if allowed_origins_env:
    origins.extend([origin.strip() for origin in allowed_origins_env.split(",")])

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Usa la lista definida
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Rutas ---
app.include_router(users.router)
app.include_router(services.router)
app.include_router(skills.router)
app.include_router(jobs.router)
app.include_router(reviews.router)

@app.get("/")
def root():
    return {"message": "Backend funcionando correctamente 🚀"}
