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

from app.database import SessionLocal
from app.models import Ejercicio

def _seed_ejercicios_si_vacio():
    db = SessionLocal()
    try:
        if db.query(Ejercicio).count() == 0:
            ejercicios = [
                ("Press banca","PECHO"),("Press inclinado mancuernas","PECHO"),("Aperturas mancuernas","PECHO"),
                ("Fondos","PECHO"),("Press declinado","PECHO"),("Pullover","PECHO"),
                ("Dominadas","ESPALDA"),("Remo con barra","ESPALDA"),("Jalon al pecho","ESPALDA"),
                ("Remo en polea","ESPALDA"),("Remo con mancuerna","ESPALDA"),("Peso muerto","ESPALDA"),
                ("Face pull","ESPALDA"),("Encogimientos","ESPALDA"),
                ("Press militar","HOMBROS"),("Elevaciones laterales","HOMBROS"),("Elevaciones frontales","HOMBROS"),
                ("Pajaros","HOMBROS"),("Press Arnold","HOMBROS"),
                ("Curl con barra","BICEPS"),("Curl martillo","BICEPS"),("Curl concentrado","BICEPS"),
                ("Curl en polea","BICEPS"),("Curl inclinado","BICEPS"),
                ("Extension triceps polea","TRICEPS"),("Press frances","TRICEPS"),("Fondos en banco","TRICEPS"),
                ("Patada de triceps","TRICEPS"),("Extension sobre cabeza","TRICEPS"),
                ("Sentadilla","CUADRICEPS"),("Prensa","CUADRICEPS"),("Extension de cuadriceps","CUADRICEPS"),
                ("Zancadas","CUADRICEPS"),("Sentadilla bulgara","CUADRICEPS"),("Hack squat","CUADRICEPS"),
                ("Peso muerto rumano","ISQUIOS"),("Curl femoral","ISQUIOS"),("Buenos dias","ISQUIOS"),
                ("Hip thrust","GLUTEOS"),("Patada de gluteo","GLUTEOS"),("Abduccion","GLUTEOS"),
                ("Elevacion de gemelos de pie","GEMELOS"),("Elevacion de gemelos sentado","GEMELOS"),
                ("Crunch","ABDOMINALES"),("Plancha","ABDOMINALES"),("Rueda abdominal","ABDOMINALES"),
                ("Elevacion de piernas","ABDOMINALES"),("Russian twist","ABDOMINALES"),
                ("Burpees","FUNCIONAL"),("Kettlebell swing","FUNCIONAL"),("TRX remo","FUNCIONAL"),
            ]
            for nombre, grupo in ejercicios:
                db.add(Ejercicio(nombre=nombre, grupo_muscular=grupo, es_personalizado=False))
            db.commit()
    finally:
        db.close()

_seed_ejercicios_si_vacio()

def _migraciones():
    from sqlalchemy import text
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE sesiones ADD COLUMN IF NOT EXISTS duracion_minutos INTEGER;"))
        conn.commit()

_migraciones()

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
