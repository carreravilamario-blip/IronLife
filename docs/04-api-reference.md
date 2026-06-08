# 🔌 API Reference

Base URL: `http://localhost:8000`

Docs interactivos (solo en desarrollo): `http://localhost:8000/docs`

---

## Autenticación

Todos los endpoints (salvo registro y login) requieren el header:

```
Authorization: Bearer <token_jwt>
```

---

## 🔐 Auth — `/api/auth`

### `POST /api/auth/registro`
Registra un nuevo usuario.

**Body:**
```json
{
  "email": "usuario@ejemplo.com",
  "nombre": "Mario",
  "password": "mi_contraseña_segura"
}
```

**Respuesta exitosa (201):**
```json
{
  "id": 1,
  "email": "usuario@ejemplo.com",
  "nombre": "Mario"
}
```

---

### `POST /api/auth/login`
Inicia sesión y devuelve un token JWT.

**Body (form-data):**
```
username=usuario@ejemplo.com
password=mi_contraseña_segura
```

**Respuesta exitosa (200):**
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer"
}
```

---

### `GET /api/auth/yo` 🔒
Devuelve los datos del usuario autenticado.

**Respuesta:**
```json
{
  "id": 1,
  "email": "usuario@ejemplo.com",
  "nombre": "Mario"
}
```

---

## 🏋️ Ejercicios — `/api/ejercicios`

### `GET /api/ejercicios` 🔒
Lista todos los ejercicios del catálogo global.

**Respuesta:**
```json
[
  {
    "id": 1,
    "nombre": "Press de banca",
    "grupo_muscular": "PECHO",
    "equipo": "BARRA"
  },
  ...
]
```

---

### `POST /api/ejercicios` 🔒
Crea un ejercicio personalizado.

**Body:**
```json
{
  "nombre": "Mi ejercicio",
  "grupo_muscular": "PECHO",
  "equipo": "MANCUERNAS"
}
```

---

### `POST /api/ejercicios/sync-wger` 🔒
Sincroniza ejercicios desde la API pública de wger.de (hasta 300).

No requiere body. Devuelve los ejercicios importados.

---

## 📋 Rutinas — `/api/rutinas`

### `GET /api/rutinas` 🔒
Lista las rutinas del usuario autenticado.

**Respuesta:**
```json
[
  {
    "id": 1,
    "nombre": "Push",
    "descripcion": "Pecho, hombro, tríceps",
    "ejercicios": [
      {"id": 1, "nombre": "Press de banca", "orden": 0, ...},
      ...
    ]
  }
]
```

---

### `POST /api/rutinas` 🔒
Crea una nueva rutina.

**Body:**
```json
{
  "nombre": "Mi rutina",
  "descripcion": "Descripción opcional",
  "ejercicios": [
    {"ejercicio_id": 1, "orden": 0},
    {"ejercicio_id": 5, "orden": 1}
  ]
}
```

---

### `PUT /api/rutinas/{id}` 🔒
Actualiza nombre, descripción y ejercicios de una rutina.

**Body:** igual que `POST /api/rutinas`

---

### `DELETE /api/rutinas/{id}` 🔒
Elimina una rutina. Las sesiones vinculadas quedan sin rutina (no se eliminan).

---

### `POST /api/rutinas/sembrar-defecto` 🔒
Crea las 4 rutinas por defecto (Push, Pull, Pierna, Full Body) si el usuario no tiene ninguna.

---

## 📅 Sesiones — `/api/sesiones`

### `POST /api/sesiones` 🔒
Crea una nueva sesión de entrenamiento.

**Body:**
```json
{
  "rutina_id": 1
}
```
`rutina_id` es opcional. Si no se pasa, la sesión es libre.

**Respuesta:**
```json
{
  "id": 42,
  "rutina_id": 1,
  "fecha": "2026-06-08T10:30:00Z",
  "finalizada": false,
  "duracion_minutos": null
}
```

---

### `GET /api/sesiones/{id}` 🔒
Obtiene el detalle de una sesión con todas sus series.

---

### `PUT /api/sesiones/{id}/finalizar` 🔒
Marca la sesión como finalizada y registra la duración.

**Body:**
```json
{
  "duracion_minutos": 65
}
```

---

### `GET /api/historial` 🔒
Lista las últimas 50 sesiones completadas con resumen de ejercicios.

---

## 📊 Series — `/api/sesiones/{id}/series`

### `POST /api/sesiones/{id}/series` 🔒
Añade una serie a la sesión activa.

**Body:**
```json
{
  "ejercicio_id": 1,
  "numero": 1,
  "kg": 80.0,
  "reps": 8,
  "rir": 2,
  "completada": true
}
```

---

### `PUT /api/series/{id}` 🔒
Actualiza una serie existente (kg, reps, rir, completada).

---

### `DELETE /api/series/{id}` 🔒
Elimina una serie.

---

## 📈 Estadísticas — `/api/estadisticas`

### `GET /api/estadisticas?semanas=12` 🔒
Devuelve estadísticas completas del usuario.

**Query params:**
- `semanas` (int, default: 12) — semanas hacia atrás para calcular volumen

**Respuesta incluye:**
```json
{
  "volumen_por_semana": [...],
  "distribucion_muscular": {...},
  "top_records": [...],
  "progresion_ejercicios": {...},
  "total_volumen": 45000,
  "total_sesiones": 48,
  "racha_actual": 5,
  "horas_entrenamiento": 72
}
```

---

### `GET /api/ejercicios/{id}/anterior` 🔒
Devuelve el máximo peso y las series de la última sesión en la que se hizo este ejercicio.

---

## 🩺 Sistema

### `GET /`
Health check básico.

### `GET /api/health`
Estado del servidor.
