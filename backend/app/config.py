# ============================================================
#  config.py — Configuración centralizada de la aplicación.
#
#  Usa pydantic-settings: lee las variables del .env y las
#  valida al arrancar. Si falta alguna obligatoria, la app
#  falla inmediatamente con un mensaje claro (no a mitad de
#  una petición).
#
#  USO: importa "settings" desde cualquier módulo:
#       from app.config import settings
#       print(settings.DATABASE_URL)
# ============================================================

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # ── Base de datos ──────────────────────────────────────
    DATABASE_URL: str

    # ── JWT / Seguridad ────────────────────────────────────
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 horas por defecto

    # ── Orígenes CORS permitidos (separados por coma) ──────
    # Ejemplo: "http://localhost:5173,https://ironlife.app"
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"

    # ── Entorno ────────────────────────────────────────────
    # "development" o "production". En producción se pueden
    # activar comportamientos más estrictos.
    APP_ENV: str = "development"

    # Pydantic-settings lee automáticamente el archivo .env
    # que esté junto al directorio de trabajo al arrancar.
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,  # DATABASE_URL ≠ database_url
        extra="ignore",       # ignora variables desconocidas en el .env
    )

    @property
    def is_production(self) -> bool:
        return self.APP_ENV == "production"

    @property
    def cors_origins_list(self) -> list[str]:
        """Devuelve la lista de orígenes CORS como lista de strings."""
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


# Instancia única compartida por toda la aplicación.
# Se crea una sola vez al importar este módulo.
settings = Settings()
