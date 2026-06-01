# IronLife 🏋️

Aplicación web para gestionar entrenamientos de gimnasio. Proyecto de aprendizaje
full-stack: login de usuarios, rutinas de entrenamiento y calculadora de calorías.

## Tecnologías

| Capa | Tecnología |
|------|-----------|
| Front-end (interfaz) | React + Vite |
| Back-end (servidor/API) | Python + FastAPI |
| Base de datos | PostgreSQL |

## Estructura del proyecto

```
Proyecto1Claude/
├── backend/          → El servidor: API, base de datos, lógica
│   ├── app/
│   │   ├── main.py       → Punto de entrada del servidor (+ CORS)
│   │   ├── database.py   → Conexión a PostgreSQL
│   │   ├── models.py     → Tablas (usuarios, rutinas)
│   │   ├── schemas.py    → Validación de datos de entrada/salida
│   │   ├── security.py   → Hashing de contraseñas + tokens JWT
│   │   └── routers/      → Rutas agrupadas por tema (auth, ...)
│   ├── requirements.txt  → Lista de dependencias de Python
│   └── .venv/            → Entorno virtual (no se sube a git)
└── frontend/         → La interfaz (React + Vite)
    └── src/
        ├── api.js        → Llamadas al backend
        ├── App.jsx       → Componente principal (estado de sesión)
        └── components/   → AuthForm (login/registro), Dashboard
```

## Cómo arrancar el backend

Desde una terminal en la carpeta del proyecto:

```bash
cd backend

# 1) Activar el entorno virtual (solo hace falta una vez por terminal)
.venv\Scripts\activate          # En Windows (PowerShell/CMD)

# 2) Instalar dependencias (solo la primera vez o si cambian)
pip install -r requirements.txt

# 3) Arrancar el servidor en modo desarrollo
uvicorn app.main:app --reload --port 8000
```

Luego abre en el navegador:
- http://localhost:8000        → mensaje de bienvenida
- http://localhost:8000/docs   → documentación interactiva automática de la API

## Cómo arrancar el frontend

En **otra** terminal (el backend debe estar corriendo a la vez):

```bash
cd frontend
npm install      # solo la primera vez
npm run dev
```

Luego abre http://localhost:5173 en el navegador.
