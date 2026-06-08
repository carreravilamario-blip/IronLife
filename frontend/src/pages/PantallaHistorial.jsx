// ============================================================
//  PantallaHistorial — Lista cronológica de sesiones con panel
//  de detalle. Implementa el diseño "IronLife Historial".
//
//  Fuente de datos:
//  1. Sesiones reales desde la API (/api/historial).
//  2. Sesiones guardadas en localStorage (ironlife_history_v1).
// ============================================================

import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { WK as V } from "../ui/theme";
import { COLORES_RUTINA } from "../constants/routines";
import { MONTHS_SHORT, MONTHS_ES, WEEKDAYS_FULL } from "../constants/dates";
import { fmtDur, fmtReloj, fmtRitmo, fmtVol } from "../utils/format";
import { volumenSesion, seriesSesion } from "../utils/training";
import { diaSemana } from "../utils/dates";
import { useAuth } from "../context";
import { obtenerHistorial } from "../api/index";

// ── Helper: mapea rutina_nombre → routineId ───────────────────
function mapRouteId(nombre) {
  const n = (nombre || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (n.includes('push') || n.includes('empuje')) return 'push';
  if (n.includes('pull') || n.includes('tiron'))  return 'pull';
  if (n.includes('leg')  || n.includes('pierna')) return 'legs';
  return 'full';
}

// ── Convierte una sesión de la API al formato del componente ──
function apiSesionToLocal(s) {
  const routineId = mapRouteId(s.rutina_nombre);
  return {
    id:        `api-${s.id}`,
    y:         s.y,
    m:         s.m,
    d:         s.d,
    type:      "fuerza",
    routineId,
    name:      s.rutina_nombre || "Entrenamiento",
    mins:      s.duracion_minutos ?? 0,
    exercises: (s.ejercicios || []).map((e) => ({
      name:  e.nombre,
      group: e.grupo_muscular || "",
      color: COLORES_RUTINA[routineId] || "var(--accent)",
      pr:    false,
      sets:  (e.series || []).map((st) => [st.kg ?? 0, st.reps ?? 0]),
    })),
  };
}

// ── Iconos ────────────────────────────────────────────────────
const IcCorrer = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M13.5 5.5a2 2 0 1 0-2-2 2 2 0 0 0 2 2zM6 21l2.5-6 3 2.5V21h2v-6l-2.6-2 .7-3.5A6.9 6.9 0 0 0 17 12v-2a5 5 0 0 1-4.2-2.3l-1-1.6a2 2 0 0 0-1.3-.9 2 2 0 0 0-1.6.4L5 8.3V12h2V9.3l1.8-1.1L7 21z"/>
  </svg>
);
const IcMancuerna = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M2 9v6M5 7v10M19 7v10M22 9v6M5 12h14"/>
  </svg>
);
const IcFlecha = ({ color }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);
const IcEstrella = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill={COLORES_RUTINA.cardio}>
    <path d="M12 2l2.9 6.3 6.8.8-5 4.6 1.3 6.7L12 17.8 6 20.4l1.3-6.7-5-4.6 6.8-.8z"/>
  </svg>
);

// ── Chip de filtro ────────────────────────────────────────────
function Chip({ active, color, children, onClick }) {
  const c = color || "var(--accent)";
  return (
    <button onClick={onClick} className="wk-row" style={{
      fontFamily: "var(--mono)", fontSize: 11.5, letterSpacing: "0.04em",
      padding: "7px 18px", borderRadius: 20, cursor: "pointer",
      background: active ? c : "var(--card)",
      color: active ? "#0d0d0f" : "var(--muted)",
      border: `1px solid ${active ? c : "var(--line)"}`,
      fontWeight: active ? 700 : 500,
      transition: "background 0.12s, border-color 0.12s, color 0.12s",
    }}>{children}</button>
  );
}

// ── Fila de sesión ────────────────────────────────────────────
function FilaSesion({ s, selected, onClick }) {
  const color = s.type === "cardio" ? COLORES_RUTINA.cardio : (COLORES_RUTINA[s.routineId] || "var(--accent)");
  const dia   = diaSemana(s);
  return (
    <button onClick={onClick} className="wk-row" style={{
      width: "100%", textAlign: "left", display: "flex", alignItems: "center",
      gap: 14, padding: "13px 14px", cursor: "pointer", borderRadius: 12,
      background: selected ? "var(--card)" : "transparent",
      border: `1px solid ${selected ? "rgba(255,87,34,0.4)" : "var(--line2)"}`,
      marginBottom: 8,
      boxShadow: selected ? "0 0 0 3px rgba(255,87,34,0.1)" : "none",
    }}>
      {/* fecha */}
      <div style={{ flexShrink: 0, width: 46, textAlign: "center" }}>
        <div style={{ fontFamily: "var(--display)", fontSize: 24, color: "var(--text)", lineHeight: 1 }}>{s.d}</div>
        <div style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", color: "var(--faint)", marginTop: 2 }}>{MONTHS_SHORT[s.m]}</div>
      </div>
      {/* barra de color */}
      <div style={{ width: 3, alignSelf: "stretch", borderRadius: 3, background: color, flexShrink: 0 }} />
      {/* contenido */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ fontFamily: "var(--sans)", fontWeight: 700, fontSize: 15, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</span>
          {s.type === "fuerza" && s.prNote && <IcEstrella />}
        </div>
        <div style={{ display: "flex", gap: 14, fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)", flexWrap: "wrap" }}>
          <span style={{ textTransform: "capitalize" }}>{dia}</span>
          {s.type === "fuerza" ? (
            <><span>{fmtVol(volumenSesion(s))}</span><span>{seriesSesion(s)} series</span><span>{fmtDur(s.mins)}</span></>
          ) : (
            <><span style={{ color: COLORES_RUTINA.cardio }}>{s.km} km</span><span>{fmtReloj(s.sec)}</span><span>{fmtRitmo(s.sec, s.km)}</span></>
          )}
        </div>
      </div>
      <IcFlecha color={selected ? "var(--accent)" : "var(--faint)"} />
    </button>
  );
}

// ── Panel de detalle ──────────────────────────────────────────
function DetalleSesion({ s }) {
  const { t } = useTranslation();
  if (!s) return null;

  const color  = s.type === "cardio" ? COLORES_RUTINA.cardio : (COLORES_RUTINA[s.routineId] || "var(--accent)");
  const fechaFull = `${diaSemana(s)}, ${s.d} de ${MONTHS_ES[s.m].toLowerCase()}`;

  const stats = s.type === "fuerza"
    ? [[t("history.stat_volume"), fmtVol(volumenSesion(s))], [t("history.stat_sets"), seriesSesion(s)], [t("history.stat_exercises"), s.exercises.length], [t("history.stat_duration"), fmtDur(s.mins)]]
    : [[t("history.stat_distance"), `${s.km} km`], [t("history.stat_time"), fmtReloj(s.sec)], [t("history.stat_pace"), fmtRitmo(s.sec, s.km)], ["Kcal", Math.round(s.km * 68)]];

  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 16, overflow: "hidden" }}>
      {/* cabecera */}
      <div style={{ padding: "20px 22px", borderBottom: "1px solid var(--line2)", background: `linear-gradient(180deg, var(--card), var(--panel))` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontFamily: "var(--mono)", fontSize: 10.5, fontWeight: 700,
            letterSpacing: "0.08em", textTransform: "uppercase",
            color: "#0d0d0f", background: color, padding: "4px 9px", borderRadius: 6,
          }}>
            {s.type === "cardio" ? <IcCorrer /> : <IcMancuerna />}
            {s.type}
          </span>
          <span style={{ fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--muted)", textTransform: "capitalize" }}>{fechaFull}</span>
        </div>
        <h2 style={{ margin: 0, fontFamily: "var(--display)", fontSize: 28, textTransform: "uppercase", letterSpacing: "0.01em", color: "var(--text)" }}>{s.name}</h2>
      </div>

      {/* stats */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--line2)" }}>
        {stats.map(([label, valor], i) => (
          <div key={i} style={{ flex: 1, padding: "14px 16px", borderRight: i < stats.length - 1 ? "1px solid var(--line2)" : "none" }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 9.5, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--faint)", marginBottom: 6 }}>{label}</div>
            <div style={{ fontFamily: "var(--display)", fontSize: 20, color: "var(--text)" }}>{valor}</div>
          </div>
        ))}
      </div>

      {/* nota PR */}
      {s.prNote && (
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "12px 22px", background: "rgba(250,204,21,0.08)", borderBottom: "1px solid var(--line2)" }}>
          <IcEstrella />
          <span style={{ fontFamily: "var(--sans)", fontSize: 13.5, fontWeight: 600, color: COLORES_RUTINA.cardio }}>{s.prNote}</span>
        </div>
      )}

      {/* cuerpo */}
      <div className="wk-scroll" style={{ padding: "8px 22px 22px", overflowY: "auto", maxHeight: "calc(100vh - 380px)" }}>
        {s.type === "fuerza" ? (
          s.exercises.map((e, i) => (
            <div key={i} style={{ padding: "15px 0", borderBottom: i < s.exercises.length - 1 ? "1px solid var(--line2)" : "none" }}>
              {/* nombre + grupo */}
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 11 }}>
                <span style={{ width: 9, height: 9, borderRadius: 3, background: e.color, flexShrink: 0 }} />
                <span style={{ fontFamily: "var(--sans)", fontWeight: 700, fontSize: 15, color: "var(--text)" }}>{e.name}</span>
                {e.pr && <IcEstrella />}
                <span style={{ marginLeft: "auto", fontFamily: "var(--mono)", fontSize: 10.5, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--faint)" }}>{e.group}</span>
              </div>
              {/* chips de series */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {e.sets.map((st, j) => (
                  <span key={j} style={{
                    display: "inline-flex", alignItems: "baseline", gap: 5,
                    fontFamily: "var(--mono)", fontSize: 13,
                    padding: "7px 11px", borderRadius: 8,
                    background: "var(--panel2)", border: "1px solid var(--line2)",
                  }}>
                    <span style={{ fontSize: 9.5, color: "var(--faint)" }}>{j + 1}</span>
                    <span style={{ fontWeight: 600, color: "var(--text)" }}>{st[0]}</span>
                    <span style={{ color: "var(--faint)" }}>kg ×</span>
                    <span style={{ fontWeight: 600, color: "var(--text)" }}>{st[1] ?? "—"}</span>
                  </span>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div style={{ padding: "18px 0 4px" }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 6, marginBottom: 18 }}>
              <span style={{ fontFamily: "var(--display)", fontSize: 64, lineHeight: 0.9, color: COLORES_RUTINA.cardio }}>{s.km}</span>
              <span style={{ fontFamily: "var(--mono)", fontSize: 16, color: "var(--muted)", marginBottom: 8 }}>{t("history.km_ran")}</span>
            </div>
            {s.note && <p style={{ fontFamily: "var(--sans)", fontSize: 14, color: "var(--text2)", margin: 0, lineHeight: 1.5 }}>{s.note}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────
export default function PantallaHistorial() {
  const { t } = useTranslation();
  const { usuario, token } = useAuth();
  const [filtro, setFiltro]         = useState("todo");
  const [selId, setSelId]           = useState(null);
  const [apiSesiones, setApiSesiones] = useState([]);
  const [cargando, setCargando]     = useState(true);

  // Carga sesiones reales desde la API al montar
  useEffect(() => {
    if (!token) { setCargando(false); return; }
    setCargando(true);
    obtenerHistorial(token)
      .then((data) => {
        const convertidas = (Array.isArray(data) ? data : []).map(apiSesionToLocal);
        setApiSesiones(convertidas);
      })
      .catch(() => {
        setApiSesiones([]);
      })
      .finally(() => {
        setCargando(false);
      });
  }, [token]);

  // Mezcla: API + localStorage, ordenadas por fecha descendente
  const todas = useMemo(() => {
    let guardadas = [];
    try { guardadas = JSON.parse(localStorage.getItem("ironlife_history_v1") || "[]"); } catch { /* noop */ }

    return [...apiSesiones, ...guardadas]
      .sort((a, b) => new Date(b.y, b.m, b.d) - new Date(a.y, a.m, a.d));
  }, [apiSesiones]);

  const lista = todas.filter((s) => filtro === "todo" || s.type === filtro);

  // Selección: primera sesión de la lista si no hay selección manual
  const idActual = selId ?? (lista[0]?.id || null);
  const seleccionada = todas.find((s) => s.id === idActual) || null;

  // Agrupar por mes
  const grupos = [];
  lista.forEach((s) => {
    const clave = `${s.y}-${s.m}`;
    let g = grupos.find((x) => x.clave === clave);
    if (!g) { g = { clave, y: s.y, m: s.m, items: [] }; grupos.push(g); }
    g.items.push(s);
  });

  return (
    <div className="pantalla-historial">
      {/* Header */}
      <header className="historial-header">
        <div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 8 }}>
            {cargando ? t("history.loading") : t("history.sessions_count", { count: todas.length })}
          </div>
          <h1 style={{ margin: 0, fontFamily: "var(--display)", fontSize: 40, textTransform: "uppercase", letterSpacing: "0.005em" }}>
            {t("history.title")}
          </h1>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Chip active={filtro === "todo"}    onClick={() => setFiltro("todo")}>{t("history.filter_all")}</Chip>
          <Chip active={filtro === "fuerza"}  color="var(--accent)" onClick={() => setFiltro("fuerza")}>{t("history.filter_strength")}</Chip>
          <Chip active={filtro === "cardio"}  color={COLORES_RUTINA.cardio} onClick={() => setFiltro("cardio")}>{t("history.filter_cardio")}</Chip>
        </div>
      </header>

      {/* Estado de carga */}
      {cargando && (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--faint)", fontFamily: "var(--mono)", fontSize: 13 }}>
          {t("history.loading")}
        </div>
      )}

      {/* Grid: lista | detalle */}
      {!cargando && (
        <div className="historial-grid">
          {/* Columna izquierda: lista agrupada por mes o estado vacío */}
          <div className="historial-lista wk-scroll">
            {lista.length === 0 ? (
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flex:1,gap:16,padding:"60px 32px",color:"var(--muted)"}}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{opacity:0.3}}><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 16 14"/></svg>
                <div style={{fontFamily:"var(--mono)",fontSize:11,letterSpacing:"0.12em",textTransform:"uppercase",opacity:0.4,textAlign:"center"}}>{t("history.no_sessions_title")}</div>
                <div style={{fontFamily:"var(--sans)",fontSize:13,opacity:0.3,textAlign:"center"}}>{t("history.no_sessions_desc")}</div>
              </div>
            ) : (
              grupos.map((g) => (
                <div key={g.clave} style={{ marginBottom: 18 }}>
                  {/* Separador de mes */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "4px 2px 12px" }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)" }}>
                      {MONTHS_ES[g.m]} {g.y}
                    </span>
                    <span style={{ flex: 1, height: 1, background: "var(--line2)" }} />
                    <span style={{ fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--faint)" }}>{g.items.length}</span>
                  </div>
                  {g.items.map((s) => (
                    <FilaSesion
                      key={s.id}
                      s={s}
                      selected={s.id === idActual}
                      onClick={() => setSelId(s.id)}
                    />
                  ))}
                </div>
              ))
            )}
          </div>

          {/* Columna derecha: detalle (solo si hay sesión seleccionada) */}
          {seleccionada && (
            <div className="historial-detalle wk-scroll">
              <DetalleSesion s={seleccionada} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
