# ============================================================
#  Script para crear las tablas en la base de datos.
#  Ejecutar una vez con:  python create_tables.py
#  (con el entorno virtual activado)
# ============================================================

from app.database import Base, engine

# Importamos los modelos para que SQLAlchemy los "conozca" y sepa
# que tablas tiene que crear.
from app import models  # noqa: F401  (se importa por su efecto, aunque no se use directamente)

print("Creando tablas en la base de datos...")
Base.metadata.create_all(bind=engine)
print("Tablas creadas correctamente.")
