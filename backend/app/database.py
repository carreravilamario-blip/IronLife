# ============================================================
#  database.py — Conexión a PostgreSQL vía SQLAlchemy.
#
#  Todas las variables de config se obtienen de app.config
#  (fuente única de verdad). No hay load_dotenv() aquí.
# ============================================================

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.config import settings

# Motor de conexión con la base de datos.
engine = create_engine(settings.DATABASE_URL)

# Fábrica de sesiones: cada petición HTTP obtiene una sesión
# nueva que se cierra automáticamente al terminar.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Clase base de la que heredan todos los modelos (tablas).
Base = declarative_base()


def get_db():
    """Dependencia de FastAPI: entrega una sesión y la cierra al acabar."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
