# ============================================================
#  Rutas de autenticacion: registro, login y "quien soy yo".
# ============================================================

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Usuario
from app.schemas import Token, UsuarioCrear, UsuarioPublico
from app.security import crear_token_acceso, decodificar_token, hashear_password, verificar_password

# Un "router" agrupa rutas relacionadas. El prefijo se añade a todas:
# p.ej. la ruta "/registro" sera en realidad "/api/auth/registro".
router = APIRouter(prefix="/api/auth", tags=["autenticacion"])

# Le dice a FastAPI de donde sale el token (para el boton "Authorize" de /docs).
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")


# --------- REGISTRO ---------

@router.post("/registro", response_model=UsuarioPublico, status_code=status.HTTP_201_CREATED)
def registrar(datos: UsuarioCrear, db: Session = Depends(get_db)):
    # 1) Comprobar que el email no este ya registrado.
    existe = db.query(Usuario).filter(Usuario.email == datos.email).first()
    if existe:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ese email ya esta registrado",
        )

    # 2) Crear el usuario guardando la contraseña SIEMPRE cifrada.
    usuario = Usuario(
        email=datos.email,
        nombre=datos.nombre,
        password_hash=hashear_password(datos.password),
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)  # recarga el usuario con su id ya asignado
    return usuario


# --------- LOGIN ---------

@router.post("/login", response_model=Token)
def login(datos: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # OAuth2PasswordRequestForm trae los campos "username" y "password".
    # Aqui usamos "username" como el email.
    usuario = db.query(Usuario).filter(Usuario.email == datos.username).first()

    # Si no existe el usuario O la contraseña no coincide -> error.
    # Damos el mismo mensaje en ambos casos por seguridad (no revelamos
    # si el email existe o no).
    if not usuario or not verificar_password(datos.password, usuario.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
        )

    # Creamos un token que guarda el id del usuario en el campo "sub".
    token = crear_token_acceso({"sub": str(usuario.id)})
    return Token(access_token=token)


# --------- DEPENDENCIA: usuario actual ---------
# Esta funcion se usara en cualquier ruta que requiera estar logueado.
# Lee el token, lo verifica y devuelve el usuario correspondiente.

def obtener_usuario_actual(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Usuario:
    error_credenciales = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No autenticado o token invalido",
        headers={"WWW-Authenticate": "Bearer"},
    )

    contenido = decodificar_token(token)
    if contenido is None:
        raise error_credenciales

    usuario_id = contenido.get("sub")
    if usuario_id is None:
        raise error_credenciales

    usuario = db.query(Usuario).filter(Usuario.id == int(usuario_id)).first()
    if usuario is None:
        raise error_credenciales

    return usuario


# --------- RUTA PROTEGIDA DE PRUEBA ---------

@router.get("/yo", response_model=UsuarioPublico)
def quien_soy(usuario_actual: Usuario = Depends(obtener_usuario_actual)):
    """Devuelve los datos del usuario logueado. Requiere token valido."""
    return usuario_actual
