// ============================================================
//  inicioData.js — Metadatos de rutinas/cardio + historial
//  sembrado de ejemplo y utilidades de fechas para el calendario.
//
//  NOTA: estos son datos de DEMO (mock). La pantalla guarda los
//  cambios en localStorage; aún no está conectada al backend.
// ============================================================

export const ROUTINE_META = {
  push: { id: "push", name: "Empuje · Push", short: "Push", color: "#ff5722" },
  pull: { id: "pull", name: "Tirón · Pull", short: "Pull", color: "#3b82f6" },
  legs: { id: "legs", name: "Pierna · Legs", short: "Legs", color: "#a855f7" },
  full: { id: "full", name: "Full Body", short: "Full", color: "#3ecf8e" },
};

export const CARDIO_META = { color: "#facc15", name: "Cardio" };

export const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
export const WEEKDAYS_ES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]; // Lunes primero
export const WEEKDAYS_FULL = [
  "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo",
];

function pad(n) {
  return String(n).padStart(2, "0");
}
export function dateKey(y, m, d) {
  return `${y}-${pad(m + 1)}-${pad(d)}`; // m va de 0 a 11
}
export function keyFromDate(dt) {
  return dateKey(dt.getFullYear(), dt.getMonth(), dt.getDate());
}
export function parseKey(k) {
  const [y, m, d] = k.split("-").map(Number);
  return new Date(y, m - 1, d);
}
export function addDays(dt, n) {
  const c = new Date(dt);
  c.setDate(c.getDate() + n);
  return c;
}
export function mondayIndex(jsDay) {
  return (jsDay + 6) % 7; // JS Domingo=0 -> índice con Lunes primero
}

// Historial sembrado: Mayo 2026 (split push/pull/legs + cardio), realista.
export function seedLog() {
  const Y = 2026, M = 4; // Mayo (0-indexado)
  const L = {};
  const set = (d, routineId, cardio) => {
    L[dateKey(Y, M, d)] = { routineId: routineId || null, cardio: cardio || null };
  };
  set(1, "push");
  set(2, null, { sec: 30 * 60, km: 5.2 });
  set(4, "push");
  set(5, "pull");
  set(6, "legs");
  set(8, null, { sec: 28 * 60, km: 4.8 });
  set(9, "push");
  set(11, "pull");
  set(12, "legs");
  set(13, "push", { sec: 20 * 60, km: 3.5 });
  set(15, null, { sec: 42 * 60, km: 7.1 });
  set(16, "pull");
  set(18, "legs");
  set(19, "push");
  set(20, "pull");
  set(22, null, { sec: 35 * 60, km: 6.0 });
  set(23, "legs");
  set(25, "push");
  set(26, "pull");
  set(27, "legs", { sec: 18 * 60, km: 3.2 });
  set(28, null, { sec: 32 * 60, km: 5.5 });
  set(29, "pull");
  set(30, "push", { sec: 16 * 60, km: 2.8 });
  set(31, null, { sec: 40 * 60, km: 6.8 });
  return L;
}
