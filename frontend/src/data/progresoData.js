// ============================================================
//  progresoData.js — Datos de DEMO para el panel de Progreso:
//  progresión de fuerza, volumen semanal, reparto muscular,
//  peso corporal, récords y logros.
//
//  NOTA: datos mock. Aún no conectado a la analítica del backend.
// ============================================================

// Fórmula de Epley para estimar la 1RM (repetición máxima).
export function epley1RM(kg, reps) {
  return Math.round(kg * (1 + reps / 30));
}

export const WEEK_LABELS = [
  "S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8", "S9", "S10", "S11", "S12",
];

// Peso de la serie top por ejercicio a lo largo de 12 semanas (kg).
export const PR_LIFTS = [
  { id: "press-banca", name: "Press banca", group: "Pecho", color: "#ff5722",
    reps: 5, history: [60, 62.5, 65, 65, 67.5, 70, 72.5, 72.5, 75, 77.5, 80, 82.5] },
  { id: "sentadilla", name: "Sentadilla", group: "Cuádriceps", color: "#a855f7",
    reps: 5, history: [80, 82.5, 85, 90, 90, 95, 97.5, 100, 100, 105, 107.5, 110] },
  { id: "peso-muerto", name: "Peso muerto", group: "Espalda", color: "#3b82f6",
    reps: 3, history: [100, 105, 110, 110, 115, 120, 122.5, 125, 130, 130, 135, 140] },
  { id: "press-militar", name: "Press militar", group: "Hombro", color: "#3ecf8e",
    reps: 5, history: [35, 35, 37.5, 40, 40, 42.5, 42.5, 45, 45, 45, 47.5, 47.5] },
  { id: "remo-barra", name: "Remo con barra", group: "Espalda", color: "#38bdf8",
    reps: 6, history: [55, 57.5, 60, 60, 62.5, 65, 67.5, 67.5, 70, 72.5, 72.5, 75] },
  { id: "dominadas", name: "Dominadas (+lastre)", group: "Espalda", color: "#facc15",
    reps: 6, history: [0, 0, 2.5, 5, 5, 7.5, 7.5, 10, 10, 12.5, 12.5, 15] },
];

// Tonelaje total movido por semana (kg), con descargas en S4 y S8.
export const WEEKLY_VOLUME = [
  18200, 19500, 20800, 15600, 22100, 23400, 24600, 17800, 26200, 27500, 28800, 30100,
];

// Series por grupo muscular (últimas 4 semanas).
export const MUSCLE_SPLIT = [
  { group: "Pierna", sets: 64, color: "#a855f7" },
  { group: "Espalda", sets: 58, color: "#3b82f6" },
  { group: "Pecho", sets: 46, color: "#ff5722" },
  { group: "Hombro", sets: 38, color: "#3ecf8e" },
  { group: "Brazo", sets: 32, color: "#facc15" },
  { group: "Core", sets: 20, color: "#38bdf8" },
];

// Peso corporal (kg) en las mismas 12 semanas — volumen limpio controlado.
export const BODYWEIGHT = [
  78.0, 78.3, 78.6, 79.0, 79.2, 79.6, 79.9, 80.2, 80.5, 80.8, 81.1, 81.4,
];

export const ACHIEVEMENTS = [
  { icon: "squat", name: "100 kg en sentadilla", date: "Semana 8", done: true },
  { icon: "flame", name: "Racha de 7 días", date: "Esta semana", done: true },
  { icon: "trophy", name: "+20 kg en banca", date: "Semana 11", done: true },
  { icon: "target", name: "1.000.000 kg movidos", date: "Semana 10", done: true },
  { icon: "medal", name: "Primera dominada lastrada", date: "Semana 3", done: true },
  { icon: "bolt", name: "50 sesiones completadas", date: "Semana 9", done: true },
  { icon: "mountain", name: "150 kg en peso muerto", date: "En progreso", done: false },
  { icon: "crown", name: "100 sesiones", date: "En progreso", done: false },
];

export const OVERVIEW = {
  totalVolume: 1242000, // kg movidos en total
  sessions: 64,
  weeks: 12,
  streak: 7,
  hoursTrained: 71,
  cardioKm: 168,
};
