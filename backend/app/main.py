# ============================================================
#  main.py — Punto de entrada del servidor IronLife (FastAPI).
# ============================================================

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine
from app.models import Base
from app.routers import auth, entrenamiento


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    _seed_if_empty()
    yield


def _seed_if_empty():
    from app.database import SessionLocal
    from app.models import Ejercicio
    from scripts.seed import sembrar
    db = SessionLocal()
    try:
        if db.query(Ejercicio).count() == 0:
            sembrar()
    finally:
        db.close()


app = FastAPI(
    title="IronLife API",
    version="0.1.0",
    lifespan=lifespan,
    docs_url=None if settings.is_production else "/docs",
    redoc_url=None if settings.is_production else "/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(entrenamiento.router)


@app.get("/")
def inicio():
    return {"app": "IronLife API", "version": "0.1.0", "env": settings.APP_ENV}


@app.get("/api/health")
def health():
    return {"estado": "ok"}
