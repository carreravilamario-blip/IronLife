# 🗂️ Arquitectura del Proyecto

## Estructura de carpetas

```
Proyecto1Claude/
├── backend/                        ← Servidor Python (FastAPI)
│   ├── app/
│   │   ├── main.py                 ← Punto de entrada; CORS, lifespan hooks
│   │   ├── config.py               ← Configuración desde .env (pydantic-settings)
│   │   ├── database.py             ← Motor SQLAlchemy, SessionLocal, get_db
│   │   ├── models.py               ← Modelos ORM: Usuario, Rutina, Sesion, Serie...
│   │   ├── schemas.py              ← DTOs Pydantic: validación de entrada y salida
│   │   ├── security.py             ← Hash bcrypt + generación/verificación JWT
│   │   └── routers/
│   │       ├── auth.py             ← Registro, login, usuario actual
│   │       └── entrenamiento.py    ← Ejercicios, rutinas, sesiones, series, stats
│   ├── db/
│   │   └── migrations/             ← Migraciones Alembic
│   │       └── versions/
│   │           └── 2f070fa457ae_initial.py
│   ├── scripts/
│   │   └── seed.py                 ← Catálogo inicial (~120 ejercicios)
│   ├── .env.example                ← Plantilla de variables de entorno
│   ├── pyproject.toml              ← Dependencias Python (gestionadas con uv)
│   └── alembic.ini                 ← Config de migraciones
│
├── frontend/                       ← Cliente React (Vite)
│   ├── src/
│   │   ├── App.jsx                 ← Router + AuthProvider wrapper
│   │   ├── main.jsx                ← Punto de entrada React
│   │   ├── i18n.js                 ← Configuración i18next
│   │   ├── api/
│   │   │   └── index.js            ← Cliente API centralizado (fetch wrappers)
│   │   ├── context/
│   │   │   └── AuthContext.jsx     ← Estado global: token, usuario, rutinas
│   │   ├── pages/                  ← Pantallas completas
│   │   │   ├── PantallaInicio.jsx
│   │   │   ├── PantallaSeleccionRutina.jsx
│   │   │   ├── PantallaEntrenar.jsx
│   │   │   ├── PantallaProgreso.jsx
│   │   │   ├── PantallaHistorial.jsx
│   │   │   ├── PantallaEditorRutina.jsx
│   │   │   └── PantallaCalculadora.jsx
│   │   ├── components/             ← Componentes reutilizables
│   │   │   ├── AuthForm.jsx
│   │   │   ├── Layout.jsx          ← Sidebar + contenido principal
│   │   │   ├── Calendario.jsx
│   │   │   ├── Charts.jsx          ← Gráficas SVG personalizadas
│   │   │   ├── TarjetaEjercicio.jsx
│   │   │   ├── TarjetaCardio.jsx
│   │   │   └── ModalEjercicio.jsx
│   │   ├── hooks/                  ← Custom hooks React
│   │   ├── locales/                ← Traducciones
│   │   │   ├── es.json
│   │   │   └── en.json
│   │   ├── constants/
│   │   │   ├── dates.js
│   │   │   └── routines.js
│   │   ├── ui/
│   │   │   └── theme.js            ← Design tokens (colores, espaciados)
│   │   └── utils/                  ← Funciones auxiliares
│   ├── public/                     ← Assets estáticos
│   ├── package.json
│   └── vite.config.js
│
├── docs/                           ← Esta documentación
├── README.md
└── .gitignore
```

---

## Flujo de datos

```
Usuario (navegador)
    │
    │  HTTP request (JSON)
    ▼
Frontend React (Vite :5173)
    │
    │  fetch() con Authorization: Bearer <jwt>
    ▼
Backend FastAPI (:8000)
    │
    │  SQLAlchemy ORM query
    ▼
PostgreSQL (base de datos)
```

---

## Rutas del frontend

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/` | `PantallaInicio` | Dashboard: estadísticas, calendario, cardio |
| `/entrenar` | `PantallaSeleccionRutina` | Elegir rutina para iniciar sesión |
| `/entrenar/:rutinaId` | `PantallaEntrenar` | Sesión activa: registrar series, timer |
| `/progreso` | `PantallaProgreso` | Analíticas: gráficas, records, progresión |
| `/historial` | `PantallaHistorial` | Historial de sesiones pasadas |
| `/rutinas/:rutinaId/editar` | `PantallaEditorRutina` | Crear / editar rutina |
| `/calculadora` | `PantallaCalculadora` | Calculadora de calorías y macros |

Todas las rutas están protegidas por autenticación. Si no hay token, redirige al login.

---

## Capas del backend

```
HTTP Request
    │
    ▼
Router (auth.py / entrenamiento.py)   ← Valida token JWT, extrae usuario
    │
    ▼
Schema (schemas.py)                   ← Valida y deserializa el body (Pydantic)
    │
    ▼
Lógica de negocio (en el router)      ← Consultas SQLAlchemy, cálculos
    │
    ▼
Model (models.py)                     ← ORM → SQL → PostgreSQL
    │
    ▼
HTTP Response (JSON serializado por Pydantic)
```

---

## Persistencia en el cliente

Algunos datos se guardan en `localStorage` del navegador para mejorar la UX:

| Clave | Contenido |
|-------|-----------|
| `token` | JWT del usuario autenticado |
| `timer_inicio` | Timestamp de inicio del timer de sesión |
| `timer_descanso` | Estado del timer de descanso entre series |
| `calendario_mes` | Mes actual seleccionado en el calendario |
| `i18nextLng` | Idioma preferido del usuario |
