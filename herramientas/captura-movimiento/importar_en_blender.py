"""Importa keypoints de MediaPipe como animación de un esqueleto en Blender.

Se ejecuta DENTRO de Blender (pestaña Scripting → Open → Run Script) con el
avatar ya cargado en la escena. Lee el JSON generado por extraer_keypoints.py
y crea keyframes de rotación para los huesos de brazos y antebrazos a partir
de las direcciones hombro→codo y codo→muñeca.

Configuración: ajusta RUTA_JSON, NOMBRE_ARMATURE, NOMBRE_ACCION y el mapa
HUESOS según tu esqueleto. Los nombres por defecto son los del rig estándar
Mixamo SIN el prefijo "mixamorig:" (LeftArm, RightForeArm...), que es como
exporta sus avatares MetaPerson/Avatar SDK (el reemplazo de Ready Player Me,
cerrado en enero de 2026) — el objeto Armature en sí queda con el nombre
"AvatarRoot". mixamo.com sí usa el prefijo "mixamorig:", y un rig Rigify/MPFB
de MakeHuman usa nombres distintos (upper_arm.R, forearm.R, etc.) —
revísalos en el Outliner de Blender antes de ejecutar el script si tu fuente
es otra.

Flujo completo de una seña:
  1. python extraer_keypoints.py videos/hola.mp4 --salida hola.json
  2. En Blender: ajustar RUTA_JSON='hola.json', NOMBRE_ACCION='LSC_hola' y ejecutar.
  3. Retocar curvas si hace falta (Graph Editor) y, sobre todo, posar los dedos
     a mano en los fotogramas clave (la detección de dedos es la menos fiable).
  4. Guardar la acción con el nombre LSC_xxx y exportar todo a
     frontend/public/modelos/avatar.glb (formato glTF, con animaciones).

Además de la seña, el script también genera una pose de reposo estática
(LSC_reposo) tomada de un fotograma temprano del MISMO video — normalmente
el momento en que la persona está de pie, quieta, antes de empezar la seña.
Usar un fotograma real capturado es más confiable que posar el reposo a
mano: no hay riesgo de introducir torsiones raras en el brazo por rotar
con el mouse sin fijar un eje. Si tu video no empieza en una pose neutral,
pon TAMBIEN_CREAR_REPOSO = False y posa esa acción a mano en Blender.

Este script es un punto de partida funcional para brazos; cabeza y dedos se
pueden añadir siguiendo el mismo patrón con los landmarks de cara y manos.
"""

import json
import math

import bpy
from mathutils import Matrix, Vector

# ----------------------------- Configuración -------------------------------
RUTA_JSON = "//hola.json"  # // = relativo al archivo .blend
NOMBRE_ARMATURE = "AvatarRoot"
NOMBRE_ACCION = "LSC_hola"
SALTO_FRAMES = 2  # 1 = todos los fotogramas; 2 = uno de cada dos (curvas más limpias)

# Pon TAMBIEN_CREAR_SENA = False cuando RUTA_JSON apunte a un video dedicado
# solo a la pose de reposo (persona quieta, sin hacer ninguna seña) — así el
# script no intenta recrear NOMBRE_ACCION a partir de ese video.
TAMBIEN_CREAR_SENA = True
TAMBIEN_CREAR_REPOSO = True
NOMBRE_REPOSO = "LSC_reposo"
FRAME_REPOSO = 0  # índice en datos["frames"]; 0 = primer fotograma del video

# Qué tanto se mueve cada brazo desde la T-pose hacia la posición capturada
# (1.0 = 100%, el movimiento completo; 0.6 = solo 60% del camino). Bajarlo
# ayuda si ese lado se deforma feo al rotar tanto — es habitual que un solo
# lado del modelo tenga los pesos de piel mal pintados en el hombro, así
# que es normal necesitar un valor distinto para cada lado. Prueba varios
# valores (0.4, 0.6, 0.85...) hasta que se vea bien en tu modelo.
FACTOR_REPOSO_DERECHO = 1.0
FACTOR_REPOSO_IZQUIERDO = 0.6

# Índices de los landmarks de pose de MediaPipe
LM = {
    "hombro_izq": 11, "hombro_der": 12,
    "codo_izq": 13, "codo_der": 14,
    "muneca_izq": 15, "muneca_der": 16,
}

# Índices de landmarks de mano de MediaPipe Hands (21 puntos por mano)
LM_MANO = {"muneca": 0, "indice_base": 5, "menique_base": 17}

# Antebrazo → clave del diccionario de mano en el JSON, para usar la
# orientación real de la palma capturada como referencia de giro (roll)
MANO_PARA_HUESO = {"RightForeArm": "mano_derecha", "LeftForeArm": "mano_izquierda"}

# hueso de Blender → (landmark origen, landmark destino) cuya dirección lo orienta.
# Nombres del rig de MetaPerson/Avatar SDK (Mixamo estándar sin el prefijo
# "mixamorig:"). Si tu avatar viene de mixamo.com directamente, agrégales el
# prefijo (ej. "mixamorig:RightArm"). Para un rig Rigify/MPFB de MakeHuman,
# usar en su lugar algo como "upper_arm.R", "forearm.R", etc.
HUESOS = {
    "RightArm": ("hombro_der", "codo_der"),
    "RightForeArm": ("codo_der", "muneca_der"),
    "LeftArm": ("hombro_izq", "codo_izq"),
    "LeftForeArm": ("codo_izq", "muneca_izq"),
}
# ---------------------------------------------------------------------------


def vector_mediapipe(punto):
    """MediaPipe usa x→derecha, y→abajo, z→hacia la cámara; Blender usa Z arriba."""
    return Vector((punto[0], punto[2], -punto[1]))


def construir_rotacion(direccion, referencia):
    """Rotación que alinea el eje local Y del hueso con 'direccion', usando
    'referencia' para resolver el giro sobre su propio eje (roll).

    A diferencia de Vector.to_track_quat(), que siempre usa el eje Z del
    mundo como referencia para el roll, aquí 'referencia' puede ser
    cualquier vector — importante porque Z del mundo se vuelve una
    referencia degenerada quando el brazo cuelga casi vertical (como en la
    pose de reposo): con la dirección casi paralela a la referencia, el
    giro calculado se vuelve prácticamente aleatorio (por eso salían las
    palmas y los brazos mirando para atrás). Usar el vector hombro-a-hombro
    del propio video evita ese problema, porque casi nunca es paralelo a
    la dirección del brazo, esté arriba o abajo.
    """
    y_local = direccion.normalized()
    ref = referencia.normalized()
    if abs(y_local.dot(ref)) > 0.98:
        # Respaldo por si, en algún fotograma raro, sí queda casi paralela
        ref = Vector((0, 0, 1)) if abs(y_local.z) < 0.9 else Vector((1, 0, 0))
    x_local = y_local.cross(ref).normalized()
    z_local = x_local.cross(y_local).normalized()
    return Matrix((x_local, y_local, z_local)).transposed().to_quaternion()


def normal_palma(mano, matriz_inversa):
    """Vector normal a la palma (perpendicular al plano muñeca-índice-meñique),
    calculado a partir de los landmarks reales de la mano capturados por
    MediaPipe Hands. Devuelve None si esa mano no se detectó en este
    fotograma.

    Esto es lo que de verdad soluciona que una seña salga con la palma
    para el lado equivocado: MediaPipe Pose (hombro-codo-muñeca) solo da
    POSICIONES de articulación, nunca el giro del brazo sobre su propio
    eje — eso hay que inferirlo de algo más. Antes se usaba una referencia
    genérica del cuerpo (hombro-a-hombro), que es una aproximación robusta
    pero no necesariamente correcta para cada seña. La orientación real de
    la mano capturada sí lo es, cuando está disponible.
    """
    if mano is None:
        return None
    muneca = vector_mediapipe(mano[LM_MANO["muneca"]])
    indice = vector_mediapipe(mano[LM_MANO["indice_base"]])
    menique = vector_mediapipe(mano[LM_MANO["menique_base"]])
    normal = (matriz_inversa @ (indice - muneca)).cross(matriz_inversa @ (menique - muneca))
    if normal.length < 1e-6:
        return None
    return normal.normalized()


def orientar_huesos_desde_frame(armature, frame, matriz_inversa, factores=None, continuidad=None):
    """Aplica la pose de un fotograma de MediaPipe al pose_bone.matrix de cada
    hueso en HUESOS (sin insertar keyframes). Devuelve True si pudo orientar
    al menos un hueso.

    'factores' controla qué tanto se mueve cada hueso desde su orientación
    actual (normalmente la T-pose) hacia la orientación capturada: None o
    1.0 es el movimiento completo; un número entre 0 y 1 se queda a medio
    camino (útil si rotar el hueso del todo deforma mal la malla en esa
    zona); también puede ser un diccionario {nombre_hueso: factor} para
    controlar cada lado por separado. 'continuidad', si se pasa un
    diccionario vacío {}, se usa para evitar el "salto" de cuaternión entre
    fotogramas consecutivos: dos rotaciones iguales pueden calcularse con
    signo opuesto (q y -q representan la misma rotación), y si eso pasa
    entre fotogramas consecutivos, Blender interpola por el camino
    equivocado — se ve como si la mano se teletransportara. Se corrige
    invirtiendo el signo del cuaternión cuando haría que se alejara del
    anterior en vez de acercarse.
    """
    frame_pose = frame["pose"]
    hombro_izq = vector_mediapipe(frame_pose[LM["hombro_izq"]])
    hombro_der = vector_mediapipe(frame_pose[LM["hombro_der"]])
    referencia_cuerpo = (matriz_inversa @ (hombro_der - hombro_izq)).normalized()

    aplicado = False
    for nombre_hueso, (origen, destino) in HUESOS.items():
        hueso = armature.pose.bones.get(nombre_hueso)
        if hueso is None:
            continue
        a = vector_mediapipe(frame_pose[LM[origen]])
        b = vector_mediapipe(frame_pose[LM[destino]])
        direccion = (matriz_inversa @ (b - a)).normalized()

        # Para el antebrazo, la orientación real de la mano capturada es
        # mucho más confiable que la referencia genérica del cuerpo — solo
        # se usa esta última si esa mano no se detectó en este fotograma.
        referencia = referencia_cuerpo
        clave_mano = MANO_PARA_HUESO.get(nombre_hueso)
        if clave_mano is not None:
            referencia_mano = normal_palma(frame.get(clave_mano), matriz_inversa)
            if referencia_mano is not None:
                referencia = referencia_mano

        # En vez de calcular la rotación local a mano (fácil de hacer mal:
        # depende del roll del hueso, de la orientación de su padre, etc.),
        # se construye directamente la orientación deseada del hueso en el
        # espacio del armature y se le asigna a pose_bone.matrix — Blender
        # se encarga de convertirla a la rotación local correcta. Solo se
        # cambia la rotación: la posición (translation) se conserva tal
        # como está.
        matriz_actual = hueso.matrix.copy()
        rotacion = construir_rotacion(direccion, referencia)

        if factores is not None:
            factor = factores.get(nombre_hueso, 1.0) if isinstance(factores, dict) else factores
            if factor < 1.0:
                orientacion_actual = matriz_actual.to_quaternion()
                rotacion = orientacion_actual.slerp(rotacion, factor)

        if continuidad is not None:
            anterior = continuidad.get(nombre_hueso)
            if anterior is not None and rotacion.dot(anterior) < 0:
                rotacion = -rotacion
            continuidad[nombre_hueso] = rotacion.copy()

        matriz_deseada = rotacion.to_matrix().to_4x4()
        matriz_deseada.translation = matriz_actual.translation
        hueso.matrix = matriz_deseada
        bpy.context.view_layer.update()
        aplicado = True
    return aplicado


def crear_animacion_sena(armature, datos, matriz_inversa):
    for nombre_hueso in HUESOS:
        hueso = armature.pose.bones.get(nombre_hueso)
        if hueso is not None:
            hueso.rotation_mode = "QUATERNION"

    accion = bpy.data.actions.new(NOMBRE_ACCION)
    armature.animation_data_create()
    armature.animation_data.action = accion

    fps_video = datos["fps"]
    fps_escena = bpy.context.scene.render.fps

    fotogramas_con_clave = 0
    continuidad = {}  # persiste entre fotogramas: evita el salto q / -q
    for indice, frame in enumerate(datos["frames"][::SALTO_FRAMES]):
        if frame["pose"] is None:
            continue
        fotograma_blender = 1 + int(indice * SALTO_FRAMES * fps_escena / fps_video)

        # Los huesos del brazo van antes que los del antebrazo en HUESOS: al
        # procesarlos en ese orden, cuando le toca al antebrazo ya se conoce
        # la posición real de su cabeza (depende de cómo quedó el brazo).
        orientar_huesos_desde_frame(armature, frame, matriz_inversa, continuidad=continuidad)
        for nombre_hueso in HUESOS:
            hueso = armature.pose.bones.get(nombre_hueso)
            if hueso is not None:
                hueso.keyframe_insert("rotation_quaternion", frame=fotograma_blender)
        fotogramas_con_clave += 1

    print(f"Acción '{NOMBRE_ACCION}' creada con claves en {fotogramas_con_clave} fotogramas.")
    duracion = fotogramas_con_clave * SALTO_FRAMES / fps_video
    print(f"Duración aproximada: {duracion:.2f} s — recuerda actualizarla en diccionario_lsc.json")


def crear_pose_reposo(armature, datos, matriz_inversa):
    frames = datos["frames"]
    indice = FRAME_REPOSO
    while indice < len(frames) and frames[indice]["pose"] is None:
        indice += 1
    if indice >= len(frames):
        print(f"No se encontró ningún fotograma con pose detectada desde el índice {FRAME_REPOSO}; "
              f"no se creó '{NOMBRE_REPOSO}'.")
        return

    for nombre_hueso in HUESOS:
        hueso = armature.pose.bones.get(nombre_hueso)
        if hueso is not None:
            hueso.rotation_mode = "QUATERNION"

    accion = bpy.data.actions.new(NOMBRE_REPOSO)
    armature.animation_data_create()
    armature.animation_data.action = accion

    factores = {
        "RightArm": FACTOR_REPOSO_DERECHO, "RightForeArm": FACTOR_REPOSO_DERECHO,
        "LeftArm": FACTOR_REPOSO_IZQUIERDO, "LeftForeArm": FACTOR_REPOSO_IZQUIERDO,
    }
    orientar_huesos_desde_frame(armature, frames[indice], matriz_inversa, factores=factores)
    # Pose estática: mismo valor en dos fotogramas, para que la acción tenga
    # un rango válido en vez de un solo instante
    for fotograma in (1, 10):
        for nombre_hueso in HUESOS:
            hueso = armature.pose.bones.get(nombre_hueso)
            if hueso is not None:
                hueso.keyframe_insert("rotation_quaternion", frame=fotograma)

    print(f"Acción '{NOMBRE_REPOSO}' creada a partir del fotograma {indice} del video "
          f"(pose estática, factor derecho={FACTOR_REPOSO_DERECHO}, izquierdo={FACTOR_REPOSO_IZQUIERDO}).")


def main():
    with open(bpy.path.abspath(RUTA_JSON), encoding="utf8") as archivo:
        datos = json.load(archivo)

    armature = bpy.data.objects[NOMBRE_ARMATURE]
    bpy.context.view_layer.objects.active = armature
    bpy.ops.object.mode_set(mode="POSE")

    # Vectores del video expresados en el espacio local del objeto Armature,
    # por si el avatar quedó rotado o escalado al importarlo
    matriz_inversa = armature.matrix_world.inverted().to_3x3()

    if TAMBIEN_CREAR_SENA:
        crear_animacion_sena(armature, datos, matriz_inversa)
    if TAMBIEN_CREAR_REPOSO:
        crear_pose_reposo(armature, datos, matriz_inversa)

    bpy.ops.object.mode_set(mode="OBJECT")
    print("Recuerda: en el Action Editor, 'Push Down' cada acción (LSC_hola y LSC_reposo, "
          "si se creó) a un strip de NLA antes de exportar — el exportador de glTF solo "
          "incluye la acción activa sin eso.")


main()
