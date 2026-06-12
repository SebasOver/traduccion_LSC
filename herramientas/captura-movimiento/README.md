# Captura de movimiento para las señas (video → animación)

Pipeline para producir los clips de animación del avatar **sin animar a mano**:
se graba a una persona haciendo cada seña y se extrae su esqueleto del video.

```
Video de la seña (cámara normal)
        │  extraer_keypoints.py (MediaPipe Holistic)
        ▼
JSON de keypoints (cuerpo + manos, suavizado)
        │  importar_en_blender.py (dentro de Blender)
        ▼
Acción de Blender sobre el esqueleto del avatar
        │  retoque manual (sobre todo dedos) + exportar glTF
        ▼
frontend/public/modelos/avatar.glb con el clip LSC_xxx
```

## Requisitos

- Python 3.9–3.11 (MediaPipe no siempre soporta la última versión)
- `pip install -r requirements.txt`
- Blender 3.x o 4.x para la importación y la exportación a glTF

## Paso a paso para una seña

1. **Grabar el video**: cámara fija y frontal, de la cintura hacia arriba,
   buena luz, fondo liso. Ideal: imitar la seña del diccionario del INSOR o,
   mejor, grabar a una persona señante de LSC.

2. **Extraer keypoints**:

   ```bash
   python extraer_keypoints.py videos/hola.mp4 --salida hola.json
   ```

3. **Importar en Blender**: abrir el .blend del avatar, pestaña *Scripting*,
   abrir `importar_en_blender.py`, ajustar `RUTA_JSON`, `NOMBRE_ACCION`
   (debe ser el ID del diccionario, ej. `LSC_hola`) y el mapa `HUESOS` con los
   nombres de los huesos de tu esqueleto, y ejecutar.

4. **Retocar**: la detección de brazos es buena; la de dedos es la menos
   fiable. Posar las configuraciones de la mano a mano en 2-3 fotogramas clave
   suele bastar.

5. **Exportar**: File → Export → glTF 2.0 hacia
   `frontend/public/modelos/avatar.glb`, con la casilla *Animation* activada.
   Verificar que el nombre de la acción coincide con el ID del diccionario.

6. **Actualizar el diccionario**: poner la duración real del clip en
   `backend/src/data/diccionario_lsc.json` y cambiar `<Avatar3D />` por
   `<AvatarGLTF />` en `EscenaAvatar.jsx` (solo la primera vez).

## Notas

- `extraer_keypoints.py` aplica un suavizado exponencial (`--alfa`, 0-1) para
  reducir el temblor de la detección.
- Mientras no existan los clips reales, el frontend ya reproduce poses
  aproximadas definidas en `frontend/src/data/posesLsc.js` (señas principales)
  y gestos procedurales (el resto), así que la demo funciona de extremo a
  extremo sin este pipeline.
