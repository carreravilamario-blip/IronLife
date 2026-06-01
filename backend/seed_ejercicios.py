# ============================================================
#  Siembra del catálogo de ejercicios — ~120 ejercicios en español.
#  Ejecutar con:  python seed_ejercicios.py
#  Es idempotente: si un ejercicio ya existe, no lo duplica.
# ============================================================

from app.database import SessionLocal
from app.models import Ejercicio

# (nombre, grupo_muscular, equipo)
CATALOGO = [
    # ── PECHO ─────────────────────────────────────────────────
    ("Press banca plano con barra",           "PECHO",        "BARRA"),
    ("Press banca inclinado con barra",        "PECHO",        "BARRA"),
    ("Press banca declinado con barra",        "PECHO",        "BARRA"),
    ("Press plano con mancuernas",             "PECHO",        "MANCUERNAS"),
    ("Press inclinado mancuernas",             "PECHO",        "MANCUERNAS"),
    ("Aperturas con mancuernas",               "PECHO",        "MANCUERNAS"),
    ("Aperturas en polea (crossover)",         "PECHO",        "POLEA"),
    ("Fondos en paralelas (pecho)",            "PECHO",        "PESO CORPORAL"),
    ("Press en máquina (pecho)",               "PECHO",        "MAQUINA"),
    ("Pullover con mancuerna",                 "PECHO",        "MANCUERNAS"),

    # ── ESPALDA ───────────────────────────────────────────────
    ("Dominadas",                              "ESPALDA",      "PESO CORPORAL"),
    ("Dominadas supinas (chin-up)",            "ESPALDA",      "PESO CORPORAL"),
    ("Remo con barra",                         "ESPALDA",      "BARRA"),
    ("Remo con mancuerna",                     "ESPALDA",      "MANCUERNAS"),
    ("Jalón al pecho agarre ancho",            "ESPALDA",      "POLEA"),
    ("Jalón al pecho agarre estrecho",         "ESPALDA",      "POLEA"),
    ("Remo en polea baja",                     "ESPALDA",      "POLEA"),
    ("Pullover en polea alta",                 "ESPALDA",      "POLEA"),
    ("Face pull",                              "ESPALDA",      "POLEA"),
    ("Remo en máquina",                        "ESPALDA",      "MAQUINA"),
    ("Peso muerto convencional",               "ESPALDA",      "BARRA"),
    ("Hiperextensiones",                       "ESPALDA",      "PESO CORPORAL"),
    ("Remo con barra T",                       "ESPALDA",      "BARRA"),

    # ── HOMBROS ───────────────────────────────────────────────
    ("Press militar con barra",                "HOMBROS",      "BARRA"),
    ("Press militar con mancuernas",           "HOMBROS",      "MANCUERNAS"),
    ("Press Arnold",                           "HOMBROS",      "MANCUERNAS"),
    ("Elevaciones laterales con mancuernas",   "HOMBROS",      "MANCUERNAS"),
    ("Elevaciones frontales con mancuernas",   "HOMBROS",      "MANCUERNAS"),
    ("Elevaciones laterales en polea",         "HOMBROS",      "POLEA"),
    ("Pájaro (rear delt fly)",                 "HOMBROS",      "MANCUERNAS"),
    ("Press en máquina (hombros)",             "HOMBROS",      "MAQUINA"),
    ("Encogimientos de hombros con barra",     "HOMBROS",      "BARRA"),

    # ── BÍCEPS ────────────────────────────────────────────────
    ("Curl con barra",                         "BICEPS",       "BARRA"),
    ("Curl con barra EZ",                      "BICEPS",       "BARRA EZ"),
    ("Curl con mancuernas alterno",            "BICEPS",       "MANCUERNAS"),
    ("Curl martillo",                          "BICEPS",       "MANCUERNAS"),
    ("Curl concentrado",                       "BICEPS",       "MANCUERNAS"),
    ("Curl predicador con barra",              "BICEPS",       "BARRA"),
    ("Curl en polea baja",                     "BICEPS",       "POLEA"),
    ("Curl en máquina",                        "BICEPS",       "MAQUINA"),

    # ── TRÍCEPS ───────────────────────────────────────────────
    ("Extensión tríceps en polea alta",        "TRICEPS",      "POLEA"),
    ("Extensión tríceps en polea (cuerda)",    "TRICEPS",      "POLEA"),
    ("Press francés con barra",                "TRICEPS",      "BARRA"),
    ("Press francés con mancuernas",           "TRICEPS",      "MANCUERNAS"),
    ("Extensión de tríceps sobre la cabeza",   "TRICEPS",      "MANCUERNAS"),
    ("Fondos en banco (tríceps)",              "TRICEPS",      "PESO CORPORAL"),
    ("Press cerrado con barra",                "TRICEPS",      "BARRA"),
    ("Patada de tríceps con mancuerna",        "TRICEPS",      "MANCUERNAS"),

    # ── CUÁDRICEPS ────────────────────────────────────────────
    ("Sentadilla libre con barra",             "CUADRICEPS",   "BARRA"),
    ("Sentadilla frontal con barra",           "CUADRICEPS",   "BARRA"),
    ("Sentadilla búlgara (split squat)",       "CUADRICEPS",   "MANCUERNAS"),
    ("Prensa de piernas",                      "CUADRICEPS",   "MAQUINA"),
    ("Extensión de cuádriceps",                "CUADRICEPS",   "MAQUINA"),
    ("Hack squat",                             "CUADRICEPS",   "MAQUINA"),
    ("Zancada con mancuernas",                 "CUADRICEPS",   "MANCUERNAS"),
    ("Zancada con barra",                      "CUADRICEPS",   "BARRA"),
    ("Step up con mancuernas",                 "CUADRICEPS",   "MANCUERNAS"),

    # ── ISQUIOSURALES ─────────────────────────────────────────
    ("Peso muerto rumano",                     "ISQUIOS",      "BARRA"),
    ("Peso muerto sumo",                       "ISQUIOS",      "BARRA"),
    ("Curl femoral acostado",                  "ISQUIOS",      "MAQUINA"),
    ("Curl femoral sentado",                   "ISQUIOS",      "MAQUINA"),
    ("Buenos días con barra",                  "ISQUIOS",      "BARRA"),
    ("Peso muerto con mancuernas",             "ISQUIOS",      "MANCUERNAS"),

    # ── GLÚTEOS ───────────────────────────────────────────────
    ("Hip thrust con barra",                   "GLUTEOS",      "BARRA"),
    ("Glute bridge",                           "GLUTEOS",      "PESO CORPORAL"),
    ("Patada de glúteo en polea",              "GLUTEOS",      "POLEA"),
    ("Abducción de cadera en máquina",         "GLUTEOS",      "MAQUINA"),
    ("Hip thrust con mancuerna",               "GLUTEOS",      "MANCUERNAS"),
    ("Zancada inversa",                        "GLUTEOS",      "PESO CORPORAL"),

    # ── GEMELOS ───────────────────────────────────────────────
    ("Elevación de gemelos de pie",            "GEMELOS",      "MAQUINA"),
    ("Elevación de gemelos sentado",           "GEMELOS",      "MAQUINA"),
    ("Elevación de gemelos con barra",         "GEMELOS",      "BARRA"),
    ("Prensa de gemelos",                      "GEMELOS",      "MAQUINA"),

    # ── ABDOMINALES ───────────────────────────────────────────
    ("Crunch",                                 "ABDOMINALES",  "PESO CORPORAL"),
    ("Crunch en polea alta",                   "ABDOMINALES",  "POLEA"),
    ("Plancha (plank)",                        "ABDOMINALES",  "PESO CORPORAL"),
    ("Plancha lateral",                        "ABDOMINALES",  "PESO CORPORAL"),
    ("Elevación de piernas colgado",           "ABDOMINALES",  "PESO CORPORAL"),
    ("Rueda abdominal (ab wheel)",             "ABDOMINALES",  "OTRO"),
    ("Russian twist",                          "ABDOMINALES",  "PESO CORPORAL"),
    ("Bicycle crunch",                         "ABDOMINALES",  "PESO CORPORAL"),
    ("Mountain climbers",                      "ABDOMINALES",  "PESO CORPORAL"),
    ("Sit-up",                                 "ABDOMINALES",  "PESO CORPORAL"),
    ("Crunch en máquina",                      "ABDOMINALES",  "MAQUINA"),
    ("Dragon flag",                            "ABDOMINALES",  "PESO CORPORAL"),

    # ── TRAPECIO / CUELLO ─────────────────────────────────────
    ("Encogimientos con mancuernas",           "TRAPECIO",     "MANCUERNAS"),
    ("Remo al cuello con barra",               "TRAPECIO",     "BARRA"),
    ("Encogimientos en máquina",               "TRAPECIO",     "MAQUINA"),

    # ── ANTEBRAZOS ────────────────────────────────────────────
    ("Curl de muñeca con barra",               "ANTEBRAZOS",   "BARRA"),
    ("Extensión de muñeca con barra",          "ANTEBRAZOS",   "BARRA"),
    ("Curl de muñeca inverso",                 "ANTEBRAZOS",   "BARRA"),
    ("Agarre con pinza",                       "ANTEBRAZOS",   "DISCO"),

    # ── FUNCIONAL / KETTLEBELL ────────────────────────────────
    ("Kettlebell swing",                       "FUNCIONAL",    "KETTLEBELL"),
    ("Turkish get-up",                         "FUNCIONAL",    "KETTLEBELL"),
    ("Kettlebell press",                       "FUNCIONAL",    "KETTLEBELL"),
    ("Clean con barra",                        "FUNCIONAL",    "BARRA"),
    ("Snatch con barra",                       "FUNCIONAL",    "BARRA"),
    ("Thruster con mancuernas",                "FUNCIONAL",    "MANCUERNAS"),
]


def sembrar():
    db = SessionLocal()
    creados = 0
    try:
        for nombre, grupo, equipo in CATALOGO:
            existe = db.query(Ejercicio).filter(Ejercicio.nombre == nombre).first()
            if not existe:
                db.add(Ejercicio(nombre=nombre, grupo_muscular=grupo, equipo=equipo))
                creados += 1
        db.commit()
        total = db.query(Ejercicio).count()
        print(f"Catálogo sembrado. Nuevos: {creados}. Total en BD: {total}.")
    finally:
        db.close()


if __name__ == "__main__":
    sembrar()
