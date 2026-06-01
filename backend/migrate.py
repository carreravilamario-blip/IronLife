# ============================================================
#  migrate.py — Añade columnas nuevas a tablas existentes.
#  Ejecutar con: python migrate.py
# ============================================================
from sqlalchemy import text
from app.database import engine

migrations = [
    "ALTER TABLE sesiones ADD COLUMN IF NOT EXISTS duracion_minutos INTEGER;",
]

with engine.connect() as conn:
    for sql in migrations:
        try:
            conn.execute(text(sql))
            print(f"OK: {sql}")
        except Exception as e:
            print(f"SKIP (posiblemente ya existe): {e}")
    conn.commit()
    print("Migracion completada.")

if __name__ == "__main__":
    pass
