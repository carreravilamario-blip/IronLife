# 🗺️ Roadmap

## ✅ Fase 1 — MVP (Completada)

### Backend
- [x] Autenticación JWT (registro, login, token)
- [x] Catálogo global de ejercicios (~120 ejercicios)
- [x] CRUD de rutinas personalizadas
- [x] Sesiones de entrenamiento (crear, finalizar)
- [x] Registro de series (kg, reps, RIR)
- [x] Estadísticas: volumen, racha, records personales
- [x] Sincronización de ejercicios desde wger.de
- [x] Migraciones con Alembic
- [x] Seed automático al arrancar

### Frontend
- [x] Pantalla de inicio (dashboard con stats mensuales)
- [x] Calendario visual de entrenamientos
- [x] Pantalla de selección de rutina
- [x] Pantalla de entrenamiento activo con timer
- [x] Pantalla de progreso con gráficas SVG
- [x] Historial de sesiones
- [x] Editor de rutinas (crear/editar)
- [x] Calculadora de calorías y macros
- [x] Soporte bilingüe (ES/EN)
- [x] Diseño responsive (móvil y escritorio)

---

## 🔄 Fase 2 — Mejoras UX (En progreso)

- [ ] Diseño mobile mejorado (layout optimizado para iOS/Android)
- [ ] Timer de descanso persistente entre series
- [ ] Comparativa de sesión anterior al entrenar ("última vez hiciste 80kg x 8")
- [ ] Modo oscuro

---

## 📋 Fase 3 — Funcionalidades avanzadas (Planificado)

- [ ] **Registro de peso corporal** — Gráfica de evolución del peso
- [ ] **1RM estimado** — Cálculo del máximo teórico por ejercicio
- [ ] **Deload automático** — Sugerir reducción de carga después de X semanas
- [ ] **Plantillas de series** — Guardar esquemas (3x8, 5x5, pirámide) reutilizables
- [ ] **Notas por sesión** — Campo de texto libre para apuntar sensaciones
- [ ] **Paginación del historial** — Actualmente limitado a 50 sesiones

---

## 🚀 Fase 4 — Escalabilidad (Futuro)

- [ ] **Notificaciones push** — Recordatorios de entrenamiento
- [ ] **App móvil** — React Native con el mismo backend
- [ ] **Soporte offline** — Service Workers para entrenar sin conexión
- [ ] **Exportar datos** — Descargar historial en CSV/PDF
- [ ] **Social** — Compartir rutinas con otros usuarios

---

## 🐛 Bugs conocidos / Deuda técnica

| Prioridad | Issue | Descripción |
|-----------|-------|-------------|
| Media | Token refresh | No hay refresh silencioso; al expirar el token (24h) el usuario es deslogueado |
| Baja | Paginación historial | El endpoint `/api/historial` devuelve máximo 50 sesiones |
| Baja | Validación email | Solo se valida formato en backend; no se verifica que el email exista |

---

## Convenciones del proyecto

- **Ramas Git:** `main` (producción) / `Desarrollo` (trabajo en curso)
- **Commits:** siguiendo [Conventional Commits](https://www.conventionalcommits.org/) — `feat:`, `fix:`, `chore:`, etc.
- **Idioma del código:** Español para nombres de variables/funciones/componentes; inglés para comentarios de código técnico
