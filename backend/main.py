from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from . import models
from .database import engine
from .routers import users, services, skills
import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Backend de Marketplace de Servicios")

# --- CORS ---
origins = [
    "http://localhost:3000",  # frontend React
    "http://127.0.0.1:3000",  # por si React corre con esta URL
]

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

@app.get("/")
def root():
    return {"message": "Backend funcionando correctamente 🚀"}
