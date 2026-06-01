# ============================================================
#  Modelos = las tablas de la base de datos descritas como
#  clases de Python. SQLAlchemy las traduce a tablas SQL.
# ============================================================

from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def ahora_utc() -> datetime:
    """Fecha y hora actual en UTC (estandar para guardar fechas)."""
    return datetime.now(timezone.utc)


class Usuario(Base):
    # Nombre real de la tabla en PostgreSQL.
    __tablename__ = "usuarios"

    # Cada columna de la tabla es un atributo de la clase.
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    nombre: Mapped[str] = mapped_column(String(100))
    # Guardaremos SIEMPRE la contraseña cifrada (hash), nunca en texto plano.
    password_hash: Mapped[str] = mapped_column(String(255))
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=ahora_utc)

    # Relacion: un usuario tiene muchas rutinas. Esto nos permite
    # escribir, por ejemplo, usuario.rutinas para obtenerlas todas.
    rutinas: Mapped[list["Rutina"]] = relationship(back_populates="usuario")


class Rutina(Base):
    __tablename__ = "rutinas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nombre: Mapped[str] = mapped_column(String(120))
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=ahora_utc)

    # Clave foranea: enlaza cada rutina con el id de su usuario.
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"))

    # El lado opuesto de la relacion definida en Usuario.
    usuario: Mapped["Usuario"] = relationship(back_populates="rutinas")


class Ejercicio(Base):
    """Catalogo de ejercicios. Es global: lo comparten todos los usuarios."""
    __tablename__ = "ejercicios"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nombre: Mapped[str] = mapped_column(String(120))
    grupo_muscular: Mapped[str] = mapped_column(String(50))  # PECHO, ESPALDA...
    equipo: Mapped[str] = mapped_column(String(50))          # BARRA, MANCUERNAS...


class RutinaEjercicio(Base):
    """Tabla intermedia: que ejercicios tiene una rutina, y en que orden."""
    __tablename__ = "rutina_ejercicios"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    rutina_id: Mapped[int] = mapped_column(ForeignKey("rutinas.id"))
    ejercicio_id: Mapped[int] = mapped_column(ForeignKey("ejercicios.id"))
    orden: Mapped[int] = mapped_column(Integer, default=0)


class Sesion(Base):
    """Un entrenamiento concreto realizado en una fecha."""
    __tablename__ = "sesiones"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"))
    rutina_id: Mapped[int | None] = mapped_column(ForeignKey("rutinas.id"), nullable=True)
    fecha: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=ahora_utc)
    finalizada: Mapped[bool] = mapped_column(Boolean, default=False)
    duracion_minutos: Mapped[int | None] = mapped_column(Integer, nullable=True)


class SerieRegistro(Base):
    """Cada serie registrada dentro de una sesion (peso, reps, etc.)."""
    __tablename__ = "series"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    sesion_id: Mapped[int] = mapped_column(ForeignKey("sesiones.id"))
    ejercicio_id: Mapped[int] = mapped_column(ForeignKey("ejercicios.id"))
    numero: Mapped[int] = mapped_column(Integer)            # nº de serie (1, 2, 3...)
    kg: Mapped[float] = mapped_column(Float, default=0)
    reps: Mapped[int] = mapped_column(Integer, default=0)
    rir: Mapped[int | None] = mapped_column(Integer, nullable=True)  # reps en reserva
    completada: Mapped[bool] = mapped_column(Boolean, default=False)
