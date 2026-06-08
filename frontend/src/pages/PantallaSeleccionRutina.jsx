// ============================================================
//  PantallaSeleccionRutina — Lista todas las rutinas guardadas
//  para que el usuario elija con cuál entrenar hoy.
// ============================================================

import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context";
import { WK as H, hexA, ACCENT_HEX } from "../ui/theme";

// Color por posición (rota si hay más de 4 rutinas)
const COLORES = ["#ff5722", "#3b82f6", "#a855f7", "#3ecf8e", "#38bdf8", "#facc15"];

const IcArrow = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
);

const IcDumbbell = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round">
    <path d="M2 9v6M5 7v10M19 7v10M22 9v6M5 12h14"/>
  </svg>
);

export default function PantallaSeleccionRutina() {
  const { t } = useTranslation();
  const { rutinas } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%",
      background: H.bg, color: H.text, fontFamily: H.sans }}>

      <header style={{ padding: "24px 32px 22px", borderBottom: `1px solid ${H.line}` }}>
        <div style={{ fontFamily: H.mono, fontSize: 11, letterSpacing: "0.16em",
          textTransform: "uppercase", color: H.accent, marginBottom: 8 }}>
          {t("selection.today_session")}
        </div>
        <h1 style={{ margin: 0, fontFamily: H.anton, fontSize: 40,
          textTransform: "uppercase", letterSpacing: "0.005em", fontWeight: 700 }}>
          {t("selection.what_train")}
        </h1>
      </header>

      <div style={{ flex: 1, padding: "28px 32px 40px" }}>
        {(!rutinas || rutinas.length === 0) ? (
          /* Estado vacío */
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", minHeight: 320, gap: 16, textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: 18,
              background: hexA(ACCENT_HEX, 0.12), border: `1px solid ${hexA(ACCENT_HEX, 0.25)}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: H.accent }}>
              <IcDumbbell />
            </div>
            <div>
              <p style={{ fontFamily: H.sans, fontWeight: 700, fontSize: 18,
                color: H.text, margin: "0 0 8px" }}>
                {t("selection.no_routines_title")}
              </p>
              <p style={{ fontFamily: H.mono, fontSize: 12, color: H.muted, margin: 0 }}>
                {t("selection.no_routines_desc")}
              </p>
            </div>
          </div>
        ) : (
          <div style={{ display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 16, maxWidth: 960 }}>
            {rutinas.map((r, i) => {
              const color = COLORES[i % COLORES.length];
              return (
                <button
                  key={r.id}
                  onClick={() => navigate(`/entrenar/${r.id}`)}
                  className="wk-row"
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "flex-start",
                    gap: 12, padding: "20px 22px", borderRadius: 16, cursor: "pointer",
                    textAlign: "left", background: H.card,
                    border: `1px solid ${H.line}`,
                    transition: "border-color 0.15s, box-shadow 0.15s",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = hexA(color, 0.5);
                    e.currentTarget.style.boxShadow = `0 0 0 3px ${hexA(color, 0.1)}`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = H.line;
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  {/* Punto de color */}
                  <div style={{ display: "flex", alignItems: "center",
                    justifyContent: "space-between", width: "100%" }}>
                    <span style={{ width: 12, height: 12, borderRadius: 4,
                      background: color, flexShrink: 0 }} />
                    <span style={{ color: H.faint }}><IcArrow /></span>
                  </div>

                  {/* Nombre */}
                  <div>
                    <div style={{ fontFamily: H.anton, fontSize: 22,
                      textTransform: "uppercase", letterSpacing: "0.02em",
                      color: H.text, lineHeight: 1.1, marginBottom: 6 }}>
                      {r.nombre}
                    </div>
                    {r.descripcion && (
                      <div style={{ fontFamily: H.mono, fontSize: 11,
                        letterSpacing: "0.06em", textTransform: "uppercase",
                        color: H.muted }}>
                        {r.descripcion}
                      </div>
                    )}
                  </div>

                  {/* Número de ejercicios */}
                  <div style={{ fontFamily: H.mono, fontSize: 11,
                    color: H.faint, letterSpacing: "0.08em",
                    textTransform: "uppercase", marginTop: "auto" }}>
                    {t("routine.exercises", { count: r.ejercicios?.length ?? 0 })}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
