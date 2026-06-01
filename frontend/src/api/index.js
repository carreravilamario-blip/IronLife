// ============================================================
//  api/index.js — Todas las llamadas al backend centralizadas.
//
//  La URL base se lee de la variable de entorno de Vite.
//  En desarrollo:   VITE_API_URL=http://localhost:8000
//  En producción:   VITE_API_URL=https://api.ironlife.app
//
//  Si la variable no está definida, cae al valor por defecto
//  de desarrollo para no romper nada al clonar el proyecto.
// ============================================================

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// ── Helper interno ────────────────────────────────────────────
async function peticion(metodo, ruta, datos, token, form = false) {
  const headers = {};
  let cuerpo;

  if (datos) {
    if (form) {
      const p = new URLSearchParams();
      Object.entries(datos).forEach(([k, v]) => p.append(k, v));
      cuerpo = p;
      headers["Content-Type"] = "application/x-www-form-urlencoded";
    } else {
      cuerpo = JSON.stringify(datos);
      headers["Content-Type"] = "application/json";
    }
  }

  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${ruta}`, { method: metodo, headers, body: cuerpo });
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;

  if (!res.ok) throw new Error(json?.detail ?? `Error ${res.status}`);
  return json;
}

// ── Auth ──────────────────────────────────────────────────────
export const registrar = (email, nombre, password) =>
  peticion("POST", "/api/auth/registro", { email, nombre, password });

export const login = (email, password) =>
  peticion("POST", "/api/auth/login", { username: email, password }, null, true);

export const obtenerUsuarioActual = (token) =>
  peticion("GET", "/api/auth/yo", null, token);

// ── Ejercicios ────────────────────────────────────────────────
export const listarEjercicios = (token) =>
  peticion("GET", "/api/ejercicios", null, token);

export const crearEjercicioPersonalizado = (datos, token) =>
  peticion("POST", "/api/ejercicios", datos, token);

export const sincronizarEjerciciosWger = (token) =>
  peticion("POST", "/api/ejercicios/sync-wger", null, token);

export const obtenerAnterior = (ejercicioId, token) =>
  peticion("GET", `/api/ejercicios/${ejercicioId}/anterior`, null, token);

// ── Rutinas ───────────────────────────────────────────────────
export const listarRutinas = (token) =>
  peticion("GET", "/api/rutinas", null, token);

export const crearRutina = (datos, token) =>
  peticion("POST", "/api/rutinas", datos, token);

export const sembrarRutinasDefecto = (token) =>
  peticion("POST", "/api/rutinas/sembrar-defecto", null, token);

export const borrarRutina = (rutinaId, token) =>
  peticion("DELETE", `/api/rutinas/${rutinaId}`, null, token);

// ── Sesiones ──────────────────────────────────────────────────
export const crearSesion = (rutinaId, token) =>
  peticion("POST", "/api/sesiones", { rutina_id: rutinaId }, token);

export const obtenerSesion = (sesionId, token) =>
  peticion("GET", `/api/sesiones/${sesionId}`, null, token);

export const finalizarSesion = (sesionId, token) =>
  peticion("PUT", `/api/sesiones/${sesionId}/finalizar`, null, token);

// ── Series ────────────────────────────────────────────────────
export const crearSerie = (sesionId, datos, token) =>
  peticion("POST", `/api/sesiones/${sesionId}/series`, datos, token);

export const actualizarSerie = (serieId, datos, token) =>
  peticion("PUT", `/api/series/${serieId}`, datos, token);

export const borrarSerie = (serieId, token) =>
  peticion("DELETE", `/api/series/${serieId}`, null, token);

// ── Historial real ────────────────────────────────────────────
export const obtenerHistorial = (token) =>
  peticion("GET", "/api/historial", null, token);

// ── Estadísticas ─────────────────────────────────────────────
export const obtenerEstadisticas = (semanas, token) =>
  peticion("GET", `/api/estadisticas?semanas=${semanas}`, null, token);

// ── Actualizar rutina ─────────────────────────────────────────
export const actualizarRutina = (rutinaId, datos, token) =>
  peticion("PUT", `/api/rutinas/${rutinaId}`, datos, token);

// ── Finalizar sesión con duración ─────────────────────────────
export const finalizarSesionConDuracion = (sesionId, duracionMinutos, token) =>
  peticion("PUT", `/api/sesiones/${sesionId}/finalizar`, { duracion_minutos: duracionMinutos }, token);
