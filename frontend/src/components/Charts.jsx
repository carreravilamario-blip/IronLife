// ============================================================
//  charts.jsx — Gráficos SVG ligeros (sin librerías) para el
//  panel de Progreso: LineChart, VolumeBars y HBars.
// ============================================================

import { WK as P } from "../ui/theme";

export function pHexA(hex, a) {
  const n = hex.replace("#", "");
  return `rgba(${parseInt(n.slice(0, 2), 16)},${parseInt(n.slice(2, 4), 16)},${parseInt(n.slice(4, 6), 16)},${a})`;
}

// Gráfico de líneas con área en degradado, etiquetas X espaciadas
// y los puntos inicial/final anotados.
export function LineChart({
  data = [], labels = [], unit = "kg", color = P.accent, height = 240, annotate = true,
}) {
  const W = 720, H = height, padL = 44, padR = 20, padT = 26, padB = 30;
  if (!data || data.length < 2) return <div style={{ height: H }} />;
  const min = Math.min(...data), max = Math.max(...data);
  const span = max - min || 1;
  const lo = min - span * 0.22, hi = max + span * 0.22;
  const rng = hi - lo;
  const stepX = (W - padL - padR) / (data.length - 1);
  const xAt = (i) => padL + i * stepX;
  const yAt = (v) => padT + (H - padT - padB) * (1 - (v - lo) / rng);
  const pts = data.map((v, i) => [xAt(i), yAt(v)]);
  const dLine = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const dArea = `${dLine} L${xAt(data.length - 1).toFixed(1)} ${(H - padB).toFixed(1)} L${padL} ${(H - padB).toFixed(1)} Z`;
  const gid = "lg" + color.replace("#", "");
  const grid = [0.2, 0.5, 0.8].map((t) => lo + rng * t);
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.30" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {grid.map((gv, i) => (
        <g key={i}>
          <line x1={padL} y1={yAt(gv)} x2={W - padR} y2={yAt(gv)} stroke={P.line2} strokeWidth="1" />
          <text x={padL - 9} y={yAt(gv) + 3.5} textAnchor="end" fontFamily={P.mono} fontSize="10" fill={P.faint}>{Math.round(gv)}</text>
        </g>
      ))}
      {labels.map((lb, i) =>
        (i % 2 === 0 || i === labels.length - 1) ? (
          <text key={i} x={xAt(i)} y={H - padB + 17} textAnchor="middle" fontFamily={P.mono} fontSize="9.5" fill={P.faint}>{lb}</text>
        ) : null
      )}
      <path d={dArea} fill={`url(#${gid})`} />
      <path d={dLine} fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => {
        const edge = i === 0 || i === pts.length - 1;
        if (!edge) return <circle key={i} cx={p[0]} cy={p[1]} r="2.4" fill={P.bg} stroke={color} strokeWidth="1.6" />;
        return (
          <g key={i}>
            <circle cx={p[0]} cy={p[1]} r="5" fill={i === 0 ? P.bg : color} stroke={color} strokeWidth="2.4" />
            {annotate && (
              <g>
                <rect x={p[0] - 26} y={i === 0 ? p[1] + 12 : p[1] - 30} width="52" height="20" rx="5" fill={i === 0 ? P.panel2 : color} stroke={i === 0 ? P.line : "none"} />
                <text x={p[0]} y={i === 0 ? p[1] + 25.5 : p[1] - 16.5} textAnchor="middle" fontFamily={P.mono} fontSize="11" fontWeight="700" fill={i === 0 ? P.text2 : "#0d0d0f"}>{data[i]}</text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// Barras verticales de volumen semanal (tonelaje).
export function VolumeBars({ data = [], labels = [], color = P.accent, height = 200, unit = "t" }) {
  const W = 720, H = height, padL = 40, padR = 14, padT = 20, padB = 28;
  const max = Math.max(...data) || 1;
  const n = data.length;
  const gap = 10;
  const bw = (W - padL - padR - gap * (n - 1)) / n;
  const yAt = (v) => padT + (H - padT - padB) * (1 - v / (max * 1.12));
  const grid = [0.25, 0.5, 0.75, 1].map((t) => max * 1.12 * t);
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
      {grid.map((gv, i) => (
        <g key={i}>
          <line x1={padL} y1={yAt(gv)} x2={W - padR} y2={yAt(gv)} stroke={P.line2} strokeWidth="1" />
          <text x={padL - 8} y={yAt(gv) + 3.5} textAnchor="end" fontFamily={P.mono} fontSize="9.5" fill={P.faint}>{(gv / 1000).toFixed(0)}{unit}</text>
        </g>
      ))}
      {data.map((v, i) => {
        const x = padL + i * (bw + gap);
        const y = yAt(v);
        const h = H - padB - y;
        const isMax = v === max;
        return (
          <g key={i}>
            <rect x={x} y={y} width={bw} height={Math.max(0, h)} rx="4" fill={isMax ? color : pHexA(color, 0.42)} />
            <text x={x + bw / 2} y={H - padB + 16} textAnchor="middle" fontFamily={P.mono} fontSize="9" fill={P.faint}>{labels[i]}</text>
          </g>
        );
      })}
    </svg>
  );
}

// Barras horizontales para el reparto muscular.
export function HBars({ items = [] }) {
  const max = Math.max(...items.map((i) => i.sets)) || 1;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
      {items.map((it) => (
        <div key={it.group}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontFamily: P.sans, fontSize: 13, fontWeight: 600, color: P.text2 }}>{it.group}</span>
            <span style={{ fontFamily: P.mono, fontSize: 12, color: P.muted }}>{it.sets} <span style={{ color: P.faint }}>series</span></span>
          </div>
          <div style={{ height: 9, borderRadius: 6, background: P.panel2, overflow: "hidden" }}>
            <div style={{ width: `${(it.sets / max) * 100}%`, height: "100%", borderRadius: 6, background: it.color }} />
          </div>
        </div>
      ))}
    </div>
  );
}
