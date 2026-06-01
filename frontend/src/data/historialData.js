// ============================================================
//  historialData.js — Datos de demostración para el Historial
//  y funciones helpers compartidas.
//  Las sesiones reales del usuario se guardan en localStorage
//  "ironlife_history_v1" al finalizar un entrenamiento.
// ============================================================

export const MESES_CORTOS = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
export const MESES_FULL   = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
export const DIAS_SEMANA  = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];

// Colores por tipo de rutina (coinciden con el calendario y la sección Progreso)
export const COLORES_RUTINA = {
  push:   "#ff5722",
  pull:   "#3b82f6",
  legs:   "#a855f7",
  full:   "#3ecf8e",
  cardio: "#facc15",
};

// ── Helpers ───────────────────────────────────────────────────
export function diaSemana(s) {
  return DIAS_SEMANA[(new Date(s.y, s.m, s.d).getDay() + 6) % 7];
}
export function volumenSesion(s) {
  if (s.type !== "fuerza") return 0;
  return s.exercises.reduce((a, e) => a + e.sets.reduce((b, st) => b + st[0] * st[1], 0), 0);
}
export function seriesSesion(s) {
  if (s.type !== "fuerza") return 0;
  return s.exercises.reduce((a, e) => a + e.sets.length, 0);
}
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

// ── Datos de demostración (Mayo 2026) ─────────────────────────
// Formato fuerza: { id, y, m, d, type:'fuerza', routineId, name, mins, exercises, prNote }
// Formato cardio: { id, y, m, d, type:'cardio', name, sec, km, note }
// exercises: [{ name, group, color, sets:[[kg,reps],...], pr }]
// m es 0-indexado (4 = Mayo, 5 = Junio)

let _id = 0;
function S(y, m, d, rid, mins, exs, prNote) {
  const nombres = { push:"Empuje · Push", pull:"Tirón · Pull", legs:"Pierna · Legs", full:"Full Body" };
  return { id:"d"+(++_id), y, m, d, type:"fuerza", routineId:rid, name: nombres[rid], mins, exercises:exs, prNote:prNote||null };
}
function C(y, m, d, sec, km, note) {
  return { id:"d"+(++_id), y, m, d, type:"cardio", name:"Cardio · Carrera", sec, km, note:note||null };
}
function ex(name, group, rid, sets, pr) {
  return { name, group, color: COLORES_RUTINA[rid] || "#888", sets, pr:!!pr };
}

const Y = 2026;
export const SESIONES_DEMO = [
  C(Y, 4, 31, 40*60, 6.8, "Tirada larga, ritmo cómodo"),
  S(Y, 4, 30, "push", 58, [
    ex("Press banca plano con barra",      "Pecho",   "push", [[82.5,8],[82.5,8],[82.5,6]], true),
    ex("Press inclinado mancuernas",       "Pecho",   "push", [[30,11],[30,10],[30,8]]),
    ex("Press militar con barra",          "Hombros", "push", [[45,8],[45,7],[42.5,8]]),
    ex("Elevaciones laterales con mancuernas","Hombros","push",[[12,15],[12,13],[10,15]]),
    ex("Extensión tríceps en polea alta",  "Tríceps", "push", [[32.5,12],[32.5,11],[30,12]]),
  ], "PR en press banca: 82.5 kg × 8"),
  S(Y, 4, 29, "pull", 54, [
    ex("Jalón al pecho agarre ancho",      "Espalda", "pull", [[65,10],[65,9],[60,11]]),
    ex("Remo con barra",                   "Espalda", "pull", [[72.5,8],[72.5,8],[70,8]]),
    ex("Remo con mancuerna",               "Espalda", "pull", [[34,10],[34,10],[32,11]]),
    ex("Curl con barra",                   "Bíceps",  "pull", [[16,12],[16,11],[14,12]]),
  ]),
  C(Y, 4, 28, 32*60, 5.5, "Rodaje suave de recuperación"),
  S(Y, 4, 27, "legs", 64, [
    ex("Sentadilla libre con barra",       "Cuádriceps","legs",[[107.5,6],[107.5,5],[100,8]], true),
    ex("Prensa de piernas",                "Cuádriceps","legs",[[200,12],[200,11],[185,12]]),
    ex("Curl femoral acostado",            "Isquios", "legs", [[50,12],[50,11],[45,12]]),
    ex("Hip thrust con barra",             "Glúteos", "legs", [[120,10],[120,10],[110,12]]),
    ex("Elevación de gemelos de pie",      "Gemelos", "legs", [[95,15],[95,14],[90,15]]),
  ], "PR en sentadilla: 107.5 kg × 6"),
  S(Y, 4, 26, "pull", 51, [
    ex("Dominadas",                        "Espalda", "pull", [[12.5,6],[10,6],[7.5,7]]),
    ex("Remo con barra",                   "Espalda", "pull", [[70,8],[70,8],[67.5,9]]),
    ex("Jalón al pecho agarre ancho",      "Espalda", "pull", [[62.5,10],[62.5,10],[60,11]]),
    ex("Curl con barra",                   "Bíceps",  "pull", [[15,12],[15,12],[14,12]]),
  ]),
  S(Y, 4, 25, "push", 56, [
    ex("Press banca plano con barra",      "Pecho",   "push", [[80,8],[80,8],[77.5,8]]),
    ex("Press inclinado mancuernas",       "Pecho",   "push", [[28,11],[28,10],[28,9]]),
    ex("Press militar con barra",          "Hombros", "push", [[42.5,9],[42.5,8],[40,9]]),
    ex("Extensión tríceps en polea alta",  "Tríceps", "push", [[30,12],[30,12],[27.5,13]]),
  ]),
  S(Y, 4, 23, "legs", 60, [
    ex("Sentadilla libre con barra",       "Cuádriceps","legs",[[105,6],[105,6],[97.5,8]]),
    ex("Prensa de piernas",                "Cuádriceps","legs",[[185,12],[185,12],[175,12]]),
    ex("Curl femoral acostado",            "Isquios", "legs", [[47.5,12],[47.5,11],[45,12]]),
    ex("Hip thrust con barra",             "Glúteos", "legs", [[110,12],[110,11],[105,12]]),
  ]),
  C(Y, 4, 22, 35*60, 6.0, "Series de ritmo medio"),
  S(Y, 4, 20, "pull", 49, [
    ex("Jalón al pecho agarre ancho",      "Espalda", "pull", [[62.5,10],[62.5,10],[60,10]]),
    ex("Remo con barra",                   "Espalda", "pull", [[67.5,8],[67.5,8],[65,9]]),
    ex("Curl con barra",                   "Bíceps",  "pull", [[14,12],[14,12],[12,13]]),
  ]),
  S(Y, 4, 19, "push", 55, [
    ex("Press banca plano con barra",      "Pecho",   "push", [[77.5,8],[77.5,8],[75,8]]),
    ex("Press militar con barra",          "Hombros", "push", [[42.5,8],[42.5,8],[40,8]]),
    ex("Elevaciones laterales con mancuernas","Hombros","push",[[10,15],[10,14],[10,13]]),
    ex("Extensión tríceps en polea alta",  "Tríceps", "push", [[30,12],[27.5,12],[27.5,12]]),
  ]),
  S(Y, 4, 18, "legs", 58, [
    ex("Sentadilla libre con barra",       "Cuádriceps","legs",[[100,8],[100,7],[95,8]]),
    ex("Curl femoral acostado",            "Isquios", "legs", [[45,12],[45,12],[42.5,12]]),
    ex("Hip thrust con barra",             "Glúteos", "legs", [[105,12],[105,12],[100,12]]),
    ex("Elevación de gemelos de pie",      "Gemelos", "legs", [[90,15],[90,15],[85,15]]),
  ]),
  C(Y, 4, 15, 42*60, 7.1, "Tirada larga, mejor ritmo del mes"),
  S(Y, 4, 13, "push", 53, [
    ex("Press banca plano con barra",      "Pecho",   "push", [[75,8],[75,8],[72.5,9]]),
    ex("Press inclinado mancuernas",       "Pecho",   "push", [[26,11],[26,10],[26,10]]),
    ex("Press militar con barra",          "Hombros", "push", [[40,8],[40,8],[40,7]]),
  ]),
];
