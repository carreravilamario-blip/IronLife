# ============================================================
#  Schemas (Pydantic): definen la "forma" de los datos que
#  entran y salen de la API. FastAPI los valida automaticamente.
#
#  Diferencia con models.py:
#   - models.py  -> como se guardan los datos en la BASE DE DATOS
#   - schemas.py -> como viajan los datos por la API (entrada/salida)
# ============================================================

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


# --------- ENTRADA (lo que el cliente ENVIA) ---------

class UsuarioCrear(BaseModel):
    """Datos para registrar un usuario nuevo."""
    email: EmailStr  # Pydantic valida que sea un email valido
    nombre: str = Field(min_length=1, max_length=100)
    password: str = Field(min_length=6, max_length=72)


# --------- SALIDA (lo que la API DEVUELVE) ---------

class UsuarioPublico(BaseModel):
    """Datos del usuario que SI se pueden devolver (sin la contraseña)."""
    id: int
    email: EmailStr
    nombre: str
    creado_en: datetime

    # Permite crear este schema directamente desde un objeto de la BD.
    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    """El token que se devuelve al iniciar sesion."""
    access_token: str
    token_type: str = "bearer"


# ============================================================
#  EJERCICIOS, RUTINAS, SESIONES Y SERIES
# ============================================================

class EjercicioCrear(BaseModel):
    nombre: str = Field(min_length=1, max_length=120)
    grupo_muscular: str = Field(min_length=1, max_length=50)
    equipo: str = Field(min_length=1, max_length=50)


class EjercicioPublico(BaseModel):
    id: int
    nombre: str
    grupo_muscular: str
    equipo: str
    model_config = ConfigDict(from_attributes=True)


# ----- Rutinas -----

class RutinaCrear(BaseModel):
    nombre: str = Field(min_length=1, max_length=120)
    descripcion: str | None = None
    # Lista de ids de ejercicios que incluye la rutina (en orden).
    ejercicio_ids: list[int] = []


class RutinaPublica(BaseModel):
    id: int
    nombre: str
    descripcion: str | None
    ejercicios: list[EjercicioPublico] = []
    model_config = ConfigDict(from_attributes=True)


# ----- Series -----

class SerieCrear(BaseModel):
    ejercicio_id: int
    numero: int
    kg: float = 0
    reps: int = 0
    rir: int | None = None
    completada: bool = False


class SerieActualizar(BaseModel):
    # Todos opcionales: se actualiza solo lo que llegue.
    kg: float | None = None
    reps: int | None = None
    rir: int | None = None
    completada: bool | None = None


class SeriePublica(BaseModel):
    id: int
    ejercicio_id: int
    numero: int
    kg: float
    reps: int
    rir: int | None
    completada: bool
    model_config = ConfigDict(from_attributes=True)


# ----- Sesiones -----

class SesionCrear(BaseModel):
    rutina_id: int | None = None


class SesionPublica(BaseModel):
    id: int
    rutina_id: int | None
    fecha: datetime
    finalizada: bool
    series: list[SeriePublica] = []
    model_config = ConfigDict(from_attributes=True)


class SesionFinalizar(BaseModel):
    duracion_minutos: int | None = None


# ----- Comparacion con sesiones anteriores -----

class SerieAnterior(BaseModel):
    kg: float
    reps: int


class EjercicioAnterior(BaseModel):
    """Lo que hiciste la ultima vez en un ejercicio, para comparar."""
    ejercicio_id: int
    max_kg: float | None = None          # peso maximo levantado antes
    series: list[SerieAnterior] = []     # series de la ultima sesion


# ----- Historial de sesiones -----

class SerieHistorial(BaseModel):
    kg: float
    reps: int


class EjercicioHistorial(BaseModel):
    ejercicio_id: int
    nombre: str
    grupo_muscular: str
    series: list[SerieHistorial]


class SesionHistorialPublica(BaseModel):
    id: int
    fecha: str
    y: int
    m: int
    d: int
    rutina_id: int | None
    rutina_nombre: str | None
    duracion_minutos: int | None
    ejercicios: list[EjercicioHistorial]


# ----- Estadisticas -----

class PuntoProgresion(BaseModel):
    fecha: str
    kg_max: float


class ProgesionEjercicio(BaseModel):
    ejercicio_id: int
    nombre: str
    grupo_muscular: str
    reps: int
    historial: list[PuntoProgresion]


class VolumenSemanal(BaseModel):
    semana: str
    volumen: int


class MusculoSeries(BaseModel):
    grupo: str
    series: int
    color: str


class RecordEjercicio(BaseModel):
    ejercicio_id: int
    nombre: str
    grupo_muscular: str
    kg_max: float
    reps_en_max: int


class EstadisticasResumen(BaseModel):
    volumen_total_kg: int
    sesiones_total: int
    racha_actual: int
    horas_total: int


class Estadisticas(BaseModel):
    resumen: EstadisticasResumen
    progresion_fuerza: list[ProgesionEjercicio]
    volumen_semanal: list[VolumenSemanal]
    reparto_muscular: list[MusculoSeries]
    records: list[RecordEjercicio]


# ----- Actualizacion de rutinas -----

class RutinaActualizar(BaseModel):
    nombre: str | None = None
    descripcion: str | None = None
    ejercicio_ids: list[int] | None = None
