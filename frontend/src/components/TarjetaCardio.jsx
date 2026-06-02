// ============================================================
//  TarjetaCardio.jsx — Cronómetro + registro de km para el día
//  seleccionado. Calcula el ritmo (min/km) en vivo.
// ============================================================

import { useState, useEffect, useRef } from "react";
import { WK as K, hexA } from "../ui/theme";
import { CARDIO_META as KCM } from "../constants/routines";

export function fmtTime(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const mm = String(m).padStart(2, "0"), ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export default function TarjetaCardio({ dayLabel, existing, onSave, onClear }) {
  const [sec, setSec] = useState(0);
  const [running, setRunning] = useState(false);
  const [km, setKm] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    if (running) {
      ref.current = setInterval(() => setSec((s) => s + 1), 1000);
      return () => clearInterval(ref.current);
    }
  }, [running]);

  // Reinicia el borrador al cambiar de día.
  useEffect(() => {
    setSec(0);
    setRunning(false);
    setKm("");
  }, [dayLabel]);

  const pace = (() => {
    const k = parseFloat(km);
    if (!k || k <= 0 || sec <= 0) return null;
    const secPerKm = sec / k;
    const m = Math.floor(secPerKm / 60), s = Math.round(secPerKm % 60);
    return `${m}:${String(s).padStart(2, "0")} /km`;
  })();

  const canSave = sec > 0 || parseFloat(km) > 0;

  return (
    <div style={{ background: K.card, border: `1px solid ${K.line}`, borderRadius: 16, padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <span style={{ width: 30, height: 30, borderRadius: 9, background: hexA(KCM.color, 0.16), border: `1px solid ${hexA(KCM.color, 0.4)}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill={KCM.color}><path d="M13.5 5.5a2 2 0 1 0-2-2 2 2 0 0 0 2 2zM6 21l2.5-6 3 2.5V21h2v-6l-2.6-2 .7-3.5A6.9 6.9 0 0 0 17 12v-2a5 5 0 0 1-4.2-2.3l-1-1.6a2 2 0 0 0-1.3-.9 2 2 0 0 0-1.6.4L5 8.3V12h2V9.3l1.8-1.1L7 21z" /></svg>
        </span>
        <h3 style={{ margin: 0, fontFamily: K.sans, fontWeight: 800, fontSize: 18 }}>Cardio</h3>
      </div>
      <p style={{ margin: "0 0 16px 40px", fontFamily: K.mono, fontSize: 11, color: K.muted, letterSpacing: "0.04em" }}>{dayLabel}</p>

      {existing && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 16, padding: "11px 14px", borderRadius: 10, background: hexA(KCM.color, 0.1), border: `1px solid ${hexA(KCM.color, 0.3)}` }}>
          <span style={{ fontFamily: K.mono, fontSize: 12.5, color: K.text2 }}>
            Registrado: <b style={{ color: K.text }}>{fmtTime(existing.sec)}</b> · <b style={{ color: K.text }}>{existing.km} km</b>
          </span>
          <button className="wk-icon-btn" onClick={onClear} title="Borrar cardio del día" style={{ background: "transparent", border: "none", color: K.muted, cursor: "pointer", fontFamily: K.mono, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>Borrar</button>
        </div>
      )}

      {/* cronómetro */}
      <div style={{ background: K.panel, border: `1px solid ${K.line2}`, borderRadius: 12, padding: "20px 16px", textAlign: "center", marginBottom: 14 }}>
        <div style={{ fontFamily: K.mono, fontSize: 48, fontWeight: 700, letterSpacing: "0.02em", color: running ? K.accent : K.text, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{fmtTime(sec)}</div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 16 }}>
          <button
            onClick={() => setRunning((r) => !r)}
            style={{
              height: 44, padding: "0 26px", borderRadius: 10, border: "none", cursor: "pointer",
              fontFamily: K.sans, fontWeight: 800, fontSize: 14, letterSpacing: "0.02em", textTransform: "uppercase",
              background: running ? K.field : K.accent, color: running ? K.text : "#0d0d0f",
              boxShadow: running ? "none" : "0 6px 18px rgba(255,87,34,0.26)",
            }}
          >
            {running ? "Pausar" : sec > 0 ? "Reanudar" : "Iniciar"}
          </button>
          <button
            onClick={() => { setRunning(false); setSec(0); }}
            disabled={sec === 0}
            className="wk-icon-btn"
            style={{ width: 44, height: 44, borderRadius: 10, background: K.field, border: `1px solid ${K.line}`, color: K.muted, cursor: sec === 0 ? "not-allowed" : "pointer", opacity: sec === 0 ? 0.4 : 1, display: "flex", alignItems: "center", justifyContent: "center" }}
            title="Reiniciar"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10" /><path d="M3.5 15a9 9 0 1 0 .9-8.7L1 10" /></svg>
          </button>
        </div>
      </div>

      {/* km + ritmo */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <label style={{ flex: 1 }}>
          <span style={{ display: "block", fontFamily: K.mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: K.faint, marginBottom: 6 }}>Distancia</span>
          <div style={{ position: "relative" }}>
            <input className="wk-num" inputMode="decimal" value={km} onChange={(e) => setKm(e.target.value.replace(",", "."))} placeholder="0.0"
              style={{ width: "100%", height: 46, padding: "0 44px 0 14px", background: K.field, border: `1px solid ${K.line}`, borderRadius: 10, color: K.text, fontFamily: K.mono, fontSize: 18, fontWeight: 600, outline: "none" }} />
            <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontFamily: K.mono, fontSize: 12, color: K.faint }}>km</span>
          </div>
        </label>
        <div style={{ flex: 1 }}>
          <span style={{ display: "block", fontFamily: K.mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: K.faint, marginBottom: 6 }}>Ritmo</span>
          <div style={{ height: 46, display: "flex", alignItems: "center", padding: "0 14px", background: K.panel2, border: `1px solid ${K.line2}`, borderRadius: 10, fontFamily: K.mono, fontSize: 16, fontWeight: 600, color: pace ? K.text : K.faint }}>{pace || "—"}</div>
        </div>
      </div>

      <button
        onClick={() => onSave({ sec, km: parseFloat(km) || 0 })}
        disabled={!canSave}
        style={{
          width: "100%", height: 50, borderRadius: 10, border: "none", cursor: canSave ? "pointer" : "not-allowed",
          fontFamily: K.sans, fontWeight: 800, fontSize: 15, letterSpacing: "0.02em", textTransform: "uppercase",
          background: canSave ? KCM.color : K.field, color: canSave ? "#0d0d0f" : K.faint, opacity: canSave ? 1 : 0.6,
        }}
      >
        Guardar cardio del día
      </button>
    </div>
  );
}
