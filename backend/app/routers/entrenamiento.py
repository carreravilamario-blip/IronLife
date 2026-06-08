# ============================================================
#  Rutas de entrenamiento: ejercicios, rutinas, sesiones y series.
#  Todas requieren estar logueado (usuario actual).
# ============================================================

import json
import urllib.request
import urllib.error
from datetime import date, timedelta
from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import (
    Ejercicio,
    Rutina,
    RutinaEjercicio,
    SerieRegistro,
    Sesion,
    Usuario,
)
from app.routers.auth import obtener_usuario_actual
from app.schemas import (
    EjercicioAnterior,
    EjercicioCrear,
    EjercicioHistorial,
    EjercicioPublico,
    Estadisticas,
    EstadisticasResumen,
    MusculoSeries,
    ProgesionEjercicio,
    PuntoProgresion,
    RecordEjercicio,
    RutinaActualizar,
    RutinaCrear,
    RutinaPublica,
    SerieActualizar,
    SerieAnterior,
    SerieCrear,
    SerieHistorial,
    SeriePublica,
    SesionCrear,
    SesionFinalizar,
    SesionHistorialPublica,
    SesionPublica,
    VolumenSemanal,
)

router = APIRouter(prefix="/api", tags=["entrenamiento"])


# Plantillas de rutinas por defecto (se crean para el usuario la primera vez).
RUTINAS_DEFECTO = [
    ("Empuje · Push", "Pecho · Hombro · Triceps",
     ["Press banca", "Press inclinado mancuernas", "Press militar",
      "Fondos", "Extension triceps polea", "Elevaciones laterales"]),
    ("Tiron · Pull", "Espalda · Biceps",
     ["Dominadas", "Remo con barra", "Jalon al pecho",
      "Curl con barra", "Curl martillo", "Face pull"]),
    ("Pierna · Legs", "Cuadriceps · Isquios",
     ["Sentadilla", "Prensa", "Peso muerto rumano",
      "Extension de cuadriceps", "Curl femoral", "Elevacion de gemelos"]),
    ("Full Body", "Cuerpo completo",
     ["Sentadilla", "Press banca", "Remo con barra",
      "Press militar", "Curl con barra"]),
]


# ============================================================
#  Funcion auxiliar: convertir una Rutina (BD) en RutinaPublica
#  incluyendo su lista de ejercicios en orden.
# ============================================================
def _rutina_a_publica(rutina: Rutina, db: Session) -> RutinaPublica:
    filas = (
        db.query(RutinaEjercicio)
        .filter(RutinaEjercicio.rutina_id == rutina.id)
        .order_by(RutinaEjercicio.orden)
        .all()
    )
    ejercicios = []
    for fila in filas:
        ej = db.query(Ejercicio).filter(Ejercicio.id == fila.ejercicio_id).first()
        if ej:
            ejercicios.append(EjercicioPublico.model_validate(ej))
    return RutinaPublica(
        id=rutina.id,
        nombre=rutina.nombre,
        descripcion=rutina.descripcion,
        ejercicios=ejercicios,
    )


# ============================================================
#  EJERCICIOS (catalogo)
# ============================================================
@router.get("/ejercicios", response_model=list[EjercicioPublico])
def listar_ejercicios(db: Session = Depends(get_db)):
    return db.query(Ejercicio).order_by(Ejercicio.grupo_muscular, Ejercicio.nombre).all()


@router.post("/ejercicios", response_model=EjercicioPublico, status_code=status.HTTP_201_CREATED)
def crear_ejercicio(
    datos: EjercicioCrear,
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    """Crea un ejercicio personalizado. El nombre se normaliza a título."""
    nuevo = Ejercicio(
        nombre=datos.nombre.strip(),
        grupo_muscular=datos.grupo_muscular.upper(),
        equipo=datos.equipo.upper(),
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


# ── Mapas wger → nombres en español ──────────────────────────
_GRUPOS_WGER = {
    "Abs":          "ABDOMINALES",
    "Arms":         "BICEPS",
    "Back":         "ESPALDA",
    "Chest":        "PECHO",
    "Legs":         "CUADRICEPS",
    "Shoulders":    "HOMBROS",
    "Calves":       "GEMELOS",
    "Cardio":       "CARDIO",
    "Stretching":   "FLEXIBILIDAD",
}
_EQUIPOS_WGER = {
    "Barbell":              "BARRA",
    "SZ-Bar":               "BARRA EZ",
    "Dumbbell":             "MANCUERNAS",
    "Weight plate":         "DISCO",
    "Kettlebell":           "KETTLEBELL",
    "Pull-up bar":          "PESO CORPORAL",
    "Body weight":          "PESO CORPORAL",
    "None":                 "PESO CORPORAL",
    "Bench":                "BANCO",
    "Incline bench":        "BANCO",
    "Gymnastics mat":       "COLCHONETA",
    "Swiss ball":           "FITBALL",
    "Pull-up triangle":     "ANILLAS",
    "Resistance band":      "BANDA ELASTICA",
    "Cable":                "POLEA",
    "Machine":              "MAQUINA",
    "Foam Roll":            "FOAM ROLLER",
    "EZ Curl Bar":          "BARRA EZ",
    "TRX":                  "TRX",
}


@router.post("/ejercicios/sync-wger")
def sync_ejercicios_wger(
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    """
    Importa ejercicios desde la API pública de wger.de (sin clave).
    Descarga hasta 300 ejercicios en inglés, los mapea a nuestros
    campos y los inserta si no existen ya.
    """
    importados = 0
    errores = 0
    url = "https://wger.de/api/v2/exercise/?format=json&language=2&limit=100&offset=0"

    while url and importados + errores < 300:
        try:
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "IronLife/1.0 (fitness app; educational use)"},
            )
            with urllib.request.urlopen(req, timeout=12) as resp:
                data = json.loads(resp.read())
        except urllib.error.URLError as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"No se pudo conectar con wger.de: {exc.reason}",
            )
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Error al leer wger.de: {str(exc)}",
            )

        for ej in data.get("results", []):
            nombre = (ej.get("name") or "").strip()
            if not nombre:
                errores += 1
                continue

            cat = ej.get("category") or {}
            grupo = _GRUPOS_WGER.get(cat.get("name", ""), "OTROS")

            equipos = ej.get("equipment") or []
            equipo = "PESO CORPORAL"
            for eq in equipos:
                mapped = _EQUIPOS_WGER.get(eq.get("name", ""), None)
                if mapped:
                    equipo = mapped
                    break

            existe = db.query(Ejercicio).filter(Ejercicio.nombre == nombre).first()
            if not existe:
                db.add(Ejercicio(nombre=nombre, grupo_muscular=grupo, equipo=equipo))
                importados += 1

        db.commit()
        url = data.get("next")  # None cuando no hay más páginas

    total = db.query(Ejercicio).count()
    return {
        "importados": importados,
        "omitidos_sin_nombre": errores,
        "total_en_bd": total,
    }


# ============================================================
#  RUTINAS
# ============================================================
@router.get("/rutinas", response_model=list[RutinaPublica])
def listar_rutinas(
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    rutinas = db.query(Rutina).filter(Rutina.usuario_id == usuario.id).all()
    return [_rutina_a_publica(r, db) for r in rutinas]


@router.post("/rutinas", response_model=RutinaPublica, status_code=status.HTTP_201_CREATED)
def crear_rutina(
    datos: RutinaCrear,
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    rutina = Rutina(nombre=datos.nombre, descripcion=datos.descripcion, usuario_id=usuario.id)
    db.add(rutina)
    db.commit()
    db.refresh(rutina)

    # Añadimos los ejercicios elegidos, conservando el orden de la lista.
    for orden, ejercicio_id in enumerate(datos.ejercicio_ids):
        db.add(RutinaEjercicio(rutina_id=rutina.id, ejercicio_id=ejercicio_id, orden=orden))
    db.commit()

    return _rutina_a_publica(rutina, db)


@router.post("/rutinas/sembrar-defecto", response_model=list[RutinaPublica])
def sembrar_rutinas_defecto(
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    """Crea las rutinas por defecto para el usuario (solo si no tiene ninguna)."""
    existentes = db.query(Rutina).filter(Rutina.usuario_id == usuario.id).count()
    if existentes > 0:
        rutinas = db.query(Rutina).filter(Rutina.usuario_id == usuario.id).all()
        return [_rutina_a_publica(r, db) for r in rutinas]

    creadas = []
    for nombre, descripcion, nombres_ejercicios in RUTINAS_DEFECTO:
        rutina = Rutina(nombre=nombre, descripcion=descripcion, usuario_id=usuario.id)
        db.add(rutina)
        db.commit()
        db.refresh(rutina)
        for orden, nombre_ej in enumerate(nombres_ejercicios):
            ej = db.query(Ejercicio).filter(Ejercicio.nombre == nombre_ej).first()
            if ej:
                db.add(RutinaEjercicio(rutina_id=rutina.id, ejercicio_id=ej.id, orden=orden))
        db.commit()
        creadas.append(rutina)

    return [_rutina_a_publica(r, db) for r in creadas]


@router.delete("/rutinas/{rutina_id}", status_code=status.HTTP_204_NO_CONTENT)
def borrar_rutina(
    rutina_id: int,
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    rutina = db.query(Rutina).filter(
        Rutina.id == rutina_id, Rutina.usuario_id == usuario.id
    ).first()
    if not rutina:
        raise HTTPException(status_code=404, detail="Rutina no encontrada")

    # Desvinculamos las sesiones que referencian esta rutina antes de borrarla.
    # El campo rutina_id es nullable, así que se puede poner a NULL sin perder
    # los registros históricos del entrenamiento.
    db.query(Sesion).filter(Sesion.rutina_id == rutina_id).update({"rutina_id": None})

    # Borramos los ejercicios de la rutina y la rutina en sí.
    db.query(RutinaEjercicio).filter(RutinaEjercicio.rutina_id == rutina_id).delete()
    db.delete(rutina)
    db.commit()


@router.put("/rutinas/{rutina_id}", response_model=RutinaPublica)
def actualizar_rutina(
    rutina_id: int,
    datos: RutinaActualizar,
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    rutina = db.query(Rutina).filter(
        Rutina.id == rutina_id, Rutina.usuario_id == usuario.id
    ).first()
    if not rutina:
        raise HTTPException(status_code=404, detail="Rutina no encontrada")
    if datos.nombre is not None:
        rutina.nombre = datos.nombre.strip()
    if datos.descripcion is not None:
        rutina.descripcion = datos.descripcion.strip() or None
    if datos.ejercicio_ids is not None:
        db.query(RutinaEjercicio).filter(RutinaEjercicio.rutina_id == rutina_id).delete()
        for orden, ej_id in enumerate(datos.ejercicio_ids):
            db.add(RutinaEjercicio(rutina_id=rutina_id, ejercicio_id=ej_id, orden=orden))
    db.commit()
    db.refresh(rutina)
    return _rutina_a_publica(rutina, db)


# ============================================================
#  SESIONES
# ============================================================
@router.post("/sesiones", response_model=SesionPublica, status_code=status.HTTP_201_CREATED)
def crear_sesion(
    datos: SesionCrear,
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    sesion = Sesion(usuario_id=usuario.id, rutina_id=datos.rutina_id)
    db.add(sesion)
    db.commit()
    db.refresh(sesion)
    return SesionPublica(
        id=sesion.id, rutina_id=sesion.rutina_id,
        fecha=sesion.fecha, finalizada=sesion.finalizada, series=[],
    )


def _obtener_sesion_propia(sesion_id: int, usuario: Usuario, db: Session) -> Sesion:
    sesion = db.query(Sesion).filter(
        Sesion.id == sesion_id, Sesion.usuario_id == usuario.id
    ).first()
    if not sesion:
        raise HTTPException(status_code=404, detail="Sesion no encontrada")
    return sesion


@router.get("/sesiones/{sesion_id}", response_model=SesionPublica)
def obtener_sesion(
    sesion_id: int,
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    sesion = _obtener_sesion_propia(sesion_id, usuario, db)
    series = db.query(SerieRegistro).filter(SerieRegistro.sesion_id == sesion_id).all()
    return SesionPublica(
        id=sesion.id, rutina_id=sesion.rutina_id, fecha=sesion.fecha,
        finalizada=sesion.finalizada,
        series=[SeriePublica.model_validate(s) for s in series],
    )


@router.put("/sesiones/{sesion_id}/finalizar", response_model=SesionPublica)
def finalizar_sesion(
    sesion_id: int,
    datos: SesionFinalizar | None = None,
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    sesion = _obtener_sesion_propia(sesion_id, usuario, db)
    sesion.finalizada = True
    if datos and datos.duracion_minutos is not None:
        sesion.duracion_minutos = datos.duracion_minutos
    db.commit()
    db.refresh(sesion)
    series = db.query(SerieRegistro).filter(SerieRegistro.sesion_id == sesion_id).all()
    return SesionPublica(
        id=sesion.id, rutina_id=sesion.rutina_id, fecha=sesion.fecha,
        finalizada=sesion.finalizada,
        series=[SeriePublica.model_validate(s) for s in series],
    )


@router.get("/historial", response_model=list[SesionHistorialPublica])
def obtener_historial(
    limite: int = 50,
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    sesiones = (
        db.query(Sesion)
        .filter(Sesion.usuario_id == usuario.id, Sesion.finalizada == True)
        .order_by(Sesion.fecha.desc())
        .limit(limite)
        .all()
    )
    resultado = []
    for s in sesiones:
        rutina_nombre = None
        if s.rutina_id:
            r = db.query(Rutina).filter(Rutina.id == s.rutina_id).first()
            if r:
                rutina_nombre = r.nombre

        series_all = db.query(SerieRegistro).filter(
            SerieRegistro.sesion_id == s.id,
            SerieRegistro.completada == True,
        ).all()

        ejercicios_map = defaultdict(list)
        for sr in series_all:
            ejercicios_map[sr.ejercicio_id].append(SerieHistorial(kg=sr.kg, reps=sr.reps))

        ejercicios = []
        for ej_id, series_list in ejercicios_map.items():
            ej = db.query(Ejercicio).filter(Ejercicio.id == ej_id).first()
            if ej:
                ejercicios.append(EjercicioHistorial(
                    ejercicio_id=ej_id,
                    nombre=ej.nombre,
                    grupo_muscular=ej.grupo_muscular,
                    series=series_list,
                ))

        dt = s.fecha.date() if hasattr(s.fecha, 'date') else s.fecha
        resultado.append(SesionHistorialPublica(
            id=s.id,
            fecha=str(dt),
            y=dt.year,
            m=dt.month - 1,
            d=dt.day,
            rutina_id=s.rutina_id,
            rutina_nombre=rutina_nombre,
            duracion_minutos=getattr(s, 'duracion_minutos', None),
            ejercicios=ejercicios,
        ))
    return resultado


@router.get("/estadisticas", response_model=Estadisticas)
def obtener_estadisticas(
    semanas: int = 12,
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    from sqlalchemy import func as sqlfunc

    hoy = date.today()
    inicio_periodo = hoy - timedelta(weeks=semanas)

    sesiones = (
        db.query(Sesion)
        .filter(
            Sesion.usuario_id == usuario.id,
            Sesion.finalizada == True,
            Sesion.fecha >= inicio_periodo,
        )
        .order_by(Sesion.fecha.asc())
        .all()
    )

    sesion_ids = [s.id for s in sesiones]

    series_todas = db.query(SerieRegistro).filter(
        SerieRegistro.sesion_id.in_(sesion_ids),
        SerieRegistro.completada == True,
    ).all() if sesion_ids else []

    # Volumen total
    volumen_total = int(sum(sr.kg * sr.reps for sr in series_todas))

    # Horas
    horas = sum(
        (getattr(s, 'duracion_minutos', None) or 0) for s in sesiones
    ) // 60

    # Racha actual
    fechas_sesion = sorted({s.fecha.date() if hasattr(s.fecha, 'date') else s.fecha for s in sesiones})
    racha = 0
    if fechas_sesion:
        cursor = hoy
        if cursor not in fechas_sesion:
            cursor = hoy - timedelta(days=1)
        while cursor in fechas_sesion:
            racha += 1
            cursor -= timedelta(days=1)

    # Volumen semanal (últimas N semanas)
    vol_semana = defaultdict(int)
    for sr in series_todas:
        s = next((x for x in sesiones if x.id == sr.sesion_id), None)
        if s:
            dt = s.fecha.date() if hasattr(s.fecha, 'date') else s.fecha
            semana_inicio = dt - timedelta(days=dt.weekday())
            vol_semana[semana_inicio] += int(sr.kg * sr.reps)

    semanas_ord = sorted(vol_semana.keys())[-semanas:]
    volumen_semanal = [
        VolumenSemanal(semana=f"S{i+1}", volumen=vol_semana[s])
        for i, s in enumerate(semanas_ord)
    ]

    # Reparto muscular
    COLORES_GRUPO = {
        "PECHO": "#ff5722", "ESPALDA": "#3b82f6", "HOMBROS": "#3ecf8e", "HOMBRO": "#3ecf8e",
        "BICEPS": "#facc15", "TRICEPS": "#f97316", "CUADRICEPS": "#a855f7",
        "ISQUIOS": "#9333ea", "GLUTEOS": "#ec4899", "GEMELOS": "#06b6d4",
        "ABDOMINALES": "#38bdf8", "FUNCIONAL": "#10b981", "TRAPECIO": "#14b8a6",
        "ANTEBRAZOS": "#84cc16",
    }
    grupo_series = defaultdict(int)
    for sr in series_todas:
        ej = db.query(Ejercicio).filter(Ejercicio.id == sr.ejercicio_id).first()
        if ej:
            grupo_series[ej.grupo_muscular] += 1

    reparto = [
        MusculoSeries(
            grupo=g,
            series=n,
            color=COLORES_GRUPO.get(g.upper(), "#6b7280"),
        )
        for g, n in sorted(grupo_series.items(), key=lambda x: -x[1])
    ][:8]

    # Récords por ejercicio (max kg en series completadas)
    records_raw = (
        db.query(
            SerieRegistro.ejercicio_id,
            sqlfunc.max(SerieRegistro.kg).label("kg_max"),
        )
        .filter(
            SerieRegistro.sesion_id.in_(sesion_ids),
            SerieRegistro.completada == True,
        )
        .group_by(SerieRegistro.ejercicio_id)
        .order_by(sqlfunc.max(SerieRegistro.kg).desc())
        .limit(8)
        .all()
    ) if sesion_ids else []

    records = []
    for rec in records_raw:
        ej = db.query(Ejercicio).filter(Ejercicio.id == rec.ejercicio_id).first()
        if ej:
            best_serie = (
                db.query(SerieRegistro)
                .filter(
                    SerieRegistro.sesion_id.in_(sesion_ids),
                    SerieRegistro.ejercicio_id == rec.ejercicio_id,
                    SerieRegistro.kg == rec.kg_max,
                    SerieRegistro.completada == True,
                )
                .first()
            )
            records.append(RecordEjercicio(
                ejercicio_id=ej.id,
                nombre=ej.nombre,
                grupo_muscular=ej.grupo_muscular,
                kg_max=rec.kg_max,
                reps_en_max=best_serie.reps if best_serie else 0,
            ))

    # Progresión de fuerza (ejercicios más entrenados, últimas sesiones)
    ej_conteo = defaultdict(int)
    for sr in series_todas:
        ej_conteo[sr.ejercicio_id] += 1

    top_ejercicios = sorted(ej_conteo.items(), key=lambda x: -x[1])[:6]
    progresion = []
    for ej_id, _ in top_ejercicios:
        ej = db.query(Ejercicio).filter(Ejercicio.id == ej_id).first()
        if not ej:
            continue
        series_ej = (
            db.query(SerieRegistro.sesion_id, sqlfunc.max(SerieRegistro.kg).label("kg_max"))
            .filter(
                SerieRegistro.sesion_id.in_(sesion_ids),
                SerieRegistro.ejercicio_id == ej_id,
                SerieRegistro.completada == True,
            )
            .group_by(SerieRegistro.sesion_id)
            .all()
        )
        historial = []
        for row in series_ej:
            s = next((x for x in sesiones if x.id == row.sesion_id), None)
            if s:
                dt = s.fecha.date() if hasattr(s.fecha, 'date') else s.fecha
                historial.append(PuntoProgresion(fecha=str(dt), kg_max=float(row.kg_max)))
        historial.sort(key=lambda x: x.fecha)
        if len(historial) >= 2:
            progresion.append(ProgesionEjercicio(
                ejercicio_id=ej_id,
                nombre=ej.nombre,
                grupo_muscular=ej.grupo_muscular,
                reps=5,
                historial=historial[-12:],
            ))

    return Estadisticas(
        resumen=EstadisticasResumen(
            volumen_total_kg=volumen_total,
            sesiones_totales=len(sesiones),
            racha_actual=racha,
            horas_total=int(horas),
        ),
        progresion_fuerza=progresion[:6],
        volumen_semanal=volumen_semanal,
        reparto_muscular=reparto,
        records=records,
    )


# ============================================================
#  SERIES (las filas de la tabla)
# ============================================================
@router.post("/sesiones/{sesion_id}/series", response_model=SeriePublica, status_code=201)
def crear_serie(
    sesion_id: int,
    datos: SerieCrear,
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    _obtener_sesion_propia(sesion_id, usuario, db)  # comprueba que es del usuario
    serie = SerieRegistro(
        sesion_id=sesion_id,
        ejercicio_id=datos.ejercicio_id,
        numero=datos.numero,
        kg=datos.kg,
        reps=datos.reps,
        rir=datos.rir,
        completada=datos.completada,
    )
    db.add(serie)
    db.commit()
    db.refresh(serie)
    return SeriePublica.model_validate(serie)


@router.put("/series/{serie_id}", response_model=SeriePublica)
def actualizar_serie(
    serie_id: int,
    datos: SerieActualizar,
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    serie = db.query(SerieRegistro).filter(SerieRegistro.id == serie_id).first()
    if not serie:
        raise HTTPException(status_code=404, detail="Serie no encontrada")
    # Comprobamos que la serie pertenece a una sesion del usuario.
    _obtener_sesion_propia(serie.sesion_id, usuario, db)

    # Actualizamos solo los campos que llegaron (no None).
    if datos.kg is not None:
        serie.kg = datos.kg
    if datos.reps is not None:
        serie.reps = datos.reps
    if datos.rir is not None:
        serie.rir = datos.rir
    if datos.completada is not None:
        serie.completada = datos.completada
    db.commit()
    db.refresh(serie)
    return SeriePublica.model_validate(serie)


@router.delete("/series/{serie_id}", status_code=status.HTTP_204_NO_CONTENT)
def borrar_serie(
    serie_id: int,
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    serie = db.query(SerieRegistro).filter(SerieRegistro.id == serie_id).first()
    if not serie:
        raise HTTPException(status_code=404, detail="Serie no encontrada")
    _obtener_sesion_propia(serie.sesion_id, usuario, db)
    db.delete(serie)
    db.commit()


# ============================================================
#  COMPARACION: que hiciste antes en un ejercicio
# ============================================================
@router.get("/ejercicios/{ejercicio_id}/anterior", response_model=EjercicioAnterior)
def rendimiento_anterior(
    ejercicio_id: int,
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    # Peso maximo que el usuario ha levantado en ese ejercicio (en sesiones finalizadas).
    max_kg = (
        db.query(func.max(SerieRegistro.kg))
        .join(Sesion, Sesion.id == SerieRegistro.sesion_id)
        .filter(
            Sesion.usuario_id == usuario.id,
            Sesion.finalizada == True,  # noqa: E712
            SerieRegistro.ejercicio_id == ejercicio_id,
        )
        .scalar()
    )

    # Ultima sesion finalizada del usuario que contenga ese ejercicio.
    ultima = (
        db.query(Sesion)
        .join(SerieRegistro, SerieRegistro.sesion_id == Sesion.id)
        .filter(
            Sesion.usuario_id == usuario.id,
            Sesion.finalizada == True,  # noqa: E712
            SerieRegistro.ejercicio_id == ejercicio_id,
        )
        .order_by(Sesion.fecha.desc())
        .first()
    )

    series_anteriores = []
    if ultima:
        filas = (
            db.query(SerieRegistro)
            .filter(
                SerieRegistro.sesion_id == ultima.id,
                SerieRegistro.ejercicio_id == ejercicio_id,
            )
            .order_by(SerieRegistro.numero)
            .all()
        )
        series_anteriores = [SerieAnterior(kg=f.kg, reps=f.reps) for f in filas]

    return EjercicioAnterior(
        ejercicio_id=ejercicio_id,
        max_kg=max_kg,
        series=series_anteriores,
    )
