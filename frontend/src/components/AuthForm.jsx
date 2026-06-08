// ============================================================
//  AuthForm - Pantalla de acceso de IronLife (login y registro).
//  Diseño a dos columnas: panel visual + formulario.
// ============================================================

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { registrar, login } from "../api";

export default function AuthForm({ onAutenticado }) {
  const { t } = useTranslation();
  const [modo, setModo] = useState("login"); // "login" o "registro"
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const esRegistro = modo === "registro";

  function cambiarModo(nuevoModo) {
    setModo(nuevoModo);
    setError("");
  }

  async function manejarEnvio(evento) {
    evento.preventDefault();
    setError("");
    setCargando(true);
    try {
      if (esRegistro) {
        await registrar(email, nombre, password);
      }
      const datos = await login(email, password);
      onAutenticado(datos.access_token);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="auth">
      {/* ---------- BARRA SUPERIOR ---------- */}
      <header className="auth-top">
        <span className="top-izq">{t("auth.est")}</span>
        <span className="top-centro">{t("auth.members_bar")}</span>
        <nav className="top-tabs">
          <button
            className={!esRegistro ? "tab activa" : "tab"}
            onClick={() => cambiarModo("login")}
          >
            {t("auth.tab_login")}
          </button>
          <button
            className={esRegistro ? "tab activa" : "tab"}
            onClick={() => cambiarModo("registro")}
          >
            {t("auth.tab_register")}
          </button>
        </nav>
      </header>

      <div className="auth-cuerpo">
        {/* ---------- PANEL VISUAL (izquierda) ---------- */}
        <aside className="auth-visual">
          <div className="marca">
            <h1 className="marca-logo">
              IRON<span>LIFE</span>
            </h1>
            <p className="marca-tags">{t("auth.tagline")}</p>
          </div>
        </aside>

        {/* ---------- FORMULARIO (derecha) ---------- */}
        <main className="auth-form-panel">
          <p className="form-eyebrow">
            // {esRegistro ? t("auth.eyebrow_new") : t("auth.eyebrow_access")}
          </p>
          <h2 className="form-titulo">
            {esRegistro ? (
              <>{t("auth.title_create").split("\n")[0]}<br />{t("auth.title_create").split("\n")[1] || ""}</>
            ) : (
              <>{t("auth.title_signin").split("\n")[0]}<br />{t("auth.title_signin").split("\n")[1] || ""}</>
            )}
          </h2>

          <form onSubmit={manejarEnvio}>
            {esRegistro && (
              <div className="campo">
                <label>
                  <span className="num">01</span> {t("auth.field_name")}
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder={t("auth.placeholder_name")}
                  required
                />
              </div>
            )}

            <div className="campo">
              <label>
                <span className="num">{esRegistro ? "02" : "01"}</span> {t("auth.field_email")}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("auth.placeholder_email")}
                required
              />
            </div>

            <div className="campo">
              <label>
                <span className="num">{esRegistro ? "03" : "02"}</span> {t("auth.field_password")}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
                required
              />
            </div>

            {!esRegistro && (
              <div className="form-opciones">
                <label className="recordarme">
                  <input type="checkbox" defaultChecked /> {t("auth.remember_me")}
                </label>
                <button type="button" className="enlace-mini">
                  {t("auth.forgot")}
                </button>
              </div>
            )}

            {error && <p className="error">{error}</p>}

            <button type="submit" className="boton-principal" disabled={cargando}>
              {cargando
                ? t("auth.btn_loading")
                : esRegistro
                ? t("auth.btn_create")
                : t("auth.btn_signin")}
            </button>
          </form>


          <p className="form-pie">
            {esRegistro ? t("auth.already_account") : t("auth.no_account")}
            <button
              type="button"
              className="enlace"
              onClick={() => cambiarModo(esRegistro ? "login" : "registro")}
            >
              {esRegistro ? t("auth.enter") : t("auth.join")}
            </button>
          </p>
        </main>
      </div>
    </div>
  );
}
