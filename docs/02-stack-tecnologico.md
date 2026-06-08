# ⚙️ Stack Tecnológico

## Frontend

| Tecnología | Versión | Uso |
|-----------|---------|-----|
| **React** | 19 | Framework de UI |
| **Vite** | 8 | Bundler y servidor de desarrollo |
| **React Router** | 7 | Navegación SPA (client-side) |
| **i18next** | — | Internacionalización (ES/EN) |
| **react-i18next** | — | Integración de i18next con React |

> No se usan librerías de componentes externas (no MUI, no Ant Design). Los gráficos están hechos con SVG puro.

---

## Backend

| Tecnología | Versión | Uso |
|-----------|---------|-----|
| **Python** | 3.11+ | Lenguaje del servidor |
| **FastAPI** | — | Framework REST API (async) |
| **Uvicorn** | — | Servidor ASGI para desarrollo |
| **SQLAlchemy** | 2.0 | ORM (mapeo objetos-relacional) |
| **Alembic** | — | Migraciones de base de datos |
| **Pydantic v2** | — | Validación y serialización de datos |
| **pydantic-settings** | — | Configuración desde variables de entorno |
| **PyJWT** | — | Generación y verificación de tokens JWT |
| **bcrypt** | — | Hash seguro de contraseñas |

---

## Base de datos

| Tecnología | Uso |
|-----------|-----|
| **PostgreSQL** | Base de datos relacional principal |

---

## Herramientas de desarrollo

| Herramienta | Uso |
|-------------|-----|
| **uv** | Gestor de paquetes de Python (alternativa a pip, más rápido) |
| **npm** | Gestor de paquetes de JavaScript |
| **ESLint** | Linting del código frontend |
| **Alembic** | Control de versiones del esquema de base de datos |

---

## Decisiones de diseño relevantes

- **Sin Redux**: El estado global se gestiona con React Context API, suficiente para este tamaño de app.
- **Gráficas SVG propias**: No se importan librerías pesadas (Chart.js, Recharts). Los gráficos (`LineChart`, `VolumeBars`, `HBars`) están implementados en SVG puro en `frontend/src/components/Charts.jsx`.
- **uv en lugar de pip**: El gestor `uv` es significativamente más rápido para instalar dependencias.
- **FastAPI con Lifespan**: Las migraciones de Alembic y el seeding inicial se ejecutan automáticamente al arrancar el servidor (hook `lifespan`).
