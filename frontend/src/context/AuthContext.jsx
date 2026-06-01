// ============================================================
//  AuthContext — Estado de autenticación accesible desde
//  cualquier componente sin pasar props manualmente.
//
//  CONCEPTO: "Context" en React es como una variable global
//  pero controlada. En lugar de pasar "token" de padre a hijo
//  a nieto (prop drilling), cualquier componente puede obtenerlo
//  directamente con: const { token, usuario } = useAuth();
// ============================================================

import { createContext, useContext, useState, useEffect } from "react";
import { obtenerUsuarioActual, listarRutinas, sembrarRutinasDefecto } from "../api";

// 1) Creamos el contexto (el "recipiente" compartido).
const AuthContext = createContext(null);

// 2) El Provider "envuelve" la app y provee los valores.
export function AuthProvider({ children }) {
  const [token, setToken]     = useState(() => localStorage.getItem("token"));
  const [usuario, setUsuario] = useState(null);
  const [rutinas, setRutinas] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Al cambiar el token, cargamos el usuario y sus rutinas.
  useEffect(() => {
    if (!token) {
      setUsuario(null);
      setRutinas([]);
      setCargando(false);
      return;
    }

    let cancelado = false;
    async function cargar() {
      setCargando(true);
      try {
        const user = await obtenerUsuarioActual(token);
        if (cancelado) return;
        setUsuario(user);

        let lista = await listarRutinas(token);
        if (lista.length === 0) lista = await sembrarRutinasDefecto(token);
        if (cancelado) return;
        setRutinas(lista);
      } catch {
        // Token inválido o expirado → cerramos sesión
        if (!cancelado) cerrarSesion();
      } finally {
        if (!cancelado) setCargando(false);
      }
    }
    cargar();
    return () => { cancelado = true; };
  }, [token]);

  function iniciarSesion(nuevoToken) {
    localStorage.setItem("token", nuevoToken);
    setToken(nuevoToken);
  }

  function cerrarSesion() {
    localStorage.removeItem("token");
    setToken(null);
    setUsuario(null);
    setRutinas([]);
  }

  // Añade una rutina recién creada a la lista sin recargar todo.
  function agregarRutina(nuevaRutina) {
    setRutinas((prev) => [...prev, nuevaRutina]);
  }

  // Elimina una rutina de la lista local.
  function quitarRutina(rutinaId) {
    setRutinas((prev) => prev.filter((r) => r.id !== rutinaId));
  }

  const valor = {
    token, usuario, rutinas, cargando,
    iniciarSesion, cerrarSesion, agregarRutina, quitarRutina,
  };

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

// 3) Hook personalizado: la forma de consumir el contexto.
//    Cualquier componente hace: const { token } = useAuth();
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
