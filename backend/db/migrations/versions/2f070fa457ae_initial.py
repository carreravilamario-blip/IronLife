"""initial

Revision ID: 2f070fa457ae
Revises:
Create Date: 2026-06-02 14:27:45.557219

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = '2f070fa457ae'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "usuarios",
        sa.Column("id",            sa.Integer(),                          nullable=False),
        sa.Column("email",         sa.String(255),                        nullable=False),
        sa.Column("nombre",        sa.String(100),                        nullable=False),
        sa.Column("password_hash", sa.String(255),                        nullable=False),
        sa.Column("creado_en",     sa.DateTime(timezone=True),            nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_usuarios_email", "usuarios", ["email"], unique=True)

    op.create_table(
        "ejercicios",
        sa.Column("id",              sa.Integer(),     nullable=False),
        sa.Column("nombre",          sa.String(120),   nullable=False),
        sa.Column("grupo_muscular",  sa.String(50),    nullable=False),
        sa.Column("equipo",          sa.String(50),    nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "rutinas",
        sa.Column("id",          sa.Integer(),                nullable=False),
        sa.Column("nombre",      sa.String(120),              nullable=False),
        sa.Column("descripcion", sa.Text(),                   nullable=True),
        sa.Column("creado_en",   sa.DateTime(timezone=True),  nullable=False),
        sa.Column("usuario_id",  sa.Integer(),                nullable=False),
        sa.ForeignKeyConstraint(["usuario_id"], ["usuarios.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "rutina_ejercicios",
        sa.Column("id",           sa.Integer(), nullable=False),
        sa.Column("rutina_id",    sa.Integer(), nullable=False),
        sa.Column("ejercicio_id", sa.Integer(), nullable=False),
        sa.Column("orden",        sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["ejercicio_id"], ["ejercicios.id"]),
        sa.ForeignKeyConstraint(["rutina_id"],    ["rutinas.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "sesiones",
        sa.Column("id",                sa.Integer(),                nullable=False),
        sa.Column("usuario_id",        sa.Integer(),                nullable=False),
        sa.Column("rutina_id",         sa.Integer(),                nullable=True),
        sa.Column("fecha",             sa.DateTime(timezone=True),  nullable=False),
        sa.Column("finalizada",        sa.Boolean(),                nullable=False),
        sa.Column("duracion_minutos",  sa.Integer(),                nullable=True),
        sa.ForeignKeyConstraint(["rutina_id"],  ["rutinas.id"]),
        sa.ForeignKeyConstraint(["usuario_id"], ["usuarios.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "series",
        sa.Column("id",           sa.Integer(), nullable=False),
        sa.Column("sesion_id",    sa.Integer(), nullable=False),
        sa.Column("ejercicio_id", sa.Integer(), nullable=False),
        sa.Column("numero",       sa.Integer(), nullable=False),
        sa.Column("kg",           sa.Float(),   nullable=False),
        sa.Column("reps",         sa.Integer(), nullable=False),
        sa.Column("rir",          sa.Integer(), nullable=True),
        sa.Column("completada",   sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["ejercicio_id"], ["ejercicios.id"]),
        sa.ForeignKeyConstraint(["sesion_id"],    ["sesiones.id"]),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("series")
    op.drop_table("sesiones")
    op.drop_table("rutina_ejercicios")
    op.drop_table("rutinas")
    op.drop_index("ix_usuarios_email", table_name="usuarios")
    op.drop_table("ejercicios")
    op.drop_table("usuarios")
