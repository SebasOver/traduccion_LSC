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
Acción de Blender sobre el esqueleto del avatar (brazos y, si se activa
TAMBIEN_ANIMAR_DEDOS, también los dedos)
        │  revisar/retocar + exportar glTF
        ▼
frontend/public/modelos/avatar.glb con el clip LSC_xxx
```

## Requisitos

- Python 3.9–3.11 (MediaPipe no siempre soporta la última versión)
- `pip install -r requirements.txt` — se fija `mediapipe==0.10.9` a propósito:
  versiones más nuevas (0.10.31+) tienen un bug conocido en Windows donde
  `mp.solutions` no carga (`AttributeError: module 'mediapipe' has no
  attribute 'solutions'`). Si ya tenías mediapipe instalado y te aparece ese
  error, corre `pip uninstall mediapipe -y && pip install mediapipe==0.10.9`.
- Blender 3.x o 4.x para la importación y la exportación a glTF
- Un avatar riguado en formato GLB. Ready Player Me cerró el 31 de enero de
  2026 (adquirido por Netflix); la alternativa recomendada es
  [MetaPerson / Avatar SDK](https://avatarsdk.com/metaperson-creator/)
  (primer avatar gratis, exporta GLB con rig compatible con Mixamo — mismos
  nombres de huesos que usa `importar_en_blender.py` por defecto). También
  sirve cualquier personaje de [mixamo.com](https://www.mixamo.com/) (gratis,
  ya riguado, sin personalización de apariencia).

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
   nombres de los huesos de tu esqueleto, y ejecutar. Con `TAMBIEN_CREAR_REPOSO
   = True` (por defecto), el script también genera una acción `LSC_reposo` a
   partir de un fotograma temprano del mismo video (normalmente el momento en
   que la persona está de pie, quieta, antes de iniciar la seña) — evita tener
   que posar el reposo a mano, lo cual es fácil de hacer mal (torsiones raras
   en el brazo por rotar sin fijar un eje). Solo hace falta generarla una vez;
   en señas posteriores pon `TAMBIEN_CREAR_REPOSO = False`.

   Si la seña depende de la forma de la mano (números, alfabeto
   dactilológico), pon además `TAMBIEN_ANIMAR_DEDOS = True` — anima también
   las falanges de cada dedo a partir de los 21 puntos por mano que ya
   captura `extraer_keypoints.py`. Antes esto no existía: el script solo
   movía brazo y antebrazo, y los dedos se posaban enteramente a mano.

4. **Revisar y retocar**: la detección de brazos es buena; la de dedos
   sigue siendo la menos fiable, incluso animada automáticamente. Revisa el
   resultado en el viewport y corrige a mano 1-2 fotogramas clave donde
   algún dedo haya quedado mal.

5. **Push Down a NLA**: en el Action Editor, con cada acción (`LSC_hola` y
   `LSC_reposo`) activa, usa *Push Down Action* (está en el menú "Action" de
   la barra del editor, o en el editor Nonlinear Animation) — el exportador
   de glTF solo incluye la acción activa a menos que esté en un strip de NLA.

6. **Exportar**: File → Export → glTF 2.0 hacia
   `frontend/public/modelos/avatar.glb`, con la casilla *Animation* activada.
   Verificar que el nombre de la acción coincide con el ID del diccionario.

7. **Confirmar la duración**: comparar la duración aproximada que imprime el
   script contra el campo `duracion` de esa seña en
   `backend/src/data/diccionario_lsc.json` (ya está puesta para todo el
   vocabulario actual; solo hace falta ajustarla si quedó notablemente
   distinta).

## Procesar varias señas de una sola corrida

Para un grupo de señas (por ejemplo, los 11 números) no hace falta repetir
los pasos 2, 3 y 5 una por una:

**Paso 2 (extracción), en lote** — un bucle de shell sobre todos los videos
(el `.json` queda junto al `.mp4`, no hace falta una carpeta aparte):

```bash
for video in videos/numeros/*.mp4; do
  python extraer_keypoints.py "$video" --salida "videos/numeros/$(basename "$video" .mp4).json"
done
```

**Paso 3 + 5 (Blender), en lote** — usa `LOTE` en vez de `RUTA_JSON`/
`NOMBRE_ACCION` en `importar_en_blender.py`: cada entrada se crea y se
empuja a su propio strip de NLA automáticamente (por API, sin pasar por el
Action Editor a mano), así que una sola ejecución del script deja listas
todas las señas del lote. `TAMBIEN_ANIMAR_DEDOS` aplica a todo el lote por
igual.

```python
TAMBIEN_ANIMAR_DEDOS = True  # los números dependen de la forma de la mano

LOTE = [
    {"json": "//videos/numeros/num_0.json", "accion": "LSC_num_0"},
    {"json": "//videos/numeros/num_1.json", "accion": "LSC_num_1"},
    # ... hasta num_10
]
```

Sigue haciendo falta revisar/retocar cada acción (paso 4) por separado
desde el Action Editor, y una sola exportación (paso 6) al final con todas
las acciones/pistas de NLA incluidas.

## Notas

- `extraer_keypoints.py` aplica un suavizado exponencial (`--alfa`, 0-1) para
  reducir el temblor de la detección.
- Mientras una seña no tenga su clip real en `avatar.glb`, el avatar
  simplemente se queda en la pose de reposo al traducirla — no hay ningún
  gesto de relleno; la glosa en texto sigue mostrándose igual.
