// ============================================================
//  PantallaEditorRutina — Editar los ejercicios de una rutina.
//  Ruta: /rutinas/:rutinaId/editar
//
//  Columna izquierda : ejercicios seleccionados (removibles,
//                      reordenables con botones ↑ ↓).
//  Columna derecha   : catálogo con búsqueda por texto y grupo.
//  Botón "Guardar"   : llama a actualizarRutina y vuelve a
//                      /entrenar.
// ============================================================

import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context";
import { listarEjercicios, actualizarRutina } from "../api";
import { colorDeGrupo, hexAlfa } from "../ui/grupoColores";
import { WK as H, hexA, ACCENT_HEX } from "../ui/theme";

// ── Normalización ─────────────────────────────────────────────
const NORMALIZAR = {
  "HOMBRO": "HOMBROS",
  "BÍCEPS": "BICEPS",
  "TRÍCEPS": "TRICEPS",
  "CUÁDRICEPS": "CUADRICEPS",
  "GLÚTEOS": "GLUTEOS",
};
const normGrupo = (g) => NORMALIZAR[g?.toUpperCase()] ?? g;

function norm(s) {
  return (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

// ── Iconos ────────────────────────────────────────────────────
const IcBack = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);

const IcTrash = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4h6v2"/>
  </svg>
);

const IcSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="var(--muted)" strokeWidth="2" strokeLinecap="round">
    <circle cx="11" cy="11" r="7"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const IcPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const IcUp = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="18 15 12 9 6 15"/>
  </svg>
);

const IcDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const IcCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

// ── Badge de grupo muscular ───────────────────────────────────
function BadgeGrupo({ grupo }) {
  if (!grupo) return null;
  const g = normGrupo(grupo);
  const color = colorDeGrupo(g);
  return (
    <span style={{
      fontFamily: "var(--mono)",
      fontSize: 10,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      padding: "2px 8px",
      borderRadius: 20,
      background: hexAlfa(color, 0.12),
      color,
      border: `1px solid ${hexAlfa(color, 0.3)}`,
      whiteSpace: "nowrap",
      flexShrink: 0,
    }}>
      {g}
    </span>
  );
}

// ── Componente principal ──────────────────────────────────────
export default function PantallaEditorRutina() {
  const { t } = useTranslation();
  const { rutinaId } = useParams();
  const navigate = useNavigate();
  const { token, rutinas } = useAuth();

  // Rutina del contexto (ya cargada)
  const rutina = rutinas?.find((r) => r.id === parseInt(rutinaId));

  // Estado local de ejercicios seleccionados
  const [ejerciciosSeleccionados, setEjerciciosSeleccionados] = useState([]);

  // Catálogo completo
  const [catalogo, setCatalogo] = useState([]);
  const [cargandoCatalogo, setCargandoCatalogo] = useState(false);

  // Filtros del buscador
  const [busqueda, setBusqueda] = useState("");
  const [grupo, setGrupo] = useState("Todos");

  // Estado de guardado
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [savedOk, setSavedOk] = useState(false);

  const searchRef = useRef(null);

  // Inicializar ejercicios seleccionados desde la rutina
  useEffect(() => {
    if (rutina?.ejercicios) {
      setEjerciciosSeleccionados([...rutina.ejercicios]);
    }
  }, [rutinaId, rutinas]);

  // Cargar catálogo completo
  useEffect(() => {
    if (!token) return;
    setCargandoCatalogo(true);
    listarEjercicios(token)
      .then(setCatalogo)
      .catch(() => setCatalogo([]))
      .finally(() => setCargandoCatalogo(false));
  }, [token]);

  // ── Acciones sobre la lista seleccionada ─────────────────────
  function anadir(ejercicio) {
    setEjerciciosSeleccionados((prev) => {
      if (prev.some((e) => e.id === ejercicio.id)) return prev;
      return [...prev, ejercicio];
    });
  }

  function quitar(id) {
    setEjerciciosSeleccionados((prev) => prev.filter((e) => e.id !== id));
  }

  function moverArriba(index) {
    if (index === 0) return;
    setEjerciciosSeleccionados((prev) => {
      const copia = [...prev];
      [copia[index - 1], copia[index]] = [copia[index], copia[index - 1]];
      return copia;
    });
  }

  function moverAbajo(index) {
    setEjerciciosSeleccionados((prev) => {
      if (index === prev.length - 1) return prev;
      const copia = [...prev];
      [copia[index], copia[index + 1]] = [copia[index + 1], copia[index]];
      return copia;
    });
  }

  // ── Guardar ───────────────────────────────────────────────────
  async function guardar() {
    setSaving(true);
    setErrorMsg("");
    setSavedOk(false);
    try {
      await actualizarRutina(
        rutinaId,
        { ejercicio_ids: ejerciciosSeleccionados.map((e) => e.id) },
        token
      );
      setSavedOk(true);
      setTimeout(() => navigate("/entrenar"), 800);
    } catch (err) {
      setErrorMsg(err.message);
      setSaving(false);
    }
  }

  // ── Filtrado del catálogo ─────────────────────────────────────
  const gruposDisponibles = [
    "Todos",
    ...Array.from(
      new Set(catalogo.map((e) => normGrupo(e.grupo_muscular)).filter(Boolean))
    ).sort(),
  ];

  const idsSeleccionados = new Set(ejerciciosSeleccionados.map((e) => e.id));

  const resultados = catalogo.filter((e) => {
    const g = normGrupo(e.grupo_muscular);
    const enGrupo = grupo === "Todos" || g === grupo;
    if (!busqueda.trim()) return enGrupo;
    const q = norm(busqueda);
    return enGrupo && (
      norm(e.nombre).includes(q) ||
      norm(g).includes(q) ||
      norm(e.equipo).includes(q)
    );
  });

  // ── Renderizado condicional (rutina no encontrada) ────────────
  if (rutinas && rutinas.length > 0 && !rutina) {
    return (
      <div className="pantalla-vacia">
        <p style={{ color: "var(--error)" }}>Rutina no encontrada.</p>
        <button
          className="btn-naranja"
          style={{ marginTop: 16 }}
          onClick={() => navigate("/entrenar")}
        >
          Volver
        </button>
      </div>
    );
  }

  // ── Layout principal ──────────────────────────────────────────
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      minHeight: "100%",
      background: H.bg,
      color: H.text,
      fontFamily: H.sans,
    }}>

      {/* ── Header ── */}
      <header style={{
        padding: "20px 28px 18px",
        borderBottom: `1px solid var(--line)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12,
        background: H.panel,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => navigate("/entrenar")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 34,
              height: 34,
              borderRadius: 10,
              background: "var(--panel2)",
              border: "1px solid var(--line)",
              color: "var(--text2)",
              cursor: "pointer",
              flexShrink: 0,
            }}
            title="Volver"
          >
            <IcBack />
          </button>

          <div>
            <div style={{
              fontFamily: H.mono,
              fontSize: 10,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--accent)",
              marginBottom: 3,
            }}>
              {t("editor.title")}
            </div>
            <h1 style={{
              margin: 0,
              fontFamily: H.anton,
              fontSize: 28,
              textTransform: "uppercase",
              letterSpacing: "0.02em",
              lineHeight: 1,
            }}>
              {rutina?.nombre ?? t("app.loading")}
            </h1>
          </div>
        </div>

        {/* Botón guardar */}
        <button
          onClick={guardar}
          disabled={saving || savedOk}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 22px",
            borderRadius: 12,
            fontFamily: H.mono,
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            cursor: (saving || savedOk) ? "default" : "pointer",
            background: savedOk
              ? "var(--green)"
              : saving
                ? hexA(ACCENT_HEX, 0.5)
                : "var(--accent)",
            color: "#0d0d0f",
            border: "none",
            transition: "background 0.2s",
            minWidth: 130,
            justifyContent: "center",
          }}
        >
          {savedOk ? (
            <><IcCheck /> {t("editor.saved")}</>
          ) : saving ? (
            t("common.saving")
          ) : (
            t("editor.save_routine")
          )}
        </button>
      </header>

      {/* Mensaje de error */}
      {errorMsg && (
        <div style={{
          margin: "12px 28px 0",
          padding: "10px 16px",
          borderRadius: 10,
          background: hexA("#ff6b6b", 0.1),
          border: "1px solid var(--error)",
          color: "var(--error)",
          fontFamily: H.mono,
          fontSize: 12,
        }}>
          {errorMsg}
        </div>
      )}

      {/* ── Cuerpo: dos columnas ── */}
      <div style={{
        flex: 1,
        display: "grid",
        gridTemplateColumns: "minmax(280px, 400px) 1fr",
        gap: 0,
        overflow: "hidden",
        minHeight: 0,
      }}>

        {/* ════ Columna izquierda: ejercicios seleccionados ════ */}
        <div style={{
          borderRight: `1px solid var(--line)`,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}>
          {/* Cabecera columna */}
          <div style={{
            padding: "16px 20px 12px",
            borderBottom: `1px solid var(--line2)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <span style={{
              fontFamily: H.mono,
              fontSize: 11,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--muted)",
            }}>
              {t("editor.in_routine")}
            </span>
            <span style={{
              fontFamily: H.mono,
              fontSize: 12,
              fontWeight: 700,
              color: "var(--accent)",
            }}>
              {ejerciciosSeleccionados.length}
            </span>
          </div>

          {/* Lista de ejercicios seleccionados */}
          <div style={{
            flex: 1,
            overflowY: "auto",
            padding: "8px 0",
          }}>
            {ejerciciosSeleccionados.length === 0 && (
              <div style={{
                padding: "40px 24px",
                textAlign: "center",
                color: "var(--faint)",
                fontFamily: H.mono,
                fontSize: 12,
                lineHeight: 1.6,
              }}>
                {t("editor.no_exercises")}
              </div>
            )}

            {ejerciciosSeleccionados.map((ej, index) => (
              <div
                key={ej.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "9px 16px 9px 20px",
                  borderBottom: `1px solid var(--line2)`,
                  background: "transparent",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--panel2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                {/* Número de orden */}
                <span style={{
                  fontFamily: H.mono,
                  fontSize: 11,
                  color: "var(--faint)",
                  minWidth: 18,
                  textAlign: "right",
                  flexShrink: 0,
                }}>
                  {index + 1}
                </span>

                {/* Info del ejercicio */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: 600,
                    fontSize: 13,
                    color: "var(--text)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}>
                    {ej.nombre}
                  </div>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginTop: 3,
                  }}>
                    <BadgeGrupo grupo={ej.grupo_muscular} />
                    {ej.equipo && (
                      <span style={{
                        fontFamily: H.mono,
                        fontSize: 10,
                        color: "var(--faint)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}>
                        {ej.equipo}
                      </span>
                    )}
                  </div>
                </div>

                {/* Botones de reorden y eliminar */}
                <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
                  <button
                    onClick={() => moverArriba(index)}
                    disabled={index === 0}
                    title={t("editor.move_up")}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 7,
                      border: "1px solid var(--line)",
                      background: "var(--field)",
                      color: index === 0 ? "var(--faint)" : "var(--text2)",
                      cursor: index === 0 ? "default" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: index === 0 ? 0.4 : 1,
                    }}
                  >
                    <IcUp />
                  </button>
                  <button
                    onClick={() => moverAbajo(index)}
                    disabled={index === ejerciciosSeleccionados.length - 1}
                    title={t("editor.move_down")}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 7,
                      border: "1px solid var(--line)",
                      background: "var(--field)",
                      color: index === ejerciciosSeleccionados.length - 1 ? "var(--faint)" : "var(--text2)",
                      cursor: index === ejerciciosSeleccionados.length - 1 ? "default" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: index === ejerciciosSeleccionados.length - 1 ? 0.4 : 1,
                    }}
                  >
                    <IcDown />
                  </button>
                  <button
                    onClick={() => quitar(ej.id)}
                    title={t("editor.remove_exercise")}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 7,
                      border: `1px solid ${hexA("#ff6b6b", 0.3)}`,
                      background: hexA("#ff6b6b", 0.08),
                      color: "var(--error)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <IcTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ════ Columna derecha: catálogo / buscador ════ */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}>

          {/* Barra de búsqueda + filtros de grupo */}
          <div style={{
            padding: "14px 20px 12px",
            borderBottom: `1px solid var(--line2)`,
            background: H.panel,
          }}>
            {/* Campo de búsqueda */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "var(--field)",
              border: "1px solid var(--line)",
              borderRadius: 10,
              padding: "0 12px",
              height: 38,
              marginBottom: 10,
            }}>
              <IcSearch />
              <input
                ref={searchRef}
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder={t("editor.search_placeholder")}
                style={{
                  flex: 1,
                  border: "none",
                  background: "transparent",
                  color: "var(--text)",
                  fontFamily: H.mono,
                  fontSize: 13,
                  outline: "none",
                }}
              />
              {busqueda && (
                <button
                  onClick={() => setBusqueda("")}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--muted)",
                    padding: 0,
                    lineHeight: 1,
                    fontSize: 16,
                  }}
                >
                  ×
                </button>
              )}
            </div>

            {/* Chips de grupo muscular */}
            <div style={{
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
            }}>
              {gruposDisponibles.map((g) => {
                const color = g === "Todos" ? ACCENT_HEX : colorDeGrupo(g);
                const activo = grupo === g;
                return (
                  <button
                    key={g}
                    onClick={() => setGrupo(g)}
                    style={{
                      fontFamily: H.mono,
                      fontSize: 10,
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      padding: "4px 10px",
                      borderRadius: 20,
                      cursor: "pointer",
                      fontWeight: activo ? 700 : 500,
                      background: activo ? color : hexAlfa(color, 0.08),
                      color: activo ? "#0d0d0f" : color,
                      border: `1px solid ${activo ? color : hexAlfa(color, 0.35)}`,
                      transition: "background 0.12s, border-color 0.12s",
                    }}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lista del catálogo */}
          <div style={{
            flex: 1,
            overflowY: "auto",
            padding: "6px 0",
          }}>
            {cargandoCatalogo && (
              <div style={{
                padding: "48px 24px",
                textAlign: "center",
                color: "var(--muted)",
                fontFamily: H.mono,
                fontSize: 12,
              }}>
                {t("modal_exercise.loading")}
              </div>
            )}

            {!cargandoCatalogo && resultados.length === 0 && (
              <div style={{
                padding: "48px 24px",
                textAlign: "center",
                color: "var(--faint)",
                fontFamily: H.mono,
                fontSize: 12,
              }}>
                {t("modal_exercise.no_results")}{busqueda ? ` para "${busqueda}"` : ""}.
              </div>
            )}

            {!cargandoCatalogo && resultados.map((ej) => {
              const yaAnadido = idsSeleccionados.has(ej.id);
              const gNorm = normGrupo(ej.grupo_muscular);
              const accentColor = colorDeGrupo(gNorm);

              return (
                <button
                  key={ej.id}
                  onClick={() => !yaAnadido && anadir(ej)}
                  disabled={yaAnadido}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    width: "100%",
                    padding: "10px 20px",
                    background: "transparent",
                    border: "none",
                    borderBottom: `1px solid var(--line2)`,
                    cursor: yaAnadido ? "default" : "pointer",
                    textAlign: "left",
                    color: "var(--text)",
                    transition: "background 0.1s",
                    opacity: yaAnadido ? 0.5 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!yaAnadido) e.currentTarget.style.background = "var(--panel2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontWeight: 600,
                      fontSize: 13,
                      color: "var(--text)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}>
                      {ej.nombre}
                    </div>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      marginTop: 3,
                    }}>
                      <BadgeGrupo grupo={ej.grupo_muscular} />
                      {ej.equipo && (
                        <span style={{
                          fontFamily: H.mono,
                          fontSize: 10,
                          color: "var(--faint)",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}>
                          {ej.equipo}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Botón acción */}
                  <span style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    fontFamily: H.mono,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    padding: "5px 12px",
                    borderRadius: 8,
                    flexShrink: 0,
                    marginLeft: 12,
                    background: yaAnadido
                      ? hexAlfa("#3ecf8e", 0.1)
                      : hexAlfa(accentColor, 0.1),
                    color: yaAnadido ? "var(--green)" : accentColor,
                    border: `1px solid ${yaAnadido
                      ? hexAlfa("#3ecf8e", 0.3)
                      : hexAlfa(accentColor, 0.3)}`,
                  }}>
                    {yaAnadido ? (
                      <><IcCheck /> {t("modal_exercise.added")}</>
                    ) : (
                      <><IcPlus /> {t("modal_exercise.add")}</>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Barra inferior (móvil) — solo visible en pantallas pequeñas ── */}
      <div style={{
        display: "none",
        padding: "12px 16px",
        borderTop: `1px solid var(--line)`,
        background: H.panel,
      }}
        className="editor-mobile-bar"
      >
        <button
          onClick={guardar}
          disabled={saving || savedOk}
          style={{
            width: "100%",
            padding: "13px",
            borderRadius: 12,
            fontFamily: H.mono,
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            cursor: (saving || savedOk) ? "default" : "pointer",
            background: savedOk ? "var(--green)" : "var(--accent)",
            color: "#0d0d0f",
            border: "none",
          }}
        >
          {savedOk ? "Guardado" : saving ? "Guardando..." : "Guardar rutina"}
        </button>
      </div>

      <style>{`
        @media (max-width: 680px) {
          .editor-mobile-bar { display: block !important; }
        }
        @media (max-width: 680px) {
          /* En móvil: columnas apiladas con scroll */
          [data-editor-grid] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
