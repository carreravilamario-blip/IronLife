function pad(n) {
  return String(n).padStart(2, "0");
}

export function dateKey(y, m, d) {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

export function keyFromDate(dt) {
  return dateKey(dt.getFullYear(), dt.getMonth(), dt.getDate());
}

export function parseKey(k) {
  const [y, m, d] = k.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(dt, n) {
  const c = new Date(dt);
  c.setDate(c.getDate() + n);
  return c;
}

export function mondayIndex(jsDay) {
  return (jsDay + 6) % 7;
}

import { WEEKDAYS_FULL } from "../constants/dates";

export function diaSemana(s) {
  return WEEKDAYS_FULL[(new Date(s.y, s.m, s.d).getDay() + 6) % 7];
}
