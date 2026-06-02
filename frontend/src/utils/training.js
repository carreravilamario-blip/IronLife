export function volumenSesion(s) {
  if (s.type !== "fuerza") return 0;
  return s.exercises.reduce((a, e) => a + e.sets.reduce((b, st) => b + st[0] * st[1], 0), 0);
}

export function seriesSesion(s) {
  if (s.type !== "fuerza") return 0;
  return s.exercises.reduce((a, e) => a + e.sets.length, 0);
}
