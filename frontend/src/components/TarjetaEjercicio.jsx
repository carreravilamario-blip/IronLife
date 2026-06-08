// ============================================================
//  TarjetaEjercicio - Tarjeta de ejercicio con tabla de series,
//  sparkline de progreso, detección de PR y gráfico expandible.
// ============================================================

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { colorDeGrupo, hexAlfa } from "../ui/grupoColores";

// ── Sparkline: mini gráfico de tendencia ──────────────────────
function Sparkline({ data = [], width = 80, height = 28 }) {
  const color = "var(--accent)";
  if (!data || data.length < 2) {
    return (
      <div style={{ width, height, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--mono)", fontSize: 9, color: "var(--faint)" }}>
        —
      </div>
    );
  }
  const min = Math.min(...data), max = Math.max(...data);
  const span = max - min || 1;
  const pad = 3;
  const stepX = (width - pad * 2) / (data.length - 1);
  const pts = data.map((v, i) => {
    const x = pad + i * stepX;
    const y = pad + (height - pad * 2) * (1 - (v - min) / span);
    return [x, y];
  });
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1];
  return (
    <svg width={width} height={height} className="sparkline-wrap">
      <path d={d} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="2.6" fill={color} />
    </svg>
  );
}

// ── ProgressChart: panel de sesión anterior con barras ────────
// Muestra cada serie de la sesión anterior con kg Y reps visibles.
// Si hay series de la sesión actual (completadas), las compara en azul.
function ProgressChart({ seriesAnt = [], seriesHoy = [] }) {
  const { t } = useTranslation();
  const vacio = seriesAnt.length === 0;

  if (vacio) {
    return (
      <div className="prog-vacio">
        {t("exercise_card.no_prev_sessions")}<br />
        {t("exercise_card.complete_note")}
      </div>
    );
  }

  // Máximo de kg entre sesión anterior y actual para escalar las barras.
  const todosKg = [
    ...seriesAnt.map((s) => num(s.kg)),
    ...seriesHoy.map((s) => num(s.kg)),
  ].filter(Boolean);
  const maxKg = Math.max(...todosKg, 1);

  // Construimos las columnas: una por serie (el máximo entre las dos sesiones).
  const nCols = Math.max(seriesAnt.length, seriesHoy.length);

  return (
    <div className="prog-panel">
      {/* Leyenda */}
      <div className="prog-leyenda">
        <span className="prog-ley-ant">{t("exercise_card.legend_prev")}</span>
        {seriesHoy.length > 0 && (
          <span className="prog-ley-hoy">{t("exercise_card.legend_today")}</span>
        )}
      </div>

      {/* Barras */}
      <div className="prog-barras" style={{ gridTemplateColumns: `repeat(${nCols}, 1fr)` }}>
        {Array.from({ length: nCols }, (_, i) => {
          const ant = seriesAnt[i];
          const hoy = seriesHoy[i];
          const pctAnt = ant ? (num(ant.kg) / maxKg) * 100 : 0;
          const pctHoy = hoy ? (num(hoy.kg) / maxKg) * 100 : 0;
          const mejora = hoy && ant && num(hoy.kg) > num(ant.kg);

          return (
            <div key={i} className="prog-col">
              {/* Valores numéricos encima */}
              <div className="prog-col-vals">
                {ant && (
                  <span className="prog-val-ant">{num(ant.kg)} kg</span>
                )}
                {hoy && (
                  <span className={`prog-val-hoy ${mejora ? "mejora" : ""}`}>
                    {mejora && "▲ "}{num(hoy.kg)} kg
                  </span>
                )}
              </div>

              {/* Barras apiladas lado a lado */}
              <div className="prog-barras-fila">
                {ant && (
                  <div
                    className="prog-barra prog-barra-ant"
                    style={{ height: `${pctAnt}%` }}
                    title={`Anterior: ${ant.kg} kg × ${ant.reps} reps`}
                  />
                )}
                {hoy && (
                  <div
                    className={`prog-barra prog-barra-hoy ${mejora ? "mejora" : ""}`}
                    style={{ height: `${pctHoy}%` }}
                    title={`Hoy: ${hoy.kg} kg × ${hoy.reps} reps`}
                  />
                )}
              </div>

              {/* Repeticiones debajo */}
              <div className="prog-col-reps">
                {ant && <span className="prog-reps-ant">{ant.reps} reps</span>}
                {hoy && <span className="prog-reps-hoy">{hoy.reps} reps</span>}
              </div>

              {/* Número de serie */}
              <div className="prog-col-num">S{i + 1}</div>
            </div>
          );
        })}
      </div>

      {/* Volumen total anterior */}
      <div className="prog-footer">
        <span>
          {t("exercise_card.vol_prev")}{" "}
          <strong>
            {seriesAnt.reduce((a, s) => a + num(s.kg) * num(s.reps), 0)} kg
          </strong>
        </span>
        {seriesHoy.length > 0 && (
          <span>
            {t("exercise_card.vol_today")}{" "}
            <strong>
              {seriesHoy.reduce((a, s) => a + num(s.kg) * num(s.reps), 0)} kg
            </strong>
          </span>
        )}
      </div>
    </div>
  );
}

// ── NumCell: celda de input numérico ─────────────────────────
function NumCell({ value, onChange, suffix }) {
  return (
    <div className="serie-input-wrap">
      <input
        className="wk-num"
        type="number"
        inputMode="decimal"
        value={value === "" || value == null ? "" : value}
        placeholder="—"
        min="0"
        step={suffix === "kg" ? "0.5" : "1"}
        onChange={(e) => onChange(e.target.value)}
      />
      {suffix && <span className="serie-input-suffix">{suffix}</span>}
    </div>
  );
}

// ── Botón icono ───────────────────────────────────────────────
const IcTrend = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 17 9 11 13 15 21 7"/>
    <polyline points="14 7 21 7 21 14"/>
  </svg>
);
const IcClose = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IcMinus = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IcPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IcCheck = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0d0d0f" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

function num(v) {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
}

// ── Componente principal ──────────────────────────────────────
export default function TarjetaEjercicio({
  ejercicio,
  series,           // [{ id, numero, kg, reps, rir, completada }]
  anterior,         // { max_kg, series: [{kg, reps}] }
  onAnadirSerie,
  onActualizarSerie,
  onBorrarSerie,
  onEliminarEjercicio,
}) {
  const { t } = useTranslation();
  const [chartOpen, setChartOpen] = useState(false);

  // Máximo kg anterior para el badge PR y la cabecera
  const prevBest = anterior?.max_kg ?? 0;

  // Series anteriores (para el panel de progreso)
  const seriesAnt = anterior?.series ?? [];

  // Series de hoy completadas (para comparar en el panel)
  const seriesHoy = series
    .filter((s) => s.completada && num(s.kg) > 0)
    .map((s) => ({ kg: num(s.kg), reps: num(s.reps) }));

  // PR: alguna serie de hoy supera el máximo anterior
  const hasPR =
    prevBest > 0 &&
    series.some((s) => s.completada && num(s.kg) > prevBest && num(s.reps) > 0);

  // Sparkline: kg de las series anteriores (para la mini-gráfica del encabezado)
  const historyData = seriesAnt.map((s) => num(s.kg)).filter((v) => v > 0);

  // Volumen de hoy (series completadas)
  const volumen = series
    .filter((s) => s.completada)
    .reduce((acc, s) => acc + num(s.kg) * num(s.reps), 0);

  return (
    <div className="tarjeta-ejercicio">
      {/* ── Cabecera ── */}
      <div className="ejercicio-cabecera">
        <div className="ejercicio-cabecera-izq">
          <div className="ejercicio-nombre-row">
            <h3 className="ejercicio-nombre">{ejercicio.nombre}</h3>
            {hasPR && <span className="badge-pr">★ PR</span>}
          </div>
          <div className="ejercicio-tags">
            <span className="tag-grupo" style={{
              color: colorDeGrupo(ejercicio.grupo_muscular),
              background: hexAlfa(colorDeGrupo(ejercicio.grupo_muscular), 0.12),
              borderColor: hexAlfa(colorDeGrupo(ejercicio.grupo_muscular), 0.3),
            }}>{ejercicio.grupo_muscular}</span>
            <span className="tag-equipo">{ejercicio.equipo}</span>
          </div>
        </div>

        <div className="ejercicio-cabecera-der">
          {/* Max anterior */}
          <div className="ejercicio-max">
            <div className="max-label">{t("exercise_card.prev_max")}</div>
            <div className="max-valor">
              {prevBest > 0 ? `${prevBest} kg` : "—"}
            </div>
          </div>

          {/* Sparkline */}
          <div title="Tendencia de carga">
            <Sparkline data={historyData} width={80} height={28} />
          </div>

          {/* Botón abrir gráfico */}
          <button
            className={`wk-icon-btn${chartOpen ? " active" : ""}`}
            onClick={() => setChartOpen((o) => !o)}
            title={t("exercise_card.view_progress")}
          >
            <IcTrend />
          </button>

          {/* Eliminar ejercicio */}
          <button
            className="wk-icon-btn"
            onClick={onEliminarEjercicio}
            title={t("exercise_card.remove_exercise")}
          >
            <IcClose />
          </button>
        </div>
      </div>

      {/* ── Panel de sesión anterior expandible ── */}
      {chartOpen && (
        <div className="ejercicio-chart">
          <div className="ejercicio-chart-inner">
            <div className="chart-header">
              <span className="chart-titulo">{t("exercise_card.prev_session_title")}</span>
              {hasPR && (
                <span className="chart-diff up">{t("exercise_card.new_pr")}</span>
              )}
            </div>
            <ProgressChart seriesAnt={seriesAnt} seriesHoy={seriesHoy} />
          </div>
        </div>
      )}

      {/* ── Cabecera de la tabla ── */}
      <div className="series-cabecera">
        <div className="series-col-header">{t("exercise_card.header_set")}</div>
        <div className="series-col-header">{t("exercise_card.header_prev")}</div>
        <div className="series-col-header series-col-center">Kg</div>
        <div className="series-col-header series-col-center">Reps</div>
        <div className="series-col-header series-col-center">RIR</div>
        <div className="series-col-header series-col-center">✓</div>
        <div className="series-col-header"></div>
      </div>

      {/* ── Filas de series ── */}
      <div>
        {series.map((serie, idx) => {
          const serieAnterior = anterior?.series?.[idx];
          const isPR =
            serie.completada &&
            prevBest > 0 &&
            num(serie.kg) > prevBest &&
            num(serie.reps) > 0;

          return (
            <div
              key={serie.id ?? `nueva-${idx}`}
              className={`serie-fila${serie.completada ? " completada" : ""}`}
            >
              {/* Número + PR mini */}
              <div className="serie-num-cell">
                <div className={`serie-num-badge${serie.completada ? " done" : ""}`}>
                  {serie.numero}
                </div>
                {isPR && <span className="serie-pr-mini">PR</span>}
              </div>

              {/* Anterior */}
              <div className="serie-anterior">
                {serieAnterior
                  ? `${serieAnterior.kg} × ${serieAnterior.reps}`
                  : "—"}
              </div>

              {/* KG */}
              <NumCell
                value={serie.kg === 0 ? "" : serie.kg}
                onChange={(v) =>
                  onActualizarSerie(serie.id, { kg: parseFloat(v) || 0 })
                }
                suffix="kg"
              />

              {/* Reps */}
              <NumCell
                value={serie.reps === 0 ? "" : serie.reps}
                onChange={(v) =>
                  onActualizarSerie(serie.id, { reps: parseInt(v) || 0 })
                }
              />

              {/* RIR */}
              <NumCell
                value={serie.rir ?? ""}
                onChange={(v) =>
                  onActualizarSerie(serie.id, {
                    rir: v === "" ? null : parseInt(v),
                  })
                }
              />

              {/* Check */}
              <div className="serie-check-cell">
                <button
                  className={`serie-check-btn${serie.completada ? " done" : ""}`}
                  onClick={() =>
                    onActualizarSerie(serie.id, { completada: !serie.completada })
                  }
                  title={t("exercise_card.mark_set")}
                >
                  {serie.completada && <IcCheck />}
                </button>
              </div>

              {/* Eliminar fila */}
              <div className="serie-del-cell">
                <button
                  className="serie-del-btn"
                  onClick={() => onBorrarSerie(serie.id)}
                  title={t("exercise_card.remove_set")}
                  disabled={series.length <= 1}
                >
                  <IcMinus />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Pie ── */}
      <div className="ejercicio-pie">
        <button className="btn-anadir-serie" onClick={onAnadirSerie}>
          <IcPlus />
          {t("exercise_card.add_set")}
        </button>
        <span className="ejercicio-volumen">
          {t("exercise_card.volume_label")}{" "}
          <strong>
            {volumen > 0
              ? `${volumen.toLocaleString("es-ES")} kg`
              : "0 kg"}
          </strong>
        </span>
      </div>
    </div>
  );
}
