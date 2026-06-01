// ============================================================
//  App.jsx — Componente raíz. Solo gestiona enrutamiento.
//  El estado de autenticación vive en AuthContext.
// ============================================================

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context";
import AuthForm from "./components/AuthForm";
import Layout from "./components/Layout";
import PantallaInicio from "./pages/PantallaInicio";
import PantallaSeleccionRutina from "./pages/PantallaSeleccionRutina";
import PantallaEntrenar from "./pages/PantallaEntrenar";
import PantallaProgreso from "./pages/PantallaProgreso";
import PantallaHistorial from "./pages/PantallaHistorial";
import PantallaEditorRutina from "./pages/PantallaEditorRutina";
import PantallaCalculadora from "./pages/PantallaCalculadora";
import "./App.css";

// ── Pantalla provisional para secciones futuras ───────────────
function PantallaPronto({ nombre }) {
  return (
    <div className="pantalla-vacia">
      <p style={{ fontSize: 40, margin: "0 0 16px" }}>🚧</p>
      <h2>{nombre}</h2>
      <p>Esta sección estará disponible pronto.</p>
    </div>
  );
}

// ── Shell autenticado ─────────────────────────────────────────
// Separado en su propio componente para poder leer el contexto
// (App exporta el Provider, y useAuth necesita estar dentro de él).
function AppShell() {
  const { usuario, rutinas, cargando, iniciarSesion, cerrarSesion } = useAuth();

  if (cargando) {
    return (
      <div className="contenedor">
        <p className="cargando-pantalla">Cargando...</p>
      </div>
    );
  }

  // Sin sesión → pantalla de login/registro
  if (!usuario) return <AuthForm onAutenticado={iniciarSesion} />;

  // Con sesión → layout con sidebar y rutas
  return (
    <Layout usuario={usuario} rutinas={rutinas} onCerrarSesion={cerrarSesion}>
      <Routes>
        <Route path="/"               element={<PantallaInicio />} />
        <Route path="/entrenar"       element={<PantallaSeleccionRutina />} />
        <Route path="/entrenar/:rutinaId" element={<PantallaEntrenar />} />
        <Route path="/progreso"       element={<PantallaProgreso />} />
        <Route path="/historial"      element={<PantallaHistorial />} />
        <Route path="/rutinas/:rutinaId/editar" element={<PantallaEditorRutina />} />
        <Route path="/calculadora"    element={<PantallaCalculadora />} />
        <Route path="*"               element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

// ── Componente raíz ───────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </AuthProvider>
  );
}
