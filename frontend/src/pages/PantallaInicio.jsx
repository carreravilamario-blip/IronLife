// ============================================================
//  PantallaInicio — "Tu actividad": stats del mes + calendario
//  con asignación de rutina por día + registro de cardio.
//
//  Implementa el mockup "IronLife Inicio". Los datos del
//  calendario son de DEMO y se guardan en localStorage; aún no
//  están conectados al backend. El sidebar lo aporta el Layout.
// ============================================================

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context";
import { WK as H, hexA } from "../ui/theme";
import Calendario from "../components/Calendario";
import TarjetaCardio from "../components/TarjetaCardio";
import {
  ROUTINE_META as HRM, MONTHS_ES as HMES, WEEKDAYS_FULL as WDF,
  keyFromDate as kfd, parseKey as pk, addDays as addD, mondayIndex as hmIdx,
} from "../data/inicioData";

const STORE = "ironlife_calendar_v3";
const TODAY = new Date(2026, 5, 1); // 1 de junio de 2026 (fecha de referencia del demo)
const TODAY_KEY = kfd(TODAY);

// Día registrado más reciente, para abrir en un mes con datos.
function latestKey(log) {
  const keys = Object.keys(log);
  if (!keys.length) return TODAY_KEY;
  return keys.sort().reverse()[0];
}

function StatCard({ label, value, unit, accent }) {
  return (
    <div style={{ flex: 1, background: H.card, border: `1px solid ${H.line}`, borderRadius: 14, padding: "16px 18px" }}>
      <div style={{ fontFamily: H.mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: H.faint, marginBottom: 8 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
        <span style={{ fontFamily: H.anton, fontSize: 32, lineHeight: 1, color: accent ? H.accent : H.text, fontWeight: 700 }}>{value}</span>
        {unit && <span style={{ fontFamily: H.mono, fontSize: 12, color: H.muted }}>{unit}</span>}
      </div>
    </div>
  );
}

function dayFullLabel(k) {
  const dt = pk(k);
  return `${WDF[hmIdx(dt.getDay())]}, ${dt.getDate()} de ${HMES[dt.getMonth()].toLowerCase()}`;
}

export default function PantallaInicio() {
  const { usuario } = useAuth();
  const nombre = usuario?.nombre?.split(" ")[0] || "atleta";

  const [log, setLog] = useState(() => {
    try {
      const s = localStorage.getItem(STORE);
      if (s) return JSON.parse(s);
    } catch (e) {}
    return {};
  });
  const initialFocus = useMemo(() => pk(latestKey(log)), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [view, setView] = useState({ y: initialFocus.getFullYear(), m: initialFocus.getMonth() });
  const [selectedKey, setSelectedKey] = useState(kfd(initialFocus));

  useEffect(() => {
    try { localStorage.setItem(STORE, JSON.stringify(log)); } catch (e) { /* noop */ }
  }, [log]);

  const entry = log[selectedKey] || null;
  const setEntry = (patch) =>
    setLog((L) => {
      const cur = L[selectedKey] || { routineId: null, cardio: null };
      const next = { ...cur, ...patch };
      if (!next.routineId && !next.cardio) {
        const c = { ...L };
        delete c[selectedKey];
        return c;
      }
      return { ...L, [selectedKey]: next };
    });

  const assignRoutine = (id) => setEntry({ routineId: entry && entry.routineId === id ? null : id });
  const saveCardio = (c) => setEntry({ cardio: c.sec > 0 || c.km > 0 ? c : null });
  const clearCardio = () => setEntry({ cardio: null });

  // ---- estadísticas del mes ----
  const monthKeys = Object.keys(log).filter((k) => {
    const d = pk(k);
    return d.getFullYear() === view.y && d.getMonth() === view.m;
  });
  const sessions = monthKeys.filter((k) => log[k].routineId).length;
  const cardioKeys = monthKeys.filter((k) => log[k].cardio);
  const cardioKm = cardioKeys.reduce((a, k) => a + (log[k].cardio.km || 0), 0);
  const cardioMin = Math.round(cardioKeys.reduce((a, k) => a + (log[k].cardio.sec || 0), 0) / 60);

  // racha actual: días activos consecutivos terminando hoy (o ayer)
  const streak = (() => {
    const active = (k) => log[k] && (log[k].routineId || log[k].cardio);
    let start = TODAY;
    if (!active(kfd(start))) start = addD(start, -1);
    let n = 0, cur = start;
    while (active(kfd(cur))) {
      n++;
      cur = addD(cur, -1);
    }
    return n;
  })();

  const routineList = Object.values(HRM);

  const goPrev = () => setView((v) => (v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 }));
  const goNext = () => setView((v) => (v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 }));

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%", background: H.bg, color: H.text, fontFamily: H.sans }}>
      <header style={{ padding: "24px 32px 22px", borderBottom: `1px solid ${H.line}` }}>
        <div style={{ fontFamily: H.mono, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: H.accent, marginBottom: 8 }}>Hola, {nombre} 👋</div>
        <h1 style={{ margin: 0, fontFamily: H.anton, fontSize: 40, textTransform: "uppercase", letterSpacing: "0.005em", fontWeight: 700 }}>Tu actividad</h1>
      </header>

      <div style={{ flex: 1, padding: "24px 32px 40px" }}>
        {/* fila de stats */}
        <div style={{ display: "flex", gap: 14, marginBottom: 22, flexWrap: "wrap" }}>
          <StatCard label={`Sesiones · ${HMES[view.m]}`} value={sessions} accent />
          <StatCard label="Racha actual" value={streak} unit="días" />
          <StatCard label="Cardio (km)" value={cardioKm % 1 === 0 ? cardioKm : cardioKm.toFixed(1)} unit="km" />
          <StatCard label="Cardio (min)" value={cardioMin} unit="min" />
        </div>

        {/* calendario + panel lateral */}
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.55fr) minmax(340px,1fr)", gap: 22, alignItems: "start" }}>
          <Calendario
            year={view.y} month={view.m} log={log} selectedKey={selectedKey} todayKey={TODAY_KEY}
            onSelect={setSelectedKey} onPrev={goPrev} onNext={goNext}
          />

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* asignación de rutina al día */}
            <div style={{ background: H.card, border: `1px solid ${H.line}`, borderRadius: 16, padding: 20 }}>
              <div style={{ fontFamily: H.mono, fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase", color: H.faint, marginBottom: 4 }}>Día seleccionado</div>
              <h3 style={{ margin: "0 0 16px", fontFamily: H.sans, fontWeight: 800, fontSize: 19, textTransform: "capitalize" }}>
                {dayFullLabel(selectedKey)}
                {selectedKey === TODAY_KEY && (
                  <span style={{ marginLeft: 8, fontFamily: H.mono, fontSize: 11, color: H.accent, textTransform: "uppercase", letterSpacing: "0.08em" }}>· Hoy</span>
                )}
              </h3>
              <div style={{ fontFamily: H.mono, fontSize: 10.5, letterSpacing: "0.1em", textTransform: "uppercase", color: H.muted, marginBottom: 10 }}>¿Qué rutina hiciste?</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
                {routineList.map((r) => {
                  const on = entry && entry.routineId === r.id;
                  return (
                    <button
                      key={r.id}
                      onClick={() => assignRoutine(r.id)}
                      className="wk-row"
                      style={{
                        display: "flex", alignItems: "center", gap: 9, padding: "11px 12px", borderRadius: 10, cursor: "pointer", textAlign: "left",
                        background: on ? hexA(r.color, 0.16) : H.panel2, border: `1px solid ${on ? hexA(r.color, 0.5) : H.line2}`,
                      }}
                    >
                      <span style={{ width: 11, height: 11, borderRadius: 4, background: r.color, flexShrink: 0 }} />
                      <span style={{ fontFamily: H.sans, fontWeight: on ? 700 : 500, fontSize: 13.5, color: on ? H.text : H.text2 }}>{r.short}</span>
                      {on && <svg style={{ marginLeft: "auto" }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={r.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                    </button>
                  );
                })}
                <button
                  onClick={() => setEntry({ routineId: null })}
                  className="wk-row"
                  style={{
                    gridColumn: "1 / -1", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "9px 12px", borderRadius: 10, cursor: "pointer",
                    background: H.panel2, border: `1px dashed ${H.line}`, color: H.muted, fontFamily: H.sans, fontSize: 12.5, fontWeight: 600,
                  }}
                >
                  Quitar rutina (descanso)
                </button>
              </div>
            </div>

            {/* cardio */}
            <TarjetaCardio dayLabel={dayFullLabel(selectedKey)} existing={entry && entry.cardio} onSave={saveCardio} onClear={clearCardio} />
          </div>
        </div>
      </div>
    </div>
  );
}
