"""Extrae el esqueleto (cuerpo + manos) de un video de una seña LSC.

Usa MediaPipe Holistic para obtener, por cada fotograma:
  - 33 puntos del cuerpo (pose), con coordenadas 3D aproximadas
  - 21 puntos por mano

El resultado se guarda como JSON para importarlo después en Blender con
importar_en_blender.py y convertirlo en un clip de animación del avatar.

Uso:
    pip install -r requirements.txt
    python extraer_keypoints.py video_sena.mp4 --salida LSC_hola.json

Consejos de grabación:
  - Cámara fija, frontal, de la cintura hacia arriba, buena iluminación.
  - Fondo liso y ropa que contraste con las manos.
  - Empezar y terminar en posición de reposo (facilita el recorte del clip).
"""

import argparse
import json
import sys

try:
    import cv2
    import mediapipe as mp
except ImportError:
    sys.exit("Faltan dependencias. Ejecuta: pip install -r requirements.txt")


def puntos(landmarks, con_visibilidad=False):
    """Convierte landmarks de MediaPipe a listas [x, y, z(, visibilidad)]."""
    if landmarks is None:
        return None
    if con_visibilidad:
        return [[p.x, p.y, p.z, p.visibility] for p in landmarks.landmark]
    return [[p.x, p.y, p.z] for p in landmarks.landmark]


def suavizar(frames, alfa=0.6):
    """Suavizado exponencial simple para reducir el temblor de la detección.

    alfa cercano a 1 = más fiel a la detección; cercano a 0 = más suave.
    """
    claves = ("pose", "mano_derecha", "mano_izquierda")
    anterior = {}
    for frame in frames:
        for clave in claves:
            actual = frame[clave]
            previo = anterior.get(clave)
            if actual is None or previo is None or len(previo) != len(actual):
                anterior[clave] = actual
                continue
            for i, punto in enumerate(actual):
                for j in range(3):
                    punto[j] = alfa * punto[j] + (1 - alfa) * previo[i][j]
            anterior[clave] = actual
    return frames


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("video", help="Ruta del video de la seña (mp4, webm…)")
    parser.add_argument("--salida", default=None, help="Archivo JSON de salida")
    parser.add_argument("--alfa", type=float, default=0.6, help="Factor de suavizado (0-1)")
    argumentos = parser.parse_args()

    salida = argumentos.salida or argumentos.video.rsplit(".", 1)[0] + ".json"

    captura = cv2.VideoCapture(argumentos.video)
    if not captura.isOpened():
        sys.exit(f"No se pudo abrir el video: {argumentos.video}")
    fps = captura.get(cv2.CAP_PROP_FPS) or 30

    holistic = mp.solutions.holistic.Holistic(
        model_complexity=1,
        smooth_landmarks=True,
        refine_face_landmarks=False,
    )

    frames = []
    while True:
        ok, imagen = captura.read()
        if not ok:
            break
        resultado = holistic.process(cv2.cvtColor(imagen, cv2.COLOR_BGR2RGB))
        frames.append({
            # pose_world_landmarks da coordenadas métricas centradas en la cadera,
            # mucho más útiles para retargeting que las normalizadas de pantalla
            "pose": puntos(resultado.pose_world_landmarks, con_visibilidad=True),
            "mano_derecha": puntos(resultado.right_hand_landmarks),
            "mano_izquierda": puntos(resultado.left_hand_landmarks),
        })
        if len(frames) % 30 == 0:
            print(f"  {len(frames)} fotogramas procesados…")

    holistic.close()
    captura.release()

    frames = suavizar(frames, argumentos.alfa)

    with open(salida, "w", encoding="utf8") as archivo:
        json.dump({"fps": fps, "total_frames": len(frames), "frames": frames}, archivo)

    detectados = sum(1 for f in frames if f["pose"])
    print(f"Listo: {salida}")
    print(f"  {len(frames)} fotogramas, pose detectada en {detectados} ({detectados * 100 // max(len(frames), 1)}%)")


if __name__ == "__main__":
    main()
