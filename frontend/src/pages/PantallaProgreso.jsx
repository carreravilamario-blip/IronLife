// ============================================================
//  PantallaProgreso — Panel de análisis: KPIs, progresión de
//  fuerza, volumen semanal, récords, reparto muscular, peso
//  corporal y logros.
//
//  Implementa el mockup "IronLife Progreso". Conectado a la
//  analítica del backend (/api/estadisticas).
// ============================================================

import { useState, useEffect } from "react";
import { WK as G, ACCENT_HEX } from "../ui/theme";
import { LineChart, VolumeBars, HBars, pHexA as pa } from "../components/Charts";
import { useAuth } from "../context";
import { obtenerEstadisticas } from "../api";

function Card({ title, action, children, pad = 20, style }) {
  return (
    <div style={{ background: G.card, border: `1px solid ${G.line}`, borderRadius: 16, padding: pad, ...style }}>
      {(title || action) && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontFamily: G.sans, fontWeight: 800, fontSize: 17, color: G.text, whiteSpace: "nowrap" }}>{title}</h3>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

function Kpi({ label, value, unit, sub, accent }) {
  return (
    <div style={{ flex: 1, minWidth: 150, background: G.card, border: `1px solid ${G.line}`, borderRadius: 14, padding: "15px 17px" }}>
      <div style={{ fontFamily: G.mono, fontSize: 9.5, letterSpacing: "0.12em", textTransform: "uppercase", color: G.faint, marginBottom: 9 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
        <span style={{ fontFamily: G.anton, fontSize: 30, lineHeight: 1, color: accent ? G.accent : G.text, fontWeight: 700 }}>{value}</span>
        {unit && <span style={{ fontFamily: G.mono, fontSize: 12, color: G.muted }}>{unit}</span>}
      </div>
      {sub && <div style={{ fontFamily: G.mono, fontSize: 10.5, color: G.green, marginTop: 7 }}>{sub}</div>}
    </div>
  );
}

// Iconos de logros (SVG de línea) por nombre.
const ACH_ICONS = {
  trophy: <g><path d="M6 4h12v3a6 6 0 0 1-12 0V4Z" /><path d="M6 5H3v2a3 3 0 0 0 3 3" /><path d="M18 5h3v2a3 3 0 0 1-3 3" /><path d="M9 14.5h6l-.5 3.5h-5l-.5-3.5Z" /><path d="M8 21h8" /></g>,
  flame: <g><path d="M12 3c1 3 4 4.5 4 8a4 4 0 0 1-8 0c0-1.2.4-2 1-2.8C9 10 9.5 11.5 11 12c-.5-3 .5-6 1-9Z" /></g>,
  squat: <g><path d="M3 8v8M6 6v12M18 6v12M21 8v8M6 12h12" /></g>,
  target: <g><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r="0.6" fill="currentColor" /></g>,
  medal: <g><path d="M8 3 6 8M16 3l2 5" /><circle cx="12" cy="15" r="5" /><path d="M12 13v4M10.5 15h3" /></g>,
  bolt: <g><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" /></g>,
  mountain: <g><path d="M3 20 10 7l4 7 2-3 5 9H3Z" /><path d="m9 9 1 1.5" /></g>,
  crown: <g><path d="M3 7l3.5 4L12 5l5.5 6L21 7l-1.5 12h-15L3 7Z" /><path d="M4.5 19h15" /></g>,
};
function AchIcon({ name, color, size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {ACH_ICONS[name] || ACH_ICONS.trophy}
    </svg>
  );
}

// Paleta de colores para ejercicios de la API (el primero usa ACCENT_HEX).
const API_COLORS = [ACCENT_HEX, "#a855f7", "#3b82f6", "#3ecf8e", "#38bdf8", "#facc15", "#ff5722", "#f97316"];

function epley1RM(kg, reps) {
  if (!kg || !reps || reps === 1) return kg ?? 0;
  return Math.round(kg * (1 + reps / 30));
}

export default function PantallaProgreso() {
  const { token } = useAuth();

  const [stats, setStats] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [liftId, setLiftId] = useState(null);

  useEffect(() => {
    if (!token) {
      setCargando(false);
      return;
    }
    let cancelado = false;
    async function cargar() {
      setCargando(true);
      try {
        const data = await obtenerEstadisticas(12, token);
        if (!cancelado) setStats(data);
      } catch {
        if (!cancelado) setStats(null);
      } finally {
        if (!cancelado) setCargando(false);
      }
    }
    cargar();
    return () => { cancelado = true; };
  }, [token]);

  // Estado de carga
  if (cargando) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100%", background: G.bg }}>
        <div style={{ fontFamily: G.mono, fontSize: 13, color: G.muted, letterSpacing: "0.1em" }}>Cargando estadísticas…</div>
      </div>
    );
  }

  // Estado vacío: sin datos o sin sesiones
  const sinSesiones = !stats || !stats.resumen || stats.resumen.sesiones_totales === 0;

  if (sinSesiones) {
    return (
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100%", background: G.bg, color: G.text, fontFamily: G.sans }}>
        <header style={{ padding: "24px 32px 22px", borderBottom: `1px solid ${G.line}`, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ fontFamily: G.mono, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: G.accent, marginBottom: 8 }}>
              Análisis
            </div>
            <h1 style={{ margin: 0, fontFamily: G.anton, fontSize: 40, textTransform: "uppercase", letterSpacing: "0.005em", fontWeight: 700 }}>Tu progreso</h1>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {["12 sem", "6 meses", "Todo"].map((t, i) => (
              <span key={t} style={{ fontFamily: G.mono, fontSize: 11.5, letterSpacing: "0.04em", padding: "8px 14px", borderRadius: 9, cursor: "pointer",
                background: i === 0 ? G.accent : G.card, color: i === 0 ? "#0d0d0f" : G.muted, border: `1px solid ${i === 0 ? G.accent : G.line}`, fontWeight: i === 0 ? 700 : 500 }}>{t}</span>
            ))}
          </div>
        </header>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flex:1,gap:16,padding:"60px 32px"}}>
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{opacity:0.2}}><polyline points="3 17 9 11 13 15 21 7"/><polyline points="14 7 21 7 21 14"/></svg>
          <div style={{fontFamily:"var(--mono)",fontSize:11,letterSpacing:"0.12em",textTransform:"uppercase",color:"var(--muted)",textAlign:"center"}}>Sin datos todavía</div>
          <div style={{fontFamily:"var(--sans)",fontSize:13,color:"var(--faint)",textAlign:"center",maxWidth:280}}>Completa algunos entrenamientos y aquí verás tu progreso, récords y estadísticas</div>
        </div>
      </div>
    );
  }

  // A partir de aquí hay datos reales con sesiones > 0
  const LIFTS = stats.progresion_fuerza && stats.progresion_fuerza.length > 0
    ? stats.progresion_fuerza.map((pf, idx) => ({
        id: String(pf.ejercicio_id),
        name: pf.nombre,
        group: pf.grupo_muscular ?? "",
        color: API_COLORS[idx % API_COLORS.length],
        reps: pf.reps ?? 5,
        history: pf.historial.map((h) => h.kg_max),
      }))
    : [];

  const resolvedLiftId = liftId ?? LIFTS[0]?.id;
  const lift = LIFTS.find((l) => l.id === resolvedLiftId) ?? LIFTS[0];

  const start = lift?.history[0] ?? 0;
  const now = lift?.history[lift.history.length - 1] ?? 0;
  const deltaKg = now - start;
  const pct = start > 0 ? Math.round((deltaKg / start) * 100) : null;
  const e1Start = epley1RM(start, lift?.reps ?? 5);
  const e1Now = epley1RM(now, lift?.reps ?? 5);

  // KPIs desde datos reales
  const kpiVolumen = `${(stats.resumen.volumen_total_kg / 1000).toFixed(1)}k`;
  const kpiSesiones = stats.resumen.sesiones_totales;
  const kpiRacha = stats.resumen.racha_actual;
  const kpiHoras = Math.round(stats.resumen.horas_total);

  // Récords desde datos reales
  const records = stats.records && stats.records.length > 0
    ? stats.records.slice(0, 6).map((r, idx) => ({
        id: String(r.ejercicio_id),
        name: r.nombre,
        group: r.grupo_muscular ?? "",
        color: API_COLORS[idx % API_COLORS.length],
        reps: r.reps ?? 5,
        history: [r.kg_max],
      }))
    : [];

  // Reparto muscular desde datos reales
  const muscleSplit = stats.reparto_muscular && stats.reparto_muscular.length > 0
    ? stats.reparto_muscular.map((m, idx) => ({
        group: m.grupo,
        sets: m.series,
        color: API_COLORS[idx % API_COLORS.length],
      }))
    : [];

  // Volumen semanal desde datos reales
  const weeklyVolume = stats.volumen_semanal && stats.volumen_semanal.length > 0
    ? stats.volumen_semanal.map((s) => s.volumen_kg)
    : [];
  const weekLabels = stats.volumen_semanal && stats.volumen_semanal.length > 0
    ? stats.volumen_semanal.map((_, i) => `S${i + 1}`)
    : [];

  // Etiquetas para el gráfico de fuerza
  const forceLabels = stats.progresion_fuerza && stats.progresion_fuerza.length > 0
    ? (stats.progresion_fuerza[0]?.historial ?? []).map((h) => {
        const d = new Date(h.fecha);
        return `${d.getDate()}/${d.getMonth() + 1}`;
      })
    : [];

  // Logros desde datos reales
  const ACH = stats.logros ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%", background: G.bg, color: G.text, fontFamily: G.sans }}>
      <header style={{ padding: "24px 32px 22px", borderBottom: `1px solid ${G.line}`, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ fontFamily: G.mono, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: G.accent, marginBottom: 8 }}>
            Análisis · Datos reales
          </div>
          <h1 style={{ margin: 0, fontFamily: G.anton, fontSize: 40, textTransform: "uppercase", letterSpacing: "0.005em", fontWeight: 700 }}>Tu progreso</h1>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {["12 sem", "6 meses", "Todo"].map((t, i) => (
            <span key={t} style={{ fontFamily: G.mono, fontSize: 11.5, letterSpacing: "0.04em", padding: "8px 14px", borderRadius: 9, cursor: "pointer",
              background: i === 0 ? G.accent : G.card, color: i === 0 ? "#0d0d0f" : G.muted, border: `1px solid ${i === 0 ? G.accent : G.line}`, fontWeight: i === 0 ? 700 : 500 }}>{t}</span>
          ))}
        </div>
      </header>

      <div style={{ flex: 1, padding: "24px 32px 40px" }}>
        {/* fila de KPIs */}
        <div style={{ display: "flex", gap: 13, flexWrap: "wrap", marginBottom: 22 }}>
          <Kpi label="Volumen total" value={kpiVolumen} unit="kg" sub="▲ peso movido" accent />
          <Kpi label="Sesiones" value={kpiSesiones} sub="12 semanas" />
          <Kpi label="Racha actual" value={kpiRacha} unit="días" />
          <Kpi label="Horas" value={kpiHoras} unit="h" />
        </div>

        {/* cuadrícula de dos columnas */}
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.7fr) minmax(300px,1fr)", gap: 20, alignItems: "start" }}>
          {/* COLUMNA IZQUIERDA */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* progresión de fuerza */}
            {LIFTS.length > 0 && lift && (
              <Card title="Progresión de fuerza" pad={20}
                action={<span style={{ fontFamily: G.mono, fontSize: 11, color: G.muted }}>Serie top · {lift.reps} reps</span>}>
                {/* chips de ejercicio */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
                  {LIFTS.map((l) => {
                    const on = l.id === resolvedLiftId;
                    return (
                      <button key={l.id} onClick={() => setLiftId(l.id)} className="wk-row"
                        style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "7px 12px", borderRadius: 20, cursor: "pointer",
                          background: on ? pa(l.color, 0.16) : G.panel2, border: `1px solid ${on ? pa(l.color, 0.5) : G.line2}` }}>
                        <span style={{ width: 8, height: 8, borderRadius: 8, background: l.color }} />
                        <span style={{ fontFamily: G.sans, fontSize: 13, fontWeight: on ? 700 : 500, color: on ? G.text : G.text2 }}>{l.name}</span>
                      </button>
                    );
                  })}
                </div>

                {/* resumen empezaste → ahora */}
                <div style={{ display: "flex", alignItems: "stretch", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 110, background: G.panel2, border: `1px solid ${G.line2}`, borderRadius: 11, padding: "12px 14px" }}>
                    <div style={{ fontFamily: G.mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: G.faint, marginBottom: 6 }}>Empezaste</div>
                    <div style={{ fontFamily: G.mono, fontSize: 22, fontWeight: 700, color: G.text2 }}>{start} <span style={{ fontSize: 13, color: G.faint }}>kg</span></div>
                  </div>
                  <div style={{ flex: 1, minWidth: 110, background: pa(lift.color, 0.12), border: `1px solid ${pa(lift.color, 0.35)}`, borderRadius: 11, padding: "12px 14px" }}>
                    <div style={{ fontFamily: G.mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: G.faint, marginBottom: 6 }}>Ahora</div>
                    <div style={{ fontFamily: G.mono, fontSize: 22, fontWeight: 700, color: lift.color }}>{now} <span style={{ fontSize: 13, opacity: 0.7 }}>kg</span></div>
                  </div>
                  <div style={{ flex: 1, minWidth: 110, background: G.panel2, border: `1px solid ${G.line2}`, borderRadius: 11, padding: "12px 14px" }}>
                    <div style={{ fontFamily: G.mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: G.faint, marginBottom: 6 }}>Mejora</div>
                    <div style={{ fontFamily: G.mono, fontSize: 22, fontWeight: 700, color: G.green }}>+{deltaKg}<span style={{ fontSize: 13 }}>kg</span> {pct != null && <span style={{ fontSize: 13 }}>· +{pct}%</span>}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 110, background: G.panel2, border: `1px solid ${G.line2}`, borderRadius: 11, padding: "12px 14px" }}>
                    <div style={{ fontFamily: G.mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: G.faint, marginBottom: 6 }}>1RM est.</div>
                    <div style={{ fontFamily: G.mono, fontSize: 22, fontWeight: 700, color: G.text }}>{e1Now}<span style={{ fontSize: 13, color: G.faint }}>kg</span> <span style={{ fontSize: 12, color: G.green }}>↑{e1Now - e1Start}</span></div>
                  </div>
                </div>

                <LineChart data={lift.history} labels={forceLabels.length === lift.history.length ? forceLabels : lift.history.map((_, i) => `S${i + 1}`)} unit="kg" color={lift.color} height={250} />
              </Card>
            )}

            {/* volumen semanal */}
            {weeklyVolume.length > 0 && (
              <Card title="Volumen semanal" action={<span style={{ fontFamily: G.mono, fontSize: 11, color: G.muted }}>kg movidos / semana</span>}>
                <VolumeBars data={weeklyVolume} labels={weekLabels} color={ACCENT_HEX} height={210} />
              </Card>
            )}
          </div>

          {/* COLUMNA DERECHA */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* récords */}
            {records.length > 0 && (
              <Card title="Récords personales" action={<span style={{ fontFamily: G.mono, fontSize: 11, color: G.accent }}>1RM est.</span>}>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {records.map((l, i) => {
                    const w = l.history[l.history.length - 1];
                    const orm = epley1RM(w, l.reps);
                    return (
                      <div key={l.id} className="wk-row" style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 8px", borderBottom: i < records.length - 1 ? `1px solid ${G.line2}` : "none", borderRadius: 8 }}>
                        <span style={{ width: 9, height: 9, borderRadius: 3, background: l.color, flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: G.sans, fontSize: 13.5, fontWeight: 600, color: G.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l.name}</div>
                          <div style={{ fontFamily: G.mono, fontSize: 10.5, color: G.faint }}>top {w} kg × {l.reps}</div>
                        </div>
                        <div style={{ fontFamily: G.mono, fontSize: 18, fontWeight: 700, color: G.text }}>{orm}<span style={{ fontSize: 11, color: G.faint }}>kg</span></div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* reparto muscular */}
            {muscleSplit.length > 0 && (
              <Card title="Reparto muscular" action={<span style={{ fontFamily: G.mono, fontSize: 11, color: G.muted }}>4 sem</span>}>
                <HBars items={muscleSplit} />
              </Card>
            )}
          </div>
        </div>

        {/* logros */}
        {ACH.length > 0 && (
          <div style={{ marginTop: 22 }}>
            <Card title="Logros" action={<span style={{ fontFamily: G.mono, fontSize: 11, color: G.muted }}>{ACH.filter((a) => a.done).length}/{ACH.length} desbloqueados</span>}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                {ACH.map((a, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 13, padding: "13px 14px", borderRadius: 12,
                    background: a.done ? G.panel2 : "transparent", border: `1px solid ${a.done ? G.line : G.line2}`, opacity: a.done ? 1 : 0.55 }}>
                    <span style={{ width: 42, height: 42, flexShrink: 0, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center",
                      background: a.done ? pa(ACCENT_HEX, 0.13) : G.panel2, border: `1px solid ${a.done ? pa(ACCENT_HEX, 0.3) : G.line2}` }}>
                      <AchIcon name={a.icon} color={a.done ? G.accent : G.muted} />
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: G.sans, fontSize: 13.5, fontWeight: 700, color: a.done ? G.text : G.muted, lineHeight: 1.2 }}>{a.name}</div>
                      <div style={{ fontFamily: G.mono, fontSize: 10.5, color: a.done ? G.accent : G.faint, marginTop: 4 }}>{a.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
