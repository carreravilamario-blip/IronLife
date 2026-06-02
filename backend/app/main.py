# ============================================================
#  main.py — Punto de entrada del servidor IronLife (FastAPI).
# ============================================================

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine
from app.models import Base
from app.routers import auth, entrenamiento

# Crea las tablas si no existen (seguro en producción: IF NOT EXISTS)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="IronLife API",
    version="0.1.0",
    # En producción ocultamos los docs para no exponer la API.
    docs_url=None if settings.is_production else "/docs",
    redoc_url=None if settings.is_production else "/redoc",
)

# ── CORS ──────────────────────────────────────────────────────
# Permite que el front-end llame a esta API.
# Los orígenes permitidos se configuran en .env (CORS_ORIGINS).
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(entrenamiento.router)


# ── Rutas generales ───────────────────────────────────────────
@app.get("/")
def inicio():
    return {"app": "IronLife API", "version": "0.1.0", "env": settings.APP_ENV}


@app.get("/api/health")
def health():
    return {"estado": "ok"}
