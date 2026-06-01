# ============================================================
#  security.py — Hashing de contraseñas y tokens JWT.
#
#  La config (SECRET_KEY, ALGORITHM, etc.) viene de app.config.
#  No hay load_dotenv() ni os.getenv() aquí.
# ============================================================

from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from app.config import settings


# ── Contraseñas ───────────────────────────────────────────────

def hashear_password(password: str) -> str:
    """Convierte una contraseña en texto plano en un hash bcrypt seguro.
    El hash es irreversible: ni nosotros podemos recuperar la contraseña."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verificar_password(password: str, hash_guardado: str) -> bool:
    """Comprueba si una contraseña coincide con su hash bcrypt."""
    return bcrypt.checkpw(password.encode("utf-8"), hash_guardado.encode("utf-8"))


# ── Tokens JWT ────────────────────────────────────────────────

def crear_token_acceso(datos: dict) -> str:
    """Crea un token JWT firmado con fecha de caducidad."""
    payload = datos.copy()
    payload["exp"] = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decodificar_token(token: str) -> dict | None:
    """Verifica firma y caducidad de un token.
    Devuelve su contenido, o None si es inválido o ha expirado."""
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except jwt.PyJWTError:
        return None
