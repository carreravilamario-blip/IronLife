# 🗄️ Base de Datos

Base de datos: **PostgreSQL**
ORM: **SQLAlchemy 2.0**
Migraciones: **Alembic**

---

## Diagrama de tablas

```
usuarios
  │
  ├──< rutinas (1 usuario → muchas rutinas)
  │       │
  │       └──< rutina_ejercicios >── ejercicios
  │
  └──< sesiones (1 usuario → muchas sesiones)
          │
          ├── rutinas (opcional, FK nullable)
          │
          └──< series >── ejercicios
```

---

## Tablas

### `usuarios`
Almacena los usuarios registrados.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | INTEGER | PK, autoincrement | Identificador único |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL, indexed | Email del usuario |
| `nombre` | VARCHAR(100) | NOT NULL | Nombre visible |
| `password_hash` | VARCHAR(255) | NOT NULL | Contraseña hasheada con bcrypt |
| `creado_en` | TIMESTAMPTZ | NOT NULL, default=now() | Fecha de registro |

---

### `ejercicios`
Catálogo global de ejercicios (compartido entre todos los usuarios).

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | INTEGER | PK, autoincrement | Identificador único |
| `nombre` | VARCHAR(120) | NOT NULL | Nombre del ejercicio |
| `grupo_muscular` | VARCHAR(50) | NOT NULL | Grupo muscular principal |
| `equipo` | VARCHAR(50) | NOT NULL | Tipo de equipo necesario |

**Valores de `grupo_muscular`:** PECHO, ESPALDA, HOMBROS, BICEPS, TRICEPS, CUADRICEPS, ISQUIOS, GLUTEOS, GEMELOS, ABDOMINALES, TRAPECIO, FUNCIONAL

**Valores de `equipo`:** BARRA, MANCUERNAS, POLEA, PESO CORPORAL, MAQUINA, KETTLEBELL, BARRA EZ

---

### `rutinas`
Rutinas de entrenamiento creadas por cada usuario.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | INTEGER | PK, autoincrement | Identificador único |
| `nombre` | VARCHAR(120) | NOT NULL | Nombre de la rutina |
| `descripcion` | TEXT | nullable | Descripción opcional |
| `creado_en` | TIMESTAMPTZ | NOT NULL, default=now() | Fecha de creación |
| `usuario_id` | INTEGER | FK → usuarios.id, NOT NULL | Dueño de la rutina |

---

### `rutina_ejercicios`
Tabla intermedia que vincula rutinas con ejercicios y define su orden.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | INTEGER | PK, autoincrement | Identificador único |
| `rutina_id` | INTEGER | FK → rutinas.id, NOT NULL | Rutina a la que pertenece |
| `ejercicio_id` | INTEGER | FK → ejercicios.id, NOT NULL | Ejercicio incluido |
| `orden` | INTEGER | NOT NULL | Posición en la rutina (0-indexado) |

---

### `sesiones`
Sesiones de entrenamiento completadas o en curso.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | INTEGER | PK, autoincrement | Identificador único |
| `usuario_id` | INTEGER | FK → usuarios.id, NOT NULL | Usuario que entrena |
| `rutina_id` | INTEGER | FK → rutinas.id, nullable | Rutina usada (puede ser libre) |
| `fecha` | TIMESTAMPTZ | NOT NULL, default=now() | Inicio de la sesión |
| `finalizada` | BOOLEAN | NOT NULL, default=false | Si la sesión fue completada |
| `duracion_minutos` | INTEGER | nullable | Duración registrada al finalizar |

---

### `series`
Series individuales registradas en una sesión (un set de un ejercicio).

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | INTEGER | PK, autoincrement | Identificador único |
| `sesion_id` | INTEGER | FK → sesiones.id, NOT NULL | Sesión a la que pertenece |
| `ejercicio_id` | INTEGER | FK → ejercicios.id, NOT NULL | Ejercicio ejecutado |
| `numero` | INTEGER | NOT NULL | Número de serie (1-indexado) |
| `kg` | FLOAT | NOT NULL | Peso usado en kilogramos |
| `reps` | INTEGER | NOT NULL | Repeticiones realizadas |
| `rir` | INTEGER | nullable | Repeticiones en reserva (RIR) |
| `completada` | BOOLEAN | NOT NULL, default=false | Si la serie fue completada |

---

## Migraciones

Las migraciones se gestionan con Alembic. El archivo inicial está en:
`backend/db/migrations/versions/2f070fa457ae_initial.py`

FastAPI ejecuta automáticamente las migraciones al arrancar (hook `lifespan` en `main.py`), por lo que no es necesario correrlas manualmente en desarrollo.

Para crear una nueva migración tras modificar los modelos:
```bash
cd backend
alembic revision --autogenerate -m "descripcion_del_cambio"
alembic upgrade head
```

---

## Datos iniciales (seed)

El script `backend/scripts/seed.py` se ejecuta automáticamente al arrancar si el catálogo de ejercicios está vacío. Inserta:

- **~120 ejercicios** distribuidos en 12 grupos musculares
- **4 rutinas por defecto** para cada nuevo usuario (Push, Pull, Pierna, Full Body), creadas la primera vez que el usuario inicia sesión
