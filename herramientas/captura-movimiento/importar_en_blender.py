"""Importa keypoints de MediaPipe como animación de un esqueleto en Blender.

Se ejecuta DENTRO de Blender (pestaña Scripting → Open → Run Script) con el
avatar ya cargado en la escena. Lee el JSON generado por extraer_keypoints.py
y crea keyframes de rotación para los huesos de brazos y antebrazos a partir
de las direcciones hombro→codo y codo→muñeca.

Configuración: ajusta RUTA_JSON, NOMBRE_ARMATURE, NOMBRE_ACCION y el mapa
HUESOS según tu esqueleto (los nombres del ejemplo son los de Rigify /
Mixamo; en MakeHuman suelen ser upperarm01.R, lowerarm01.R, etc.).

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
NOMBRE_ARMATURE = "Armature"
NOMBRE_ACCION = "LSC_hola"
SALTO_FRAMES = 2  # 1 = todos los fotogramas; 2 = uno de cada dos (curvas más limpias)

# Índices de los landmarks de pose de MediaPipe
LM = {
    "hombro_izq": 11, "hombro_der": 12,
    "codo_izq": 13, "codo_der": 14,
    "muneca_izq": 15, "muneca_der": 16,
}

# hueso de Blender → (landmark origen, landmark destino) cuya dirección lo orienta
HUESOS = {
    "upper_arm.R": ("hombro_der", "codo_der"),
    "forearm.R": ("codo_der", "muneca_der"),
    "upper_arm.L": ("hombro_izq", "codo_izq"),
    "forearm.L": ("codo_izq", "muneca_izq"),
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

        for nombre_hueso, (origen, destino) in HUESOS.items():
            hueso = armature.pose.bones.get(nombre_hueso)
            if hueso is None:
                continue
            a = vector_mediapipe(frame["pose"][LM[origen]])
            b = vector_mediapipe(frame["pose"][LM[destino]])
            direccion = (b - a).normalized()

            # Orienta el eje del hueso (su eje Y local) hacia la dirección
            # capturada, expresada en el espacio del armature
            rotacion = direccion.to_track_quat("Y", "Z")
            hueso.rotation_mode = "QUATERNION"
            hueso.rotation_quaternion = (
                hueso.bone.matrix_local.to_3x3().inverted().to_quaternion() @ rotacion
            )
            hueso.keyframe_insert("rotation_quaternion", frame=fotograma_blender)
        fotogramas_con_clave += 1

    bpy.ops.object.mode_set(mode="OBJECT")
    print(f"Acción '{NOMBRE_ACCION}' creada con claves en {fotogramas_con_clave} fotogramas.")
    duracion = fotogramas_con_clave * SALTO_FRAMES / fps_video
    print(f"Duración aproximada: {duracion:.2f} s — recuerda actualizarla en diccionario_lsc.json")


main()
