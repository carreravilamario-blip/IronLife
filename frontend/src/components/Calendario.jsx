// ============================================================
//  Calendario.jsx — Cuadrícula mensual con marcas de rutina /
//  cardio por día. Permite navegar entre meses y seleccionar día.
// ============================================================

import { WK as C, hexA, ACCENT_HEX } from "../ui/theme";
import {
  ROUTINE_META as RM, CARDIO_META as CM, MONTHS_ES as MES,
  WEEKDAYS_ES as WD, dateKey as dkey, mondayIndex as mIdx,
} from "../data/inicioData";

const IcoCorrer = ({ color }) => (
  <svg width="8" height="8" viewBox="0 0 24 24" fill={color}>
    <path d="M13.5 5.5a2 2 0 1 0-2-2 2 2 0 0 0 2 2zM6 21l2.5-6 3 2.5V21h2v-6l-2.6-2 .7-3.5A6.9 6.9 0 0 0 17 12v-2a5 5 0 0 1-4.2-2.3l-1-1.6a2 2 0 0 0-1.3-.9 2 2 0 0 0-1.6.4L5 8.3V12h2V9.3l1.8-1.1L7 21z" />
  </svg>
);

function navBtn() {
  return {
    width: 36, height: 36, borderRadius: 9, background: C.field,
    border: `1px solid ${C.line}`, color: C.text2, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
  };
}

export default function Calendario({
  year, month, log, selectedKey, todayKey, onSelect, onPrev, onNext,
}) {
  const first = new Date(year, month, 1);
  const startPad = mIdx(first.getDay());
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: 20 }}>
      {/* navegación de mes */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <h2 style={{ margin: 0, fontFamily: C.anton, fontSize: 27, textTransform: "uppercase", letterSpacing: "0.005em", fontWeight: 700 }}>
          {MES[month]} <span style={{ color: C.faint }}>{year}</span>
        </h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="wk-icon-btn" onClick={onPrev} style={navBtn()}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <button className="wk-icon-btn" onClick={onNext} style={navBtn()}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>
      </div>

      {/* cabecera de días de la semana */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 8, marginBottom: 8 }}>
        {WD.map((w) => (
          <div key={w} style={{ textAlign: "center", fontFamily: C.mono, fontSize: 10.5, letterSpacing: "0.1em", textTransform: "uppercase", color: C.faint, paddingBottom: 2 }}>{w}</div>
        ))}
      </div>

      {/* cuadrícula */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 8 }}>
        {cells.map((d, i) => {
          if (d == null) return <div key={i} />;
          const k = dkey(year, month, d);
          const entry = log[k];
          const routine = entry && entry.routineId ? RM[entry.routineId] : null;
          const cardio = entry && entry.cardio ? entry.cardio : null;
          const isSel = k === selectedKey;
          const isToday = k === todayKey;
          const rest = entry && !routine && !cardio;

          return (
            <button
              key={i}
              onClick={() => onSelect(k)}
              style={{
                position: "relative", aspectRatio: "1 / 1", display: "flex", flexDirection: "column",
                alignItems: "flex-start", justifyContent: "flex-start", padding: "7px 8px", cursor: "pointer",
                borderRadius: 11,
                background: routine ? hexA(routine.color, 0.16) : cardio ? hexA(CM.color, 0.1) : C.panel2,
                border: isSel ? `2px solid ${C.accent}` : `1px solid ${routine ? hexA(routine.color, 0.4) : C.line2}`,
                boxShadow: isSel ? `0 0 0 3px ${hexA(ACCENT_HEX, 0.18)}` : "none",
                transition: "background .12s, border-color .12s",
              }}
            >
              <span style={{ fontFamily: C.mono, fontSize: 13, fontWeight: isToday ? 800 : 500, color: isToday ? C.accent : routine ? C.text : C.text2 }}>{d}</span>
              {isToday && <span style={{ position: "absolute", top: 8, right: 8, width: 5, height: 5, borderRadius: 5, background: C.accent }} />}

              {/* etiqueta de rutina */}
              {routine && (
                <span style={{ marginTop: "auto", fontFamily: C.mono, fontSize: 9.5, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: routine.color, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>{routine.short}</span>
              )}
              {rest && <span style={{ marginTop: "auto", fontFamily: C.mono, fontSize: 9, color: C.faint, textTransform: "uppercase", letterSpacing: "0.06em" }}>Descanso</span>}

              {/* pip de cardio */}
              {cardio && (
                <span style={{ position: "absolute", bottom: 6, right: 6, display: "inline-flex", alignItems: "center", gap: 2, fontFamily: C.mono, fontSize: 8.5, fontWeight: 700, color: "#0d0d0f", background: CM.color, padding: "1px 4px", borderRadius: 4 }}>
                  <IcoCorrer color="#0d0d0f" />
                  {cardio.km}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* leyenda */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 18, paddingTop: 16, borderTop: `1px solid ${C.line2}` }}>
        {Object.values(RM).map((r) => (
          <span key={r.id} style={{ display: "inline-flex", alignItems: "center", gap: 7, fontFamily: C.mono, fontSize: 10.5, letterSpacing: "0.04em", textTransform: "uppercase", color: C.muted }}>
            <span style={{ width: 9, height: 9, borderRadius: 3, background: r.color }} />{r.short}
          </span>
        ))}
        <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontFamily: C.mono, fontSize: 10.5, letterSpacing: "0.04em", textTransform: "uppercase", color: C.muted }}>
          <span style={{ width: 9, height: 9, borderRadius: 3, background: CM.color }} />Cardio
        </span>
      </div>
    </div>
  );
}
