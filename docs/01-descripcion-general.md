# 📋 Descripción General

## ¿Qué es IronLife?

IronLife es una **aplicación web de gestión de entrenamientos** para gimnasio. Permite a los usuarios registrarse, crear rutinas personalizadas, registrar sus sesiones de entrenamiento con series y pesos, y visualizar su progreso a lo largo del tiempo.

---

## Funcionalidades principales

### 🔐 Autenticación
- Registro con email y contraseña
- Login con token JWT (válido 24 horas por defecto)
- Contraseñas nunca almacenadas en texto plano (bcrypt)

### 💪 Gestión de entrenamientos
- **Rutinas**: Crea rutinas personalizadas con ejercicios en orden específico
- **Plantillas por defecto**: 4 rutinas preconfiguradas (Push, Pull, Pierna, Full Body)
- **Sesiones**: Inicia una sesión vinculada a una rutina (o libre)
- **Series**: Registra cada serie con peso (kg), repeticiones y RIR (repeticiones en reserva)
- **Catálogo de ejercicios**: ~120 ejercicios categorizados por grupo muscular y equipo
- **Timer de sesión**: Cronómetro persistente durante el entrenamiento
- **Timer de descanso**: Cuenta regresiva entre series (guardado en localStorage)

### 📊 Progreso y analíticas
- **Dashboard** con estadísticas mensuales (sesiones, racha, cardio)
- **Calendario** visual con las rutinas por día
- **Análisis de progreso**:
  - Volumen total por semana (últimas 12 semanas)
  - Distribución por grupo muscular
  - Top 6 records personales (máximo peso levantado)
  - Gráficas de progresión por ejercicio
- **Historial de sesiones**: Últimas 50 sesiones con detalle de ejercicios

### 🏃 Cardio
- Registro de actividad cardio: distancia (km) y tiempo (minutos)
- Visualizado en el calendario y en el dashboard mensual

### 🧮 Calculadora de nutrición
- Cálculo de calorías (fórmula Harris-Benedict)
- Multiplicadores de actividad física
- Ajuste por objetivo (perder / mantener / ganar)
- Desglose de macronutrientes

### 🌐 Internacionalización
- Soporte completo en **Español** e **Inglés**
- Detección automática del idioma del navegador
- Fallback a Español

---

## Usuarios objetivo

Personas que van al gimnasio y quieren llevar un registro digital de sus entrenamientos, ver su progreso y planificar sus rutinas sin depender de apps de pago.
