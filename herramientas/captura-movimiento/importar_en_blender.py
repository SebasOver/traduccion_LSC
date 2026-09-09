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


def main():
    with open(bpy.path.abspath(RUTA_JSON), encoding="utf8") as archivo:
        datos = json.load(archivo)

    armature = bpy.data.objects[NOMBRE_ARMATURE]
    bpy.context.view_layer.objects.active = armature
    bpy.ops.object.mode_set(mode="POSE")

    for nombre_hueso in HUESOS:
        hueso = armature.pose.bones.get(nombre_hueso)
        if hueso is not None:
            hueso.rotation_mode = "QUATERNION"

    accion = bpy.data.actions.new(NOMBRE_ACCION)
    armature.animation_data_create()
    armature.animation_data.action = accion

    # Vectores del video expresados en el espacio local del objeto Armature,
    # por si el avatar quedó rotado o escalado al importarlo
    matriz_inversa = armature.matrix_world.inverted().to_3x3()

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
        for nombre_hueso, (origen, destino) in HUESOS.items():
            hueso = armature.pose.bones.get(nombre_hueso)
            if hueso is None:
                continue
            a = vector_mediapipe(frame["pose"][LM[origen]])
            b = vector_mediapipe(frame["pose"][LM[destino]])
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

            hueso.keyframe_insert("rotation_quaternion", frame=fotograma_blender)
        fotogramas_con_clave += 1

    bpy.ops.object.mode_set(mode="OBJECT")
    print(f"Acción '{NOMBRE_ACCION}' creada con claves en {fotogramas_con_clave} fotogramas.")
    duracion = fotogramas_con_clave * SALTO_FRAMES / fps_video
    print(f"Duración aproximada: {duracion:.2f} s — recuerda actualizarla en diccionario_lsc.json")


main()
