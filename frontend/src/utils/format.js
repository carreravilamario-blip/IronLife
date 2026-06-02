export function fmtDur(min) {
  const h = Math.floor(min / 60), m = min % 60;
  return h > 0 ? `${h}h ${m > 0 ? m + "m" : ""}`.trim() : `${m} min`;
}

export function fmtReloj(sec) {
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function fmtRitmo(sec, km) {
  if (!km) return "—";
  const p = sec / km;
  return `${Math.floor(p / 60)}:${String(Math.round(p % 60)).padStart(2, "0")} /km`;
}

export function fmtVol(v) {
  return v >= 1000 ? `${(v / 1000).toFixed(1)}t` : `${v} kg`;
}

export function epley1RM(kg, reps) {
  return Math.round(kg * (1 + reps / 30));
}
