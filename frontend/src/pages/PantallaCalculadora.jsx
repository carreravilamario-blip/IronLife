// ============================================================
//  PantallaCalculadora — Calculadora de calorías diarias con
//  la fórmula Harris-Benedict + macros sugeridos.
//
//  Todo el estado es local (useState). Sin backend.
//  El sidebar lo aporta el Layout.
// ============================================================

import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { WK as H, ACCENT_HEX, hexA } from "../ui/theme";

// --------------- helpers de cálculo ---------------

function calcBMR(genero, peso, altura, edad) {
  if (genero === "hombre") {
    return 88.362 + 13.397 * peso + 4.799 * altura - 5.677 * edad;
  }
  return 447.593 + 9.247 * peso + 3.098 * altura - 4.33 * edad;
}

const ACTIVITY_FACTORS = [
  { id: "sedentario",  factor: 1.2   },
  { id: "ligero",      factor: 1.375 },
  { id: "moderado",    factor: 1.55  },
  { id: "activo",      factor: 1.725 },
  { id: "muy_activo",  factor: 1.9   },
];

const OBJETIVO_FACTORS = [
  { id: "perder",   factor: 0.80 },
  { id: "mantener", factor: 1.00 },
  { id: "ganar",    factor: 1.15 },
];

// --------------- sub-componentes ---------------

function SectionTitle({ children }) {
  return (
    <div style={{
      fontFamily: H.mono,
      fontSize: 10,
      letterSpacing: "0.14em",
      textTransform: "uppercase",
      color: H.faint,
      marginBottom: 14,
    }}>
      {children}
    </div>
  );
}

function ToggleChip({ label, sub, active, onClick, accentColor }) {
  const bg     = active ? hexA(accentColor || ACCENT_HEX, 0.15) : H.panel2;
  const border = active ? hexA(accentColor || ACCENT_HEX, 0.50) : H.line2;
  return (
    <button
      onClick={onClick}
      className="wk-row"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 2,
        padding: "10px 14px",
        borderRadius: 10,
        cursor: "pointer",
        background: bg,
        border: `1px solid ${border}`,
        textAlign: "left",
        minWidth: 0,
      }}
    >
      <span style={{ fontFamily: H.sans, fontSize: 13.5, fontWeight: active ? 700 : 500, color: active ? H.text : H.text2 }}>
        {label}
      </span>
      {sub && (
        <span style={{ fontFamily: H.mono, fontSize: 10.5, color: active ? H.muted : H.faint, letterSpacing: "0.04em" }}>
          {sub}
        </span>
      )}
    </button>
  );
}

function NumberField({ label, unit, value, onChange, min = 1, max = 999, placeholder }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontFamily: H.mono, fontSize: 10.5, letterSpacing: "0.1em", textTransform: "uppercase", color: H.muted }}>
        {label}
      </label>
      <div style={{ display: "flex", alignItems: "center", background: H.field, border: `1px solid ${H.line}`, borderRadius: 10, overflow: "hidden" }}>
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            padding: "12px 10px 12px 14px",
            fontFamily: H.mono,
            fontSize: 20,
            fontWeight: 700,
            color: H.text,
            width: "100%",
            minWidth: 0,
            WebkitTextFillColor: H.text,
          }}
        />
        {unit && (
          <span style={{
            fontFamily: H.mono,
            fontSize: 11,
            color: H.muted,
            paddingRight: 10,
            letterSpacing: "0.04em",
            flexShrink: 0,
          }}>
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

function MacroBar({ label, grams, kcal, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 10, height: 10, borderRadius: 3, background: color, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontFamily: H.sans, fontSize: 13, fontWeight: 600, color: H.text }}>{label}</span>
          <span style={{ fontFamily: H.mono, fontSize: 12, color: H.muted }}>{grams}g · {kcal} kcal</span>
        </div>
        <div style={{ height: 6, borderRadius: 3, background: H.line, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${Math.min(100, (kcal / (grams * 4 + 1)) * 2)}%`, background: color, transition: "width 0.4s" }} />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, unit, accent }) {
  return (
    <div style={{
      flex: 1,
      minWidth: 130,
      background: H.card,
      border: `1px solid ${H.line}`,
      borderRadius: 14,
      padding: "16px 18px",
    }}>
      <div style={{ fontFamily: H.mono, fontSize: 9.5, letterSpacing: "0.12em", textTransform: "uppercase", color: H.faint, marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
        <span style={{ fontFamily: H.anton, fontSize: 28, lineHeight: 1, color: accent ? H.accent : H.text, fontWeight: 700 }}>
          {value}
        </span>
        {unit && <span style={{ fontFamily: H.mono, fontSize: 12, color: H.muted }}>{unit}</span>}
      </div>
    </div>
  );
}

// --------------- página principal ---------------

export default function PantallaCalculadora() {
  const { t } = useTranslation();
  const [genero,    setGenero]    = useState("hombre");
  const [edad,      setEdad]      = useState("");
  const [peso,      setPeso]      = useState("");
  const [altura,    setAltura]    = useState("");
  const [actividad, setActividad] = useState("moderado");
  const [objetivo,  setObjetivo]  = useState("mantener");

  const ACTIVITY_OPTIONS = [
    { id: "sedentario",  label: t("calculator.sedentary"),   desc: t("calculator.sedentary_desc"),  factor: 1.2   },
    { id: "ligero",      label: t("calculator.light"),       desc: t("calculator.light_desc"),      factor: 1.375 },
    { id: "moderado",    label: t("calculator.moderate"),    desc: t("calculator.moderate_desc"),   factor: 1.55  },
    { id: "activo",      label: t("calculator.active"),      desc: t("calculator.active_desc"),     factor: 1.725 },
    { id: "muy_activo",  label: t("calculator.very_active"), desc: t("calculator.very_active_desc"),factor: 1.9   },
  ];

  const OBJETIVO_OPTIONS = [
    { id: "perder",   label: t("calculator.lose_weight"), factor: 0.80 },
    { id: "mantener", label: t("calculator.maintain"),    factor: 1.00 },
    { id: "ganar",    label: t("calculator.gain_muscle"), factor: 1.15 },
  ];

  const resultado = useMemo(() => {
    const e = Number(edad), p = Number(peso), a = Number(altura);
    if (!e || !p || !a || e <= 0 || p <= 0 || a <= 0) return null;

    const actFactor = ACTIVITY_FACTORS.find((o) => o.id === actividad)?.factor ?? 1.55;
    const objFactor = OBJETIVO_FACTORS.find((o) => o.id === objetivo)?.factor ?? 1.0;

    const bmr    = Math.round(calcBMR(genero, p, a, e));
    const tdee   = Math.round(bmr * actFactor);
    const target = Math.round(tdee * objFactor);

    // Macros: proteína 2 g/kg, grasas 25% de calorías objetivo, resto = carbos
    const protG  = Math.round(p * 2);
    const protKcal = protG * 4;
    const fatKcal  = Math.round(target * 0.25);
    const fatG     = Math.round(fatKcal / 9);
    const carbKcal = Math.max(0, target - protKcal - fatKcal);
    const carbG    = Math.round(carbKcal / 4);

    return { bmr, tdee, target, protG, protKcal, fatG, fatKcal, carbG, carbKcal };
  }, [genero, edad, peso, altura, actividad, objetivo]);

  const objLabel = OBJETIVO_OPTIONS.find((o) => o.id === objetivo)?.label ?? "";

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%", background: H.bg, color: H.text, fontFamily: H.sans }}>

      {/* ---- HEADER ---- */}
      <header className="calc-header" style={{ padding: "24px 32px 22px", borderBottom: `1px solid ${H.line}` }}>
        <div style={{ fontFamily: H.mono, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: H.accent, marginBottom: 8 }}>
          {t("calculator.subtitle")}
        </div>
        <h1 style={{ margin: 0, fontFamily: H.anton, fontSize: 40, textTransform: "uppercase", letterSpacing: "0.005em", fontWeight: 700 }}>
          {t("calculator.title")}
        </h1>
      </header>

      <div className="calc-body" style={{ flex: 1, padding: "28px 32px 48px" }}>
        <div className="calc-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 24, alignItems: "start" }}>

          {/* ======== COLUMNA IZQUIERDA: FORMULARIO ======== */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

            {/* Género */}
            <div style={{ background: H.card, border: `1px solid ${H.line}`, borderRadius: 16, padding: 20 }}>
              <SectionTitle>{t("calculator.gender")}</SectionTitle>
              <div style={{ display: "flex", gap: 10 }}>
                {["hombre", "mujer"].map((g) => (
                  <ToggleChip
                    key={g}
                    label={g === "hombre" ? t("calculator.male") : t("calculator.female")}
                    active={genero === g}
                    onClick={() => setGenero(g)}
                  />
                ))}
              </div>
            </div>

            {/* Datos físicos */}
            <div style={{ background: H.card, border: `1px solid ${H.line}`, borderRadius: 16, padding: 20 }}>
              <SectionTitle>{t("calculator.physical_data")}</SectionTitle>
              <div className="calc-fields" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                <NumberField
                  label={t("calculator.age")}
                  unit="años"
                  value={edad}
                  onChange={setEdad}
                  min={10}
                  max={120}
                  placeholder="25"
                />
                <NumberField
                  label={t("calculator.weight")}
                  unit="kg"
                  value={peso}
                  onChange={setPeso}
                  min={20}
                  max={400}
                  placeholder="75"
                />
                <NumberField
                  label={t("calculator.height")}
                  unit="cm"
                  value={altura}
                  onChange={setAltura}
                  min={100}
                  max={250}
                  placeholder="175"
                />
              </div>
            </div>

            {/* Nivel de actividad */}
            <div style={{ background: H.card, border: `1px solid ${H.line}`, borderRadius: 16, padding: 20 }}>
              <SectionTitle>{t("calculator.activity_level")}</SectionTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {ACTIVITY_OPTIONS.map((opt) => (
                  <ToggleChip
                    key={opt.id}
                    label={opt.label}
                    sub={opt.desc}
                    active={actividad === opt.id}
                    onClick={() => setActividad(opt.id)}
                  />
                ))}
              </div>
            </div>

            {/* Objetivo */}
            <div style={{ background: H.card, border: `1px solid ${H.line}`, borderRadius: 16, padding: 20 }}>
              <SectionTitle>{t("calculator.goal")}</SectionTitle>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {OBJETIVO_OPTIONS.map((opt) => (
                  <ToggleChip
                    key={opt.id}
                    label={opt.label}
                    active={objetivo === opt.id}
                    onClick={() => setObjetivo(opt.id)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* ======== COLUMNA DERECHA: RESULTADOS ======== */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {!resultado ? (
              /* Placeholder cuando faltan datos */
              <div style={{
                background: H.card,
                border: `1px dashed ${H.line}`,
                borderRadius: 16,
                padding: "48px 32px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                minHeight: 260,
              }}>
                <div style={{ fontSize: 36, opacity: 0.25 }}>⚡</div>
                <div style={{ fontFamily: H.mono, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: H.faint, textAlign: "center" }}>
                  {t("calculator.complete_data")}
                </div>
              </div>
            ) : (
              <>
                {/* Tarjeta principal de resultados */}
                <div style={{ background: H.card, border: `1px solid ${H.line}`, borderRadius: 16, padding: 24 }}>
                  <SectionTitle>{t("calculator.results")}</SectionTitle>

                  {/* BMR y TDEE */}
                  <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                    <div style={{ flex: 1, background: H.panel2, border: `1px solid ${H.line2}`, borderRadius: 11, padding: "13px 16px" }}>
                      <div style={{ fontFamily: H.mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: H.faint, marginBottom: 6 }}>
                        {t("calculator.bmr")}
                      </div>
                      <div style={{ fontFamily: H.mono, fontSize: 22, fontWeight: 700, color: H.text2 }}>
                        {resultado.bmr.toLocaleString("es")}
                        <span style={{ fontSize: 12, color: H.faint, marginLeft: 4 }}>kcal</span>
                      </div>
                    </div>
                    <div style={{ flex: 1, background: H.panel2, border: `1px solid ${H.line2}`, borderRadius: 11, padding: "13px 16px" }}>
                      <div style={{ fontFamily: H.mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: H.faint, marginBottom: 6 }}>
                        {t("calculator.tdee")}
                      </div>
                      <div style={{ fontFamily: H.mono, fontSize: 22, fontWeight: 700, color: H.text2 }}>
                        {resultado.tdee.toLocaleString("es")}
                        <span style={{ fontSize: 12, color: H.faint, marginLeft: 4 }}>kcal</span>
                      </div>
                    </div>
                  </div>

                  {/* Objetivo calórico destacado */}
                  <div style={{
                    background: hexA(ACCENT_HEX, 0.10),
                    border: `1px solid ${hexA(ACCENT_HEX, 0.35)}`,
                    borderRadius: 13,
                    padding: "18px 20px",
                    marginBottom: 22,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                  }}>
                    <div>
                      <div style={{ fontFamily: H.mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: hexA(ACCENT_HEX, 0.7), marginBottom: 4 }}>
                        {t("calculator.caloric_goal", { label: objLabel })}
                      </div>
                      <div style={{ fontFamily: H.anton, fontSize: 44, lineHeight: 1, color: H.accent, fontWeight: 700 }}>
                        {resultado.target.toLocaleString()}
                        <span style={{ fontFamily: H.mono, fontSize: 16, marginLeft: 8, color: hexA(ACCENT_HEX, 0.7) }}>{t("calculator.kcal_day")}</span>
                      </div>
                    </div>
                    <div style={{
                      width: 56,
                      height: 56,
                      borderRadius: "50%",
                      background: hexA(ACCENT_HEX, 0.15),
                      border: `2px solid ${hexA(ACCENT_HEX, 0.4)}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={ACCENT_HEX} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="9" />
                        <circle cx="12" cy="12" r="5" />
                        <circle cx="12" cy="12" r="1" fill={ACCENT_HEX} />
                      </svg>
                    </div>
                  </div>

                  {/* Macros sugeridos */}
                  <div style={{ marginBottom: 4 }}>
                    <div style={{ fontFamily: H.mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: H.faint, marginBottom: 14 }}>
                      {t("calculator.macros")}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      <MacroBar label={t("calculator.protein")}      grams={resultado.protG} kcal={resultado.protKcal} color="#3ecf8e" />
                      <MacroBar label={t("calculator.carbs")}        grams={resultado.carbG} kcal={resultado.carbKcal} color="#38bdf8" />
                      <MacroBar label={t("calculator.fats")}         grams={resultado.fatG}  kcal={resultado.fatKcal}  color={ACCENT_HEX} />
                    </div>
                  </div>
                </div>

                {/* Tarjetas de stats resumen */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <StatCard label={t("calculator.stat_caloric_goal")} value={resultado.target.toLocaleString()} unit="kcal" accent />
                  <StatCard label={t("calculator.protein")}           value={resultado.protG} unit={t("calculator.g_day")} />
                  <StatCard label={t("calculator.carbs")}             value={resultado.carbG} unit={t("calculator.g_day")} />
                  <StatCard label={t("calculator.fats")}              value={resultado.fatG}  unit={t("calculator.g_day")} />
                </div>

                {/* Nota metódica */}
                <div style={{
                  background: H.panel2,
                  border: `1px solid ${H.line2}`,
                  borderRadius: 12,
                  padding: "13px 16px",
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={H.faint} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <p style={{ margin: 0, fontFamily: H.mono, fontSize: 10.5, lineHeight: 1.55, color: H.faint, letterSpacing: "0.02em" }}>
                    {t("calculator.formula_note")}
                  </p>
                </div>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
