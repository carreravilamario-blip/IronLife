// ============================================================
//  ModalEjercicio - Modal para añadir ejercicio a la sesión.
//  Incluye búsqueda en el catálogo y creación de ejercicios
//  personalizados.
// ============================================================

import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { listarEjercicios, crearEjercicioPersonalizado, sincronizarEjerciciosWger } from "../api";
import { useAuth } from "../context";
import { colorDeGrupo, hexAlfa } from "../ui/grupoColores";
import { ACCENT_HEX } from "../ui/theme";

// Normaliza nombres de grupo duplicados (p.ej. "HOMBRO" → "HOMBROS")
const NORMALIZAR = { "HOMBRO": "HOMBROS", "BÍCEPS": "BICEPS", "TRÍCEPS": "TRICEPS", "CUÁDRICEPS": "CUADRICEPS", "GLÚTEOS": "GLUTEOS" };
const normGrupo = (g) => NORMALIZAR[g?.toUpperCase()] ?? g;

// ── Iconos ────────────────────────────────────────────────────
const IcSearch = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round">
    <circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const IcClose = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IcPlus = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IcBack = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);

// Opciones de grupos musculares y equipos disponibles
const GRUPOS = ["BICEPS", "CUADRICEPS", "ESPALDA", "GEMELOS", "HOMBRO", "ISQUIOS", "PECHO", "TRICEPS"];
const EQUIPOS = ["BARRA", "MANCUERNAS", "POLEA", "MAQUINA", "PESO CORPORAL", "OTRO"];

// Normaliza texto para búsqueda sin acentos
function norm(s) {
  return (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

// ── Formulario de ejercicio personalizado ─────────────────────
function FormEjercicioPersonalizado({ onCreado, onVolver }) {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [nombre, setNombre]   = useState("");
  const [grupo, setGrupo]     = useState("");
  const [equipo, setEquipo]   = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError]     = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 40);
  }, []);

  async function manejarGuardar(e) {
    e.preventDefault();
    if (!nombre.trim()) { setError(t("modal_exercise.error_name")); return; }
    if (!grupo)          { setError(t("modal_exercise.error_group")); return; }
    if (!equipo)         { setError(t("modal_exercise.error_equipment")); return; }

    setGuardando(true);
    setError("");
    try {
      const nuevo = await crearEjercicioPersonalizado(
        { nombre: nombre.trim(), grupo_muscular: grupo, equipo },
        token
      );
      onCreado(nuevo); // lo añade a la sesión y cierra el modal
    } catch (err) {
      setError(err.message);
      setGuardando(false);
    }
  }

  return (
    <div className="modal-custom-form">
      {/* Cabecera */}
      <div className="modal-cabecera">
        <div className="modal-titulo-row">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button className="wk-icon-btn" onClick={onVolver} title={t("modal_exercise.back")}>
              <IcBack />
            </button>
            <h3 className="modal-titulo">{t("modal_exercise.custom_title")}</h3>
          </div>
        </div>
      </div>

      <form onSubmit={manejarGuardar} className="modal-custom-inner">
        {/* Nombre */}
        <label className="modal-custom-label">
          {t("modal_exercise.exercise_name_label")}
          <input
            ref={inputRef}
            className="modal-nr-input"
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder={t("modal_exercise.exercise_name_placeholder")}
            maxLength={120}
          />
        </label>

        {/* Grupo muscular */}
        <label className="modal-custom-label">{t("modal_exercise.muscle_group")}</label>
        <div className="modal-custom-chips">
          {GRUPOS.map((g) => (
            <button
              key={g}
              type="button"
              className={`modal-custom-chip${grupo === g ? " activo" : ""}`}
              onClick={() => setGrupo(g)}
            >
              {g}
            </button>
          ))}
        </div>

        {/* Equipo */}
        <label className="modal-custom-label" style={{ marginTop: 16 }}>{t("modal_exercise.equipment")}</label>
        <div className="modal-custom-chips">
          {EQUIPOS.map((eq) => (
            <button
              key={eq}
              type="button"
              className={`modal-custom-chip${equipo === eq ? " activo" : ""}`}
              onClick={() => setEquipo(eq)}
            >
              {eq}
            </button>
          ))}
        </div>

        {error && <p className="modal-nr-error" style={{ marginTop: 14 }}>{error}</p>}

        <button
          type="submit"
          className="modal-nr-btn modal-nr-btn-ok"
          style={{ marginTop: 20, width: "100%" }}
          disabled={guardando}
        >
          {guardando ? t("modal_exercise.creating") : t("modal_exercise.create_add")}
        </button>
      </form>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────
export default function ModalEjercicio({ open, ejerciciosActivos = [], onAnadir, onCerrar }) {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [ejercicios, setEjercicios] = useState([]);
  const [cargando, setCargando]     = useState(false);
  const [busqueda, setBusqueda]     = useState("");
  const [grupo, setGrupo]           = useState("Todos");
  const [vistaCustom, setVistaCustom] = useState(false);
  const [syncing, setSyncing]       = useState(false);
  const [syncMsg, setSyncMsg]       = useState("");
  const inputRef = useRef(null);

  // Cargar lista al abrir
  useEffect(() => {
    if (!open) return;
    setBusqueda("");
    setGrupo("Todos");
    setVistaCustom(false);
    setTimeout(() => inputRef.current?.focus(), 40);
    if (!token) return;
    setCargando(true);
    listarEjercicios(token)
      .then(setEjercicios)
      .catch(() => setEjercicios([]))
      .finally(() => setCargando(false));
  }, [open, token]);

  if (!open) return null;

  // ── Vista: formulario de ejercicio personalizado ──
  if (vistaCustom) {
    return (
      <div className="modal-backdrop" onClick={onCerrar}>
        <div className="modal-caja" onClick={(e) => e.stopPropagation()}>
          <FormEjercicioPersonalizado
            onCreado={(nuevo) => {
              // Añadimos el nuevo al catálogo local y lo añadimos a la sesión
              setEjercicios((prev) => [...prev, nuevo]);
              onAnadir(nuevo);
              onCerrar();
            }}
            onVolver={() => setVistaCustom(false)}
          />
        </div>
      </div>
    );
  }

  // ── Vista: búsqueda en el catálogo ──
  // Normalizar nombres antes de deduplicar (evita HOMBRO vs HOMBROS, etc.)
  const grupos = [
    "Todos",
    ...Array.from(new Set(ejercicios.map((e) => normGrupo(e.grupo_muscular)).filter(Boolean))).sort(),
  ];

  const resultados = ejercicios.filter((e) => {
    const grupoNorm = normGrupo(e.grupo_muscular);
    const enGrupo = grupo === "Todos" || grupoNorm === grupo;
    if (!busqueda) return enGrupo;
    const q = norm(busqueda);
    return enGrupo && (norm(e.nombre).includes(q) || norm(grupoNorm).includes(q) || norm(e.equipo).includes(q));
  });

  const idsActivos = new Set(ejerciciosActivos.map((e) => e.id));

  return (
    <div className="modal-backdrop" onClick={onCerrar}>
      <div className="modal-caja" onClick={(e) => e.stopPropagation()}>
        {/* Cabecera */}
        <div className="modal-cabecera">
          <div className="modal-titulo-row">
            <h3 className="modal-titulo">{t("modal_exercise.add_title")}</h3>
            <button className="wk-icon-btn" onClick={onCerrar} title={t("modal_exercise.close")}>
              <IcClose />
            </button>
          </div>

          {/* Búsqueda */}
          <div className="modal-search-wrap">
            <span className="modal-search-icon"><IcSearch /></span>
            <input
              ref={inputRef}
              className="modal-search"
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder={t("modal_exercise.search_placeholder")}
            />
          </div>

          {/* Filtros por grupo — cada grupo con su color */}
          <div className="modal-grupos">
            {grupos.map((g) => {
              const color = g === "Todos" ? ACCENT_HEX : colorDeGrupo(g);
              const activo = grupo === g;
              return (
                <button
                  key={g}
                  onClick={() => setGrupo(g)}
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 11,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    padding: "5px 11px",
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

        {/* Lista */}
        <div className="modal-lista">
          {cargando && <div className="modal-vacio">{t("modal_exercise.loading")}</div>}

          {!cargando && resultados.length === 0 && (
            <div className="modal-vacio">
              {t("modal_exercise.no_results")}{busqueda ? ` para "${busqueda}"` : ""}.
            </div>
          )}

          {!cargando && resultados.map((e) => {
            const yaAnadido = idsActivos.has(e.id);
            return (
              <button
                key={e.id}
                className="modal-ejercicio-btn"
                onClick={() => { if (!yaAnadido) { onAnadir(e); onCerrar(); } }}
                disabled={yaAnadido}
              >
                <div>
                  <div className="modal-ej-nombre">{e.nombre}</div>
                  <div className="modal-ej-tags">
                    <span className="modal-ej-grupo" style={{ color: colorDeGrupo(normGrupo(e.grupo_muscular)) }}>{normGrupo(e.grupo_muscular)}</span>
                    <span className="modal-ej-equipo">{e.equipo}</span>
                  </div>
                </div>
                <span className={`modal-ej-accion ${yaAnadido ? "ya-añadido" : "disponible"}`}>
                  {yaAnadido ? t("modal_exercise.added") : <><IcPlus /> {t("modal_exercise.add")}</>}
                </span>
              </button>
            );
          })}
        </div>

        {/* Pie: botón crear personalizado + sync wger */}
        <div className="modal-pie">
          <button
            className="modal-btn-personalizado"
            onClick={() => setVistaCustom(true)}
          >
            <IcPlus />
            {t("modal_exercise.not_found")}
          </button>
          <button
            className="modal-btn-sync"
            disabled={syncing}
            onClick={async () => {
              setSyncing(true);
              setSyncMsg("");
              try {
                const res = await sincronizarEjerciciosWger(token);
                setSyncMsg(`+${res.importados} ejercicios importados (total: ${res.total_en_bd})`);
                // Recarga la lista
                const lista = await listarEjercicios(token);
                setEjercicios(lista);
              } catch (err) {
                setSyncMsg(`Error: ${err.message}`);
              } finally {
                setSyncing(false);
              }
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10"/>
              <path d="M3.5 15a9 9 0 1 0 .9-8.7L1 10"/>
            </svg>
            {syncing ? t("modal_exercise.importing") : t("modal_exercise.import_wger")}
          </button>
          {syncMsg && <p className="modal-sync-msg">{syncMsg}</p>}
        </div>
      </div>
    </div>
  );
}
