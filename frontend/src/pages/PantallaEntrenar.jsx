// ============================================================
//  PantallaEntrenar - Pantalla principal de entrenamiento.
//  Incluye cronómetro de sesión persistente + toast de fin
//  + temporizador de descanso entre series.
// ============================================================

import { useState, useEffect, useRef, useCallback, useReducer } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import TarjetaEjercicio from "../components/TarjetaEjercicio";
import ModalEjercicio from "../components/ModalEjercicio";
import { useAuth } from "../context";
import {
  crearSesion,
  obtenerAnterior,
  crearSerie,
  actualizarSerie,
  borrarSerie,
  finalizarSesion,
  finalizarSesionConDuracion,
} from "../api";

// ── Calendario: guardar rutina del día al finalizar ──────────
const CAL_KEY  = "ironlife_calendar_v3";
const HIST_KEY = "ironlife_history_v1";
const RC_COLORS = { push: "#ff5722", pull: "#3b82f6", legs: "#a855f7", full: "#3ecf8e" };

function guardarEnHistorial(rutina, ejerciciosActivos, elapsed) {
  try {
    const hoy = new Date();
    const routineId = mapearRutinaACalendario(rutina.nombre);
    const exercises = ejerciciosActivos
      .filter(({ series }) => series.some((s) => s.completada))
      .map(({ ejercicio, series }) => ({
        name:  ejercicio.nombre,
        group: ejercicio.grupo_muscular,
        color: RC_COLORS[routineId] || "#ff5722",
        sets:  series
          .filter((s) => s.completada && (s.kg > 0 || s.reps > 0))
          .map((s) => [s.kg, s.reps]),
        pr: false,
      }))
      .filter((e) => e.sets.length > 0);

    const rec = {
      id:        "h" + Date.now(),
      y:         hoy.getFullYear(),
      m:         hoy.getMonth(),   // 0-indexado
      d:         hoy.getDate(),
      type:      "fuerza",
      routineId,
      name:      rutina.nombre,
      mins:      Math.max(1, Math.round(elapsed / 60)),
      exercises,
      prNote:    null,
    };
    const arr = JSON.parse(localStorage.getItem(HIST_KEY) || "[]");
    arr.unshift(rec);
    localStorage.setItem(HIST_KEY, JSON.stringify(arr));
  } catch { /* noop */ }
}

function mapearRutinaACalendario(nombre) {
  const n = (nombre || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  if (n.includes("push") || n.includes("empuje")) return "push";
  if (n.includes("pull") || n.includes("tiron") || n.includes("espalda")) return "pull";
  if (n.includes("leg") || n.includes("pierna") || n.includes("cuad")) return "legs";
  return "full";
}

function guardarDiaEnCalendario(nombreRutina) {
  try {
    const hoy = new Date();
    const clave = [
      hoy.getFullYear(),
      String(hoy.getMonth() + 1).padStart(2, "0"),
      String(hoy.getDate()).padStart(2, "0"),
    ].join("-");
    const cal = JSON.parse(localStorage.getItem(CAL_KEY) || "{}");
    cal[clave] = { ...cal[clave], routineId: mapearRutinaACalendario(nombreRutina) };
    localStorage.setItem(CAL_KEY, JSON.stringify(cal));
  } catch { /* noop */ }
}

// ── Cronómetro ───────────────────────────────────────────────
const TIMER_KEY = "ironlife_timer_v1";

function cargarTimer() {
  try {
    const t = JSON.parse(localStorage.getItem(TIMER_KEY));
    if (t) return t;
  } catch (e) { /* noop */ }
  return { base: 0, running: false, startedAt: null };
}

function timerElapsed(t) {
  return t.base + (t.running && t.startedAt ? Math.floor((Date.now() - t.startedAt) / 1000) : 0);
}

function fmtTimer(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const mm = String(m).padStart(2, "0"), ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

// ── Iconos ───────────────────────────────────────────────────
const IcPlus = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IcPlay = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7 5l12 7-12 7z"/></svg>
);
const IcPause = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>
  </svg>
);
const IcReset = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10"/><path d="M3.5 15a9 9 0 1 0 .9-8.7L1 10"/>
  </svg>
);

function num(v) {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
}

// ── Constante para la duración del descanso (segundos) ───────
const REST_DURATION = 90;

export default function PantallaEntrenar() {
  const { t, i18n } = useTranslation();
  const { token, rutinas } = useAuth();
  const { rutinaId } = useParams();
  const navigate     = useNavigate();
  const rutina       = rutinas?.find((r) => r.id === parseInt(rutinaId));

  const [, setSesionId]               = useState(null);
  const [activos, setActivos]         = useState({});
  const [anteriores, setAnteriores]   = useState({});
  const [cargando, setCargando]       = useState(true);
  const [finalizado, setFinalizado]   = useState(false);
  const [errorMsg, setErrorMsg]       = useState("");
  const [modalOpen, setModalOpen]     = useState(false);
  const [toast, setToast]             = useState(null);

  // ── Temporizador de descanso ──────────────────────────────
  const [restTimer, setRestTimer] = useState(null); // {sec: 90, running: true}

  const sesionIdRef = useRef(null);
  const activosRef  = useRef({});
  activosRef.current = activos;

  // ── Cronómetro ─────────────────────────────────────────────
  const [timer, setTimer] = useState(cargarTimer);
  const [, tick] = useReducer((x) => x + 1, 0);

  useEffect(() => {
    try { localStorage.setItem(TIMER_KEY, JSON.stringify(timer)); } catch (e) { /* noop */ }
  }, [timer]);

  useEffect(() => {
    if (!timer.running) return;
    const iv = setInterval(() => tick(), 1000);
    return () => clearInterval(iv);
  }, [timer.running]);

  const elapsed = timerElapsed(timer);

  const startTimer = () =>
    setTimer((t) => (t.running ? t : { ...t, running: true, startedAt: Date.now() }));
  const pauseTimer = () =>
    setTimer((t) => (!t.running ? t : { base: timerElapsed(t), running: false, startedAt: null }));
  const resetTimer = () =>
    setTimer({ base: 0, running: false, startedAt: null });

  // ── Countdown del temporizador de descanso ────────────────
  useEffect(() => {
    if (!restTimer || !restTimer.running) return;
    if (restTimer.sec <= 0) {
      setRestTimer(null);
      return;
    }
    const iv = setInterval(() => {
      setRestTimer((prev) => {
        if (!prev || !prev.running) return prev;
        const next = prev.sec - 1;
        if (next <= 0) return null;
        return { ...prev, sec: next };
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [restTimer?.running, restTimer?.sec === REST_DURATION]); // re-run only when a new timer starts

  // ── Arrancar sesión ──────────────────────────────────────
  useEffect(() => {
    if (!rutinas) return;
    if (rutinas.length === 0) return;
    if (!rutina || !token) {
      setCargando(false);
      setErrorMsg("Rutina no encontrada.");
      return;
    }

    setSesionId(null);
    sesionIdRef.current = null;
    setActivos({});
    setCargando(true);
    setErrorMsg("");

    async function iniciar() {
      try {
        const sesion = await crearSesion(rutina.id, token);
        sesionIdRef.current = sesion.id;
        setSesionId(sesion.id);

        const ejerciciosIniciales = {};
        const anterioresMap = {};
        await Promise.all(
          rutina.ejercicios.map(async (ej) => {
            const ant = await obtenerAnterior(ej.id, token);
            anterioresMap[ej.id] = ant;
            ejerciciosIniciales[ej.id] = { ejercicio: ej, series: [] };
          })
        );

        setAnteriores(anterioresMap);
        setActivos(ejerciciosIniciales);
      } catch (err) {
        setErrorMsg("Error al iniciar la sesión: " + err.message);
      } finally {
        setCargando(false);
      }
    }

    iniciar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rutinaId, token]);

  // ── Añadir ejercicio desde el modal ─────────────────────
  const manejarAnadirEjercicio = useCallback(async (ejercicio) => {
    const sid = sesionIdRef.current;
    if (!sid || activos[ejercicio.id]) return;

    try {
      const ant = await obtenerAnterior(ejercicio.id, token);
      setAnteriores((prev) => ({ ...prev, [ejercicio.id]: ant }));
    } catch { /* noop */ }

    setActivos((prev) => ({
      ...prev,
      [ejercicio.id]: { ejercicio, series: [] },
    }));
  }, [token, activos]);

  // ── Añadir serie ─────────────────────────────────────────
  const manejarAnadirSerie = useCallback(async (ejercicioId) => {
    const sid = sesionIdRef.current;
    if (!sid) return;

    const seriesActuales = activosRef.current[ejercicioId]?.series ?? [];
    const numero = seriesActuales.length + 1;
    const ultima = seriesActuales[seriesActuales.length - 1];

    try {
      const nuevaSerie = await crearSerie(sid, {
        ejercicio_id: ejercicioId,
        numero,
        kg:   ultima?.kg ?? 0,
        reps: ultima?.reps ?? 0,
        rir:  null,
        completada: false,
      }, token);

      setActivos((prev) => ({
        ...prev,
        [ejercicioId]: {
          ...prev[ejercicioId],
          series: [...(prev[ejercicioId]?.series ?? []), nuevaSerie],
        },
      }));
    } catch { /* noop */ }
  }, [token]);

  // ── Actualizar serie ─────────────────────────────────────
  const manejarActualizarSerie = useCallback(async (ejercicioId, serieId, cambios) => {
    try {
      const actualizada = await actualizarSerie(serieId, cambios, token);
      setActivos((prev) => ({
        ...prev,
        [ejercicioId]: {
          ...prev[ejercicioId],
          series: prev[ejercicioId].series.map((s) =>
            s.id === serieId ? { ...s, ...actualizada } : s
          ),
        },
      }));
      if (cambios.completada === true) {
        setRestTimer({ sec: REST_DURATION, running: true });
      }
    } catch { /* noop */ }
  }, [token]);

  // ── Borrar serie ─────────────────────────────────────────
  const manejarBorrarSerie = useCallback(async (ejercicioId, serieId) => {
    try {
      await borrarSerie(serieId, token);
      setActivos((prev) => ({
        ...prev,
        [ejercicioId]: {
          ...prev[ejercicioId],
          series: prev[ejercicioId].series
            .filter((s) => s.id !== serieId)
            .map((s, i) => ({ ...s, numero: i + 1 })),
        },
      }));
    } catch { /* noop */ }
  }, [token]);

  // ── Quitar ejercicio ─────────────────────────────────────
  const manejarEliminarEjercicio = useCallback((ejercicioId) => {
    setActivos((prev) => {
      const copia = { ...prev };
      delete copia[ejercicioId];
      return copia;
    });
  }, []);

  // ── Finalizar sesión ─────────────────────────────────────
  const manejarFinalizar = async () => {
    const sid = sesionIdRef.current;
    if (!sid) return;
    try {
      await finalizarSesionConDuracion(sid, Math.max(1, Math.round(elapsed / 60)), token);
      const mins = Math.max(1, Math.round(elapsed / 60));
      const nEjercicios = ejerciciosActivos.length;
      resetTimer();
      setRestTimer(null);
      guardarDiaEnCalendario(rutina.nombre);
      guardarEnHistorial(rutina, ejerciciosActivos, elapsed);
      setFinalizado(true);
      const toastKey = nEjercicios !== 1 ? "training.session_saved_plural" : "training.session_saved";
      setToast(t(toastKey, { mins, exercises: nEjercicios }));
    } catch { /* noop */ }
  };

  // ── Estadísticas ─────────────────────────────────────────
  const todasSeries       = Object.values(activos).flatMap((e) => e.series);
  const seriesCompletadas = todasSeries.filter((s) => s.completada).length;
  const volumenTotal      = todasSeries
    .filter((s) => s.completada)
    .reduce((acc, s) => acc + num(s.kg) * num(s.reps), 0);
  const volumenStr =
    volumenTotal >= 1000
      ? `${(volumenTotal / 1000).toFixed(1).replace(/\.0$/, "")}k kg`
      : `${volumenTotal.toLocaleString("es-ES")} kg`;

  const ejerciciosActivos = Object.values(activos);

  // ── Renders condicionales ─────────────────────────────────
  if (finalizado) {
    return (
      <div className="pantalla-fin">
        <div className="fin-contenido">
          <div className="fin-icono-svg">
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 4h12v3a6 6 0 0 1-12 0V4Z"/><path d="M6 5H3v2a3 3 0 0 0 3 3"/><path d="M18 5h3v2a3 3 0 0 1-3 3"/>
              <path d="M9 14.5h6l-.5 3.5h-5l-.5-3.5Z"/><path d="M8 21h8"/>
            </svg>
          </div>
          <h2>{t("training.session_done")}</h2>
          <p className="fin-stats">
            {seriesCompletadas} {t("training.sets").toLowerCase()} &middot; {volumenTotal.toLocaleString(i18n.language)} kg
          </p>
          {toast && <p className="fin-toast">{toast}</p>}
          <button className="btn-naranja" onClick={() => navigate("/")}>
            {t("training.back_home")}
          </button>
        </div>
      </div>
    );
  }

  if (cargando) {
    return (
      <div className="pantalla-vacia">
        <p className="cargando-pantalla">{t("training.preparing")}</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="pantalla-vacia">
        <p style={{ color: "var(--error)" }}>{errorMsg}</p>
      </div>
    );
  }

  if (!rutina) {
    return (
      <div className="pantalla-vacia">
        <h2>{t("training.choose_routine")}</h2>
      </div>
    );
  }

  const locale = i18n.language?.startsWith("en") ? "en-GB" : "es-ES";
  const hoy = new Date().toLocaleDateString(locale, {
    weekday: "long", day: "numeric", month: "long",
  });

  return (
    <div className="pantalla-entrenar">
      {/* ── Header ── */}
      <div className="entrenar-header">
        <div className="entrenar-header-inner">
          <div>
            <p className="entrenar-fecha">{t("training.session_header")} &middot; {hoy.toUpperCase()}</p>
            <h1 className="entrenar-titulo">{rutina.nombre.toUpperCase()}</h1>
          </div>

          <div className="entrenar-stats">
            {/* Cronómetro */}
            <div className={`timer-widget${timer.running ? " running" : ""}`}>
              <div className="timer-info">
                <span className="timer-label">{t("training.time")}</span>
                <span className="timer-display">{fmtTimer(elapsed)}</span>
              </div>
              <button
                className="timer-btn-play"
                onClick={timer.running ? pauseTimer : startTimer}
                title={timer.running ? t("training.pause") : t("training.start")}
              >
                {timer.running ? <IcPause /> : <IcPlay />}
              </button>
              <button
                className="timer-btn-reset wk-icon-btn"
                onClick={resetTimer}
                disabled={elapsed === 0}
                title={t("training.restart")}
              >
                <IcReset />
              </button>
            </div>

            {/* Stats */}
            <div className="stat-chip">
              <span className="stat-label">{t("training.volume")}</span>
              <span className="stat-valor accent">{volumenStr}</span>
            </div>
            <div className="stat-chip">
              <span className="stat-label">{t("training.sets")}</span>
              <span className="stat-valor">{seriesCompletadas}/{todasSeries.length}</span>
            </div>
            <div className="stat-chip">
              <span className="stat-label">{t("training.exercises_abbr")}</span>
              <span className="stat-valor">{ejerciciosActivos.length}</span>
            </div>

            <button className="btn-naranja" onClick={manejarFinalizar}>
              {t("training.finish")}
            </button>
          </div>
        </div>
      </div>

      {/* ── Lista de ejercicios ── */}
      <div className="ejercicios-lista">
        <div className="ejercicios-inner">
          {ejerciciosActivos.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 0", color: "var(--muted)", fontFamily: "var(--mono)", fontSize: 13 }}>
              {t("training.no_exercises")}
            </div>
          )}

          {ejerciciosActivos.map(({ ejercicio, series }) => (
            <TarjetaEjercicio
              key={ejercicio.id}
              ejercicio={ejercicio}
              series={series}
              anterior={anteriores[ejercicio.id]}
              onAnadirSerie={() => manejarAnadirSerie(ejercicio.id)}
              onActualizarSerie={(serieId, cambios) =>
                manejarActualizarSerie(ejercicio.id, serieId, cambios)
              }
              onBorrarSerie={(serieId) => manejarBorrarSerie(ejercicio.id, serieId)}
              onEliminarEjercicio={() => manejarEliminarEjercicio(ejercicio.id)}
            />
          ))}

          <button className="btn-añadir-ejercicio" onClick={() => setModalOpen(true)}>
            <IcPlus />
            {t("training.add_exercise")}
          </button>
        </div>
      </div>

      {/* ── Toast de descanso ── */}
      {restTimer && restTimer.running && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1000,
            display: "flex",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              pointerEvents: "auto",
              background: "var(--surface, #1e1e2e)",
              border: "1px solid var(--border, rgba(255,255,255,0.1))",
              borderRadius: "16px",
              padding: "14px 20px",
              minWidth: "220px",
              maxWidth: "320px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
            }}
          >
            {/* Label */}
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--muted, #888)",
                fontFamily: "var(--mono, monospace)",
              }}
            >
              {t("training.rest")}
            </span>

            {/* Countdown */}
            <span
              style={{
                fontSize: "36px",
                fontWeight: 700,
                fontFamily: "var(--mono, monospace)",
                color: "var(--accent, #ff5722)",
                lineHeight: 1,
                letterSpacing: "0.04em",
              }}
            >
              {fmtTimer(restTimer.sec)}
            </span>

            {/* Progress bar track */}
            <div
              style={{
                width: "100%",
                height: "4px",
                borderRadius: "2px",
                background: "var(--border, rgba(255,255,255,0.1))",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  borderRadius: "2px",
                  background: "var(--accent, #ff5722)",
                  width: `${(restTimer.sec / REST_DURATION) * 100}%`,
                  transition: "width 1s linear",
                }}
              />
            </div>

            {/* Skip button */}
            <button
              onClick={() => setRestTimer(null)}
              style={{
                marginTop: "2px",
                background: "transparent",
                border: "1px solid var(--border, rgba(255,255,255,0.15))",
                borderRadius: "8px",
                color: "var(--text, #fff)",
                fontSize: "13px",
                fontWeight: 500,
                padding: "5px 16px",
                cursor: "pointer",
                fontFamily: "var(--sans, sans-serif)",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              {t("training.skip")}
            </button>
          </div>
        </div>
      )}

      {/* ── Modal de ejercicios ── */}
      <ModalEjercicio
        open={modalOpen}
        ejerciciosActivos={ejerciciosActivos.map((e) => e.ejercicio)}
        onAnadir={manejarAnadirEjercicio}
        onCerrar={() => setModalOpen(false)}
      />
    </div>
  );
}
