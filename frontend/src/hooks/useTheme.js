// ============================================================
//  useTheme — Hook para gestionar el tema claro/oscuro.
//  Lee/escribe en localStorage y aplica data-theme al <html>.
// ============================================================

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "ironlife_theme";

function aplicarTema(modo) {
  if (modo === "light") {
    document.documentElement.setAttribute("data-theme", "light");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
}

export function useTheme() {
  const [modo, setModo] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || "dark";
    } catch {
      return "dark";
    }
  });

  // Aplica el tema al montar y cuando cambia.
  useEffect(() => {
    aplicarTema(modo);
    try { localStorage.setItem(STORAGE_KEY, modo); } catch { /* noop */ }
  }, [modo]);

  const toggleTema = useCallback(() => {
    setModo((m) => (m === "dark" ? "light" : "dark"));
  }, []);

  return { modo, toggleTema };
}

// Aplica el tema guardado al cargar la página (antes del primer render)
// para evitar el parpadeo oscuro→claro.
(function initTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light") aplicarTema("light");
  } catch { /* noop */ }
})();
