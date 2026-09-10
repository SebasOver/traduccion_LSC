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
from mathutils import Vector

# ----------------------------- Configuración -------------------------------
RUTA_JSON = "//hola.json"  # // = relativo al archivo .blend
NOMBRE_ARMATURE = "AvatarRoot"
NOMBRE_ACCION = "LSC_hola"
SALTO_FRAMES = 2  # 1 = todos los fotogramas; 2 = uno de cada dos (curvas más limpias)

TAMBIEN_CREAR_REPOSO = True
NOMBRE_REPOSO = "LSC_reposo"
FRAME_REPOSO = 0  # índice en datos["frames"]; 0 = primer fotograma del video

# Índices de los landmarks de pose de MediaPipe
LM = {
    "hombro_izq": 11, "hombro_der": 12,
    "codo_izq": 13, "codo_der": 14,
    "muneca_izq": 15, "muneca_der": 16,
}

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


def orientar_huesos_desde_frame(armature, frame_pose, matriz_inversa):
    """Aplica la pose de un fotograma de MediaPipe al pose_bone.matrix de cada
    hueso en HUESOS (sin insertar keyframes). Devuelve True si pudo orientar
    al menos un hueso.
    """
    aplicado = False
    for nombre_hueso, (origen, destino) in HUESOS.items():
        hueso = armature.pose.bones.get(nombre_hueso)
        if hueso is None:
            continue
        a = vector_mediapipe(frame_pose[LM[origen]])
        b = vector_mediapipe(frame_pose[LM[destino]])
        direccion = (matriz_inversa @ (b - a)).normalized()

        # En vez de calcular la rotación local a mano (fácil de hacer mal:
        # depende del roll del hueso, de la orientación de su padre, etc.),
        # se construye directamente la orientación deseada del hueso en el
        # espacio del armature y se le asigna a pose_bone.matrix — Blender
        # se encarga de convertirla a la rotación local correcta. Solo se
        # cambia la rotación: la posición (translation) se conserva tal
        # como está.
        matriz_actual = hueso.matrix.copy()
        rotacion = direccion.to_track_quat("Y", "Z")
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
    for indice, frame in enumerate(datos["frames"][::SALTO_FRAMES]):
        if frame["pose"] is None:
            continue
        fotograma_blender = 1 + int(indice * SALTO_FRAMES * fps_escena / fps_video)

        # Los huesos del brazo van antes que los del antebrazo en HUESOS: al
        # procesarlos en ese orden, cuando le toca al antebrazo ya se conoce
        # la posición real de su cabeza (depende de cómo quedó el brazo).
        orientar_huesos_desde_frame(armature, frame["pose"], matriz_inversa)
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

    orientar_huesos_desde_frame(armature, frames[indice]["pose"], matriz_inversa)
    # Pose estática: mismo valor en dos fotogramas, para que la acción tenga
    # un rango válido en vez de un solo instante
    for fotograma in (1, 10):
        for nombre_hueso in HUESOS:
            hueso = armature.pose.bones.get(nombre_hueso)
            if hueso is not None:
                hueso.keyframe_insert("rotation_quaternion", frame=fotograma)

    print(f"Acción '{NOMBRE_REPOSO}' creada a partir del fotograma {indice} del video (pose estática).")


def main():
    with open(bpy.path.abspath(RUTA_JSON), encoding="utf8") as archivo:
        datos = json.load(archivo)

    armature = bpy.data.objects[NOMBRE_ARMATURE]
    bpy.context.view_layer.objects.active = armature
    bpy.ops.object.mode_set(mode="POSE")

    # Vectores del video expresados en el espacio local del objeto Armature,
    # por si el avatar quedó rotado o escalado al importarlo
    matriz_inversa = armature.matrix_world.inverted().to_3x3()

    crear_animacion_sena(armature, datos, matriz_inversa)
    if TAMBIEN_CREAR_REPOSO:
        crear_pose_reposo(armature, datos, matriz_inversa)

    bpy.ops.object.mode_set(mode="OBJECT")
    print("Recuerda: en el Action Editor, 'Push Down' cada acción (LSC_hola y LSC_reposo, "
          "si se creó) a un strip de NLA antes de exportar — el exportador de glTF solo "
          "incluye la acción activa sin eso.")


main()
