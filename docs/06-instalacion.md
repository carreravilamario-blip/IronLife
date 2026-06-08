# 🚀 Guía de Instalación

## Requisitos previos

- **Python 3.11+** instalado
- **Node.js 18+** y **npm** instalados
- **PostgreSQL** corriendo (local o en la nube)
- **uv** (gestor de paquetes Python) — instalación: `pip install uv`

---

## 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd Proyecto1Claude
```

---

## 2. Configurar el Backend

### 2.1 Crear el archivo `.env`

```bash
cd backend
cp .env.example .env
```

Edita `.env` con tus valores:

```env
# Base de datos PostgreSQL
DATABASE_URL=postgresql+psycopg://usuario:contraseña@localhost:5432/ironlife_db

# Clave secreta para JWT (generar aleatoriamente)
SECRET_KEY=tu_clave_secreta_aqui

# Algoritmo JWT
ALGORITHM=HS256

# Tiempo de expiración del token (minutos)
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Orígenes permitidos para CORS
CORS_ORIGINS=http://localhost:5173

# Entorno
APP_ENV=development
```

Para generar una clave secreta segura:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

### 2.2 Crear la base de datos en PostgreSQL

```sql
CREATE DATABASE ironlife_db;
```

### 2.3 Instalar dependencias e iniciar el servidor

```bash
# Dentro de la carpeta backend/
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

Al arrancar por primera vez, FastAPI ejecuta automáticamente:
1. Las migraciones de Alembic (crea las tablas)
2. El seed de ejercicios (~120 ejercicios del catálogo)

El servidor queda disponible en: `http://localhost:8000`
Docs interactivos en: `http://localhost:8000/docs`

---

## 3. Configurar el Frontend

### 3.1 Crear el archivo `.env` (opcional)

```bash
cd frontend
cp .env.example .env
```

Si el backend corre en el puerto por defecto (8000), no es necesario cambiarlo.

```env
VITE_API_URL=http://localhost:8000
```

### 3.2 Instalar dependencias e iniciar el servidor de desarrollo

```bash
# Dentro de la carpeta frontend/
npm install
npm run dev
```

El frontend queda disponible en: `http://localhost:5173`

---

## 4. Verificar que todo funciona

1. Abre `http://localhost:5173` en el navegador
2. Regístrate con un email y contraseña
3. Al hacer login, se crearán automáticamente las 4 rutinas por defecto
4. Navega al apartado "Entrenar" para iniciar una sesión

---

## Scripts disponibles

### Backend (uv)
```bash
uv run uvicorn app.main:app --reload      # Servidor de desarrollo
uv run alembic upgrade head               # Aplicar migraciones manualmente
uv run python scripts/seed.py            # Ejecutar seed manualmente
```

### Frontend (npm)
```bash
npm run dev       # Servidor de desarrollo (:5173)
npm run build     # Build de producción (carpeta dist/)
npm run preview   # Preview del build de producción
npm run lint      # Verificar código con ESLint
```

---

## Variables de entorno — Referencia completa

### Backend (`backend/.env`)

| Variable | Requerida | Default | Descripción |
|----------|-----------|---------|-------------|
| `DATABASE_URL` | ✅ | — | Cadena de conexión PostgreSQL |
| `SECRET_KEY` | ✅ | — | Clave para firmar JWT |
| `ALGORITHM` | ✅ | `HS256` | Algoritmo de firma JWT |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | ❌ | `1440` | Duración del token (24h) |
| `CORS_ORIGINS` | ✅ | — | Orígenes permitidos (separados por coma) |
| `APP_ENV` | ❌ | `development` | `development` activa `/docs` |

### Frontend (`frontend/.env`)

| Variable | Requerida | Default | Descripción |
|----------|-----------|---------|-------------|
| `VITE_API_URL` | ❌ | `http://localhost:8000` | URL del backend |
