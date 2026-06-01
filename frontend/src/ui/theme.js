// ============================================================
//  theme.js — Tokens de diseño para estilos inline.
//
//  Todos los colores de fondo/texto/borde apuntan a variables CSS
//  (definidas en App.css) para que el modo claro/oscuro funcione
//  automáticamente. Los colores de acento que hexA() necesita
//  parsear se exponen como constantes hex separadas.
// ============================================================

// Colores fijos que hexA() necesita parsear (no cambian entre temas)
export const ACCENT_HEX  = "#ff5722";
export const GREEN_HEX   = "#3ecf8e";

// Objeto de tema: valores que se usan en inline styles.
// Al referenciar variables CSS ("var(--bg)"), los componentes
// responden automáticamente al cambio de tema sin re-render.
export const WK = {
  bg:      "var(--bg)",
  panel:   "var(--panel)",
  panel2:  "var(--panel2)",
  card:    "var(--card)",
  accent:  "var(--accent)",
  accentHi:"var(--accent-hi)",
  green:   "var(--green)",
  text:    "var(--text)",
  text2:   "var(--text2)",
  muted:   "var(--muted)",
  faint:   "var(--faint)",
  line:    "var(--line)",
  line2:   "var(--line2)",
  field:   "var(--field)",
  // Fuentes
  mono:    "var(--mono)",
  sans:    "var(--sans)",
  anton:   "var(--display)",
};

// Convierte un color hex (#rrggbb) en rgba() con alfa.
// Usar siempre con ACCENT_HEX / GREEN_HEX, nunca con WK.accent
// (que ahora es "var(--accent)" y no se puede parsear).
export function hexA(hex, a) {
  const n = hex.replace("#", "");
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}
