// ============================================================
//  grupoColores.js — Color único por grupo muscular.
//  Se usa en el modal de ejercicios (chips de filtro) y en
//  las tarjetas de ejercicio (badge de grupo).
// ============================================================

export const GRUPO_COLORES = {
  // ── Tren superior ─────────────────────────────────────────
  "PECHO":        "#ff5722",  // naranja
  "ESPALDA":      "#3b82f6",  // azul
  "HOMBROS":      "#3ecf8e",  // verde
  "HOMBRO":       "#3ecf8e",  // verde (variante wger)
  "BICEPS":       "#facc15",  // amarillo
  "BÍCEPS":       "#facc15",
  "TRICEPS":      "#f97316",  // naranja suave
  "TRÍCEPS":      "#f97316",
  "TRAPECIO":     "#14b8a6",  // teal
  "ANTEBRAZOS":   "#84cc16",  // lima
  "ANTEBRAZO":    "#84cc16",
  "BRAZOS":       "#facc15",  // amarillo (alias wger "Arms")

  // ── Tren inferior ─────────────────────────────────────────
  "CUADRICEPS":   "#a855f7",  // violeta
  "CUÁDRICEPS":   "#a855f7",
  "ISQUIOS":      "#9333ea",  // violeta oscuro
  "ISQUIOTIBIALES":"#9333ea",
  "GLUTEOS":      "#ec4899",  // rosa
  "GLÚTEOS":      "#ec4899",
  "GEMELOS":      "#06b6d4",  // cian
  "PIERNAS":      "#a855f7",  // violeta (alias wger "Legs")

  // ── Core / Otros ──────────────────────────────────────────
  "ABDOMINALES":  "#38bdf8",  // azul claro
  "OBLICUOS":     "#0ea5e9",  // azul medio
  "FUNCIONAL":    "#10b981",  // esmeralda
  "CARDIO":       "#ef4444",  // rojo
  "FLEXIBILIDAD": "#8b5cf6",  // púrpura
  "OTROS":        "#6b7280",  // gris
};

/** Devuelve el color del grupo (normalizado a mayúsculas sin acentos). */
export function colorDeGrupo(grupo) {
  if (!grupo) return "#6b7280";
  const clave = grupo.toUpperCase().trim();
  return GRUPO_COLORES[clave] ?? "#6b7280";
}

/** Convierte hex + alfa a rgba(). */
export function hexAlfa(hex, a) {
  const n = hex.replace("#", "");
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}
