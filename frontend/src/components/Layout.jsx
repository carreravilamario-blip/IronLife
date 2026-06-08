// ============================================================
//  Layout - Estructura base con barra lateral.
// ============================================================

import { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context";
import { crearRutina, borrarRutina } from "../api";
import { useTheme } from "../hooks/useTheme";

// ── Iconos ────────────────────────────────────────────────────
const IcCalc = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="2"/>
    <line x1="8" y1="6" x2="16" y2="6"/>
    <line x1="8" y1="10" x2="8" y2="10"/><line x1="12" y1="10" x2="12" y2="10"/>
    <line x1="16" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="8" y2="14"/>
    <line x1="12" y1="14" x2="12" y2="14"/><line x1="16" y1="14" x2="16" y2="14"/>
    <line x1="8" y1="18" x2="12" y2="18"/>
  </svg>
);
const IcHome = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>
  </svg>
);
const IcDumb = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M2 9v6M5 7v10M19 7v10M22 9v6M5 12h14"/>
  </svg>
);
const IcChart = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 17 9 11 13 15 21 7"/>
  </svg>
);
const IcHist = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 16 14"/>
  </svg>
);
const IcLogout = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
const IcPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const DumbbellMark = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.4" strokeLinecap="round">
    <path d="M2 9v6M5 7v10M19 7v10M22 9v6M5 12h14"/>
  </svg>
);

// ── Modal para crear rutina ────────────────────────────────────
function ModalNuevaRutina({ onCerrar }) {
  const { t } = useTranslation();
  const { token, agregarRutina } = useAuth();
  const [nombre, setNombre]           = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [guardando, setGuardando]     = useState(false);
  const [error, setError]             = useState("");
  const inputRef = useRef(null);

  // Foco automático al abrir
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 40);
  }, []);

  // Cerrar con Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onCerrar(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCerrar]);

  async function manejarGuardar(e) {
    e.preventDefault();
    const nombreLimpio = nombre.trim();
    if (!nombreLimpio) { setError(t("common.error_name_empty")); return; }
    setGuardando(true);
    setError("");
    try {
      // Crea la rutina vacía (sin ejercicios).
      // Los ejercicios se añaden desde la pantalla de entrenamiento.
      const nueva = await crearRutina(
        { nombre: nombreLimpio, descripcion: descripcion.trim() || null, ejercicio_ids: [] },
        token
      );
      agregarRutina(nueva);  // actualiza la lista en el contexto
      onCerrar();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onCerrar}>
      <div
        className="modal-nueva-rutina"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={t("routine.new_title")}
      >
        <h3 className="modal-nr-titulo">{t("routine.new_title")}</h3>

        <form onSubmit={manejarGuardar}>
          <label className="modal-nr-label">
            {t("routine.name_label")}
            <input
              ref={inputRef}
              className="modal-nr-input"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder={t("routine.name_placeholder")}
              maxLength={120}
            />
          </label>

          <label className="modal-nr-label">
            {t("routine.desc_label")} <span style={{ color: "var(--muted)", fontWeight: 400 }}>{t("routine.optional")}</span>
            <input
              className="modal-nr-input"
              type="text"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder={t("routine.desc_placeholder")}
              maxLength={120}
            />
          </label>

          {error && <p className="modal-nr-error">{error}</p>}

          <div className="modal-nr-acciones">
            <button
              type="button"
              className="modal-nr-btn modal-nr-btn-cancel"
              onClick={onCerrar}
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              className="modal-nr-btn modal-nr-btn-ok"
              disabled={guardando}
            >
              {guardando ? t("common.saving") : t("routine.create_btn")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Icono de editar ──────────────────────────────────────────
const IcEdit = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

// ── Icono de papelera ─────────────────────────────────────────
const IcTrash = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14H6L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4h6v2"/>
  </svg>
);

// ── Item de rutina con borrado inline ─────────────────────────
function RutinaItem({ rutina, estaActiva }) {
  const { t } = useTranslation();
  const { token, quitarRutina } = useAuth();
  const navigate = useNavigate();
  const [confirmando, setConfirmando] = useState(false);
  const [borrando, setBorrando]       = useState(false);
  const [errorBorrar, setErrorBorrar] = useState("");

  async function manejarBorrar(e) {
    e.preventDefault();
    e.stopPropagation();
    setBorrando(true);
    setErrorBorrar("");
    try {
      await borrarRutina(rutina.id, token);
      quitarRutina(rutina.id);
      if (estaActiva) navigate("/");
    } catch (err) {
      setErrorBorrar(err.message);
      setBorrando(false);
    }
  }

  // Vista de confirmación: reemplaza el item normal
  if (confirmando) {
    return (
      <div className="rutina-item rutina-item-confirmar">
        <span className="rutina-confirmar-texto">
          {t("routine.confirm_delete", { name: rutina.nombre })}
        </span>
        {errorBorrar && (
          <span className="rutina-confirmar-error">{errorBorrar}</span>
        )}
        <div className="rutina-confirmar-btns">
          <button
            className="rutina-btn-si"
            onClick={manejarBorrar}
            disabled={borrando}
          >
            {borrando ? "…" : t("common.yes")}
          </button>
          <button
            className="rutina-btn-no"
            onClick={(e) => { e.preventDefault(); setConfirmando(false); setErrorBorrar(""); }}
          >
            {t("common.no")}
          </button>
        </div>
      </div>
    );
  }

  // Vista normal: navega + botón ✕ en hover
  return (
    <NavLink
      to={`/entrenar/${rutina.id}`}
      className={({ isActive }) => "rutina-item" + (isActive ? " activo" : "")}
    >
      <div className="rutina-item-cabecera">
        <span className="rutina-dot" />
        <span className="rutina-nombre">{rutina.nombre}</span>
        {/* Botón editar — visible solo en hover (via CSS) */}
        <button
          className="rutina-btn-editar"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/rutinas/${rutina.id}/editar`); }}
          title={t("routine.edit")}
          aria-label={`${t("routine.edit")} ${rutina.nombre}`}
        >
          <IcEdit />
        </button>
        {/* Botón borrar — visible solo en hover (via CSS) */}
        <button
          className="rutina-btn-borrar"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirmando(true); }}
          title={t("routine.delete")}
          aria-label={`${t("routine.delete")} ${rutina.nombre}`}
        >
          <IcTrash />
        </button>
      </div>
      {rutina.descripcion && <div className="rutina-sub">{rutina.descripcion}</div>}
    </NavLink>
  );
}

// ── Componente principal ──────────────────────────────────────
export default function Layout({ onCerrarSesion, children }) {
  const { t, i18n } = useTranslation();
  const { usuario, rutinas } = useAuth();
  const { rutinaId } = useParams();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
  const inicial = usuario?.nombre?.[0]?.toUpperCase() ?? "U";
  const { modo, toggleTema } = useTheme();
  const idiomaActual = i18n.language?.startsWith("en") ? "en" : "es";
  const toggleIdioma = () => i18n.changeLanguage(idiomaActual === "es" ? "en" : "es");

  return (
    <div className="layout">

      {/* ── Top bar móvil (solo visible en móvil) ── */}
      <header className="mobile-topbar">
        <div className="mobile-topbar-logo">
          <DumbbellMark />
          <span className="sidebar-logo-text">IRON<span>LIFE</span></span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            className="mobile-topbar-btn"
            onClick={() => setModalAbierto(true)}
            aria-label={t("nav.new_routine")}
          >
            <IcPlus />
          </button>
          <button
            className="mobile-topbar-btn"
            onClick={() => setMenuMovilAbierto(o => !o)}
            aria-label="Menú"
          >
            <div className="usuario-avatar" style={{ width: 28, height: 28, fontSize: 12 }}>{inicial}</div>
          </button>
        </div>
        {/* Desplegable de usuario en móvil */}
        {menuMovilAbierto && (
          <div className="mobile-user-menu" onClick={() => setMenuMovilAbierto(false)}>
            <button className="mobile-user-menu-item" onClick={toggleTema}>
              {modo === "dark" ? t("nav.light_mode") : t("nav.dark_mode")}
            </button>
            <button className="mobile-user-menu-item" onClick={toggleIdioma}>
              {idiomaActual === "es" ? "EN" : "ES"}
            </button>
            <button className="mobile-user-menu-item danger" onClick={onCerrarSesion}>
              {t("nav.logout")}
            </button>
          </div>
        )}
      </header>

      {/* ── Barra lateral (solo escritorio) ── */}
      <aside className="sidebar wk-scroll">
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon"><DumbbellMark /></div>
          <span className="sidebar-logo-text">IRON<span>LIFE</span></span>
        </div>

        {/* Navegación */}
        <nav className="sidebar-nav">
          <NavLink to="/" end className={({ isActive }) => "nav-item" + (isActive ? " activo" : "")}>
            <IcHome /> {t("nav.home")}
          </NavLink>
          <NavLink to="/entrenar" className={({ isActive }) => "nav-item" + (isActive ? " activo" : "")}>
            <IcDumb /> {t("nav.train")}
          </NavLink>
          <NavLink to="/progreso" className={({ isActive }) => "nav-item" + (isActive ? " activo" : "")}>
            <IcChart /> {t("nav.progress")}
          </NavLink>
          <NavLink to="/historial" className={({ isActive }) => "nav-item" + (isActive ? " activo" : "")}>
            <IcHist /> {t("nav.history")}
          </NavLink>
          <NavLink to="/calculadora" className={({ isActive }) => "nav-item" + (isActive ? " activo" : "")}>
            <IcCalc /> {t("nav.calculator")}
          </NavLink>
        </nav>

        {/* Rutinas guardadas */}
        <div className="sidebar-rutinas">
          {/* Cabecera con botón "+" */}
          <div className="sidebar-rutinas-header">
            <p className="sidebar-seccion-titulo">{t("nav.saved_routines")}</p>
            <button
              className="sidebar-btn-nueva-rutina"
              onClick={() => setModalAbierto(true)}
              title={t("nav.new_routine")}
              aria-label={t("nav.new_routine")}
            >
              <IcPlus />
            </button>
          </div>

          {/* Lista de rutinas */}
          {rutinas.length === 0 ? (
            <p className="sidebar-rutinas-vacio">
              {t("nav.no_routines")}
            </p>
          ) : (
            rutinas.map((r) => (
              <RutinaItem
                key={r.id}
                rutina={r}
                estaActiva={String(r.id) === rutinaId}
              />
            ))
          )}
        </div>

        {/* Toggle tema */}
        <button className="theme-toggle" onClick={toggleTema} title={modo === "dark" ? t("nav.light_mode") : t("nav.dark_mode")}>
          {modo === "dark" ? (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
              {t("nav.light_mode")}
            </>
          ) : (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
              {t("nav.dark_mode")}
            </>
          )}
        </button>

        {/* Toggle idioma */}
        <button className="theme-toggle" onClick={toggleIdioma} title={t("nav.language")}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9"/>
            <path d="M3.6 9h16.8M3.6 15h16.8"/>
            <path d="M12 3a14.6 14.6 0 0 1 0 18M12 3a14.6 14.6 0 0 0 0 18"/>
          </svg>
          {idiomaActual === "es" ? "ES → EN" : "EN → ES"}
        </button>

        {/* Usuario */}
        <div className="sidebar-footer">
          <div className="usuario-avatar">{inicial}</div>
          <div className="usuario-info">
            <span className="usuario-nombre">{usuario?.nombre}</span>
            <span className="usuario-plan">{t("nav.pro_plan")}</span>
          </div>
          <button className="cerrar-sesion-btn" onClick={onCerrarSesion} title={t("nav.logout")}>
            <IcLogout />
          </button>
        </div>
      </aside>

      {/* ── Contenido principal ── */}
      <main className="contenido-principal">{children}</main>

      {/* ── Bottom nav (solo móvil) ── */}
      <nav className="mobile-nav">
        <NavLink to="/" end className={({ isActive }) => "mobile-nav-item" + (isActive ? " activo" : "")}>
          <IcHome />
          <span>{t("nav.home")}</span>
        </NavLink>
        <NavLink to="/entrenar" className={({ isActive }) => "mobile-nav-item" + (isActive ? " activo" : "")}>
          <IcDumb />
          <span>{t("nav.train")}</span>
        </NavLink>
        <NavLink to="/progreso" className={({ isActive }) => "mobile-nav-item" + (isActive ? " activo" : "")}>
          <IcChart />
          <span>{t("nav.progress")}</span>
        </NavLink>
        <NavLink to="/historial" className={({ isActive }) => "mobile-nav-item" + (isActive ? " activo" : "")}>
          <IcHist />
          <span>{t("nav.history")}</span>
        </NavLink>
        <NavLink to="/calculadora" className={({ isActive }) => "mobile-nav-item" + (isActive ? " activo" : "")}>
          <IcCalc />
          <span>{t("nav.calculator")}</span>
        </NavLink>
      </nav>

      {/* ── Modal nueva rutina ── */}
      {modalAbierto && <ModalNuevaRutina onCerrar={() => setModalAbierto(false)} />}
    </div>
  );
}
