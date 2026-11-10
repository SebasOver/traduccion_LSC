# Traductor LSC — Texto y voz a Lengua de Señas Colombiana

Prototipo web que recibe una frase en español, escrita o dictada, y la muestra
como una secuencia de señas de Lengua de Señas Colombiana (LSC) en un avatar 3D.
El vocabulario está acotado al aula de matemáticas. Proyecto de tesis.

**Es un prototipo experimental.** Ninguna seña ha sido revisada por una persona
sorda ni por un intérprete certificado, y el motor no reordena la frase: la
salida es una secuencia de glosas en el orden del español, no una traducción
validada a LSC.

## Arquitectura

```
Navegador (React + Vite + Three.js)
  ├── Texto escrito ───────────────┐
  ├── Voz: Web Speech API ─────────┤──► POST /api/traducir ──► motor (traductor.js)
  └── Voz sin Web Speech API ──────────► POST /api/traducir/audio ──► Whisper ──► motor
                                                                        │
  Avatar (avatar.glb) ◄── secuencia JSON (glosa, animación, duración) ◄─┘

Servidor (Node.js + Express): API bajo /api y, en producción, frontend/dist
```

## Estructura del proyecto

```
traduccion_LSC/
├── backend/
│   ├── scripts/
│   │   ├── duraciones-clips.js         # lee la duración de cada clip de avatar.glb
│   │   └── sincronizar-duraciones.js   # copia esas duraciones al vocabulario
│   ├── src/
│   │   ├── index.js                    # servidor Express
│   │   ├── routes/                     # traducir.js, diccionario.js
│   │   ├── controllers/                # traducirController.js
│   │   ├── services/                   # traductor.js (motor), whisper.js, pruebas
│   │   └── data/                       # diccionario_lsc.json, alfabeto_dactilologico.json,
│   │                                   # vocabulario.test.js
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── public/modelos/avatar.glb       # avatar con todos los clips
│   ├── src/
│   │   ├── pages/                      # Inicio, Traducir, Explorar, Configuracion
│   │   ├── components/                 # EscenaAvatar, AvatarGLTF, PanelTraduccion,
│   │   │                               # LineaTiempoSenas, Layout, Iconos…
│   │   ├── hooks/                      # useReproductorSenas, useReconocimientoVoz,
│   │   │                               # useGrabadorAudio
│   │   ├── services/api.js             # cliente HTTP
│   │   ├── App.jsx, main.jsx, index.css
│   ├── vite.config.js
│   └── package.json
├── herramientas/captura-movimiento/    # video → MediaPipe → Blender (ver su README)
├── render.yaml
└── README.md
```

`frontend/src/components/Avatar3D.jsx` y `frontend/src/data/posesLsc.js` son de
la primera versión (un muñeco articulado con poses escritas a mano). La
aplicación ya no los usa: el avatar que se ve es `AvatarGLTF.jsx` con
`avatar.glb`.

## Requisitos

- Node.js 18 o superior y npm.
- Para producir señas nuevas: Python 3.9–3.11 y Blender (ver
  `herramientas/captura-movimiento/README.md`).

## Puesta en marcha (desarrollo)

```bash
cd backend
cp .env.example .env   # opcional; ver "Variables de entorno"
npm install
npm run dev            # http://localhost:3001
```

```bash
cd frontend
npm install
npm run dev            # http://localhost:5173
```

El frontend redirige al backend las peticiones que empiezan por `/api`
(`vite.config.js`), así que los dos deben estar corriendo.

### Variables de entorno (`backend/.env`)

| Variable | Para qué sirve | ¿Obligatoria? | Si falta |
|---|---|---|---|
| `PORT` | Puerto del servidor | No | Usa 3001 |
| `FRONTEND_URL` | Origen permitido por CORS en desarrollo | No | Usa `http://localhost:5173` |
| `OPENAI_API_KEY` | Clave para transcribir con Whisper | No | `/api/traducir/audio` responde 503; el texto y la voz del navegador siguen funcionando |

La clave de OpenAI se lee solo en el servidor. No va en el repositorio (`.env`
está en `.gitignore`) ni en el código del frontend. En Render se pone en el
panel del servicio.

### Pruebas

```bash
cd backend
npm test
```

29 pruebas con Vitest. 27 cubren el motor (`src/services/traductor.test.js`):
búsqueda en el diccionario, palabras funcionales, expresiones de varias
palabras, cifras, operadores contextuales, deletreo, frases completas y el
listado para Explorar. Las otras 2 (`src/data/vocabulario.test.js`) comprueban
que cada seña y cada letra tenga su clip en `avatar.glb` y que la duración
anotada sea la del clip.

Si se vuelve a exportar `avatar.glb` desde Blender, hay que igualar las
duraciones del vocabulario con las de los clips:

```bash
cd backend
npm run sincronizar-duraciones
npm test
```

## API

| Método y ruta | Entrada | Respuesta |
|---|---|---|
| `GET /api/salud` | — | `{"estado":"ok","servicio":"traduccion-lsc-backend"}` |
| `POST /api/traducir` | JSON `{ "texto": "…" }`, hasta 1000 caracteres | `textoOriginal`, `glosas`, `resultado`, `secuencia` |
| `POST /api/traducir/audio` | multipart, campo `audio`, hasta 25 MB | lo anterior más `textoTranscrito` |
| `GET /api/diccionario` | — | `categorias`, `senas` (76), `letras` (27) |

```bash
curl -X POST http://localhost:3001/api/traducir \
  -H 'Content-Type: application/json' \
  -d '{"texto": "Hola Ana, ¿cuánto es 7 por 8?"}'
```

Respuesta (se abrevia el arreglo `resultado`):

```json
{
  "textoOriginal": "Hola Ana, ¿cuánto es 7 por 8?",
  "glosas": "HOLA A N A CUÁNTO SIETE MULTIPLICAR OCHO",
  "resultado": [
    { "palabra": "Hola", "estado": "traducida", "glosa": "HOLA",
      "animacion": "LSC_hola", "duracion": 2.75 },
    { "palabra": "A", "estado": "deletreada", "glosa": "A",
      "animacion": "LSC_letra_a", "duracion": 1.09, "enfoqueManos": true },
    { "palabra": "es", "estado": "omitida" }
  ],
  "secuencia": [
    { "glosa": "HOLA", "animacion": "LSC_hola", "duracion": 2.75 },
    { "glosa": "A", "animacion": "LSC_letra_a", "duracion": 1.09, "enfoqueManos": true }
  ]
}
```

Estados de cada palabra:

- `traducida`: tiene entrada en el diccionario (se ignoran mayúsculas y tildes,
  y se prueban plurales simples y sinónimos).
- `omitida`: palabra funcional (artículos, preposiciones…). Omitirla es una
  regla de este prototipo, no una afirmación sobre la gramática de la LSC.
- `deletreada`: no está en el diccionario y se deletrea con el alfabeto
  dactilológico, una letra por seña. Las tildes se quitan: "Andrés" → A N D R E S.
- `desconocida`: no tiene ninguna letra que se pueda deletrear.

Errores (todos con cuerpo `{ "error": "mensaje" }`, que el frontend muestra tal cual):

| Ruta | Código | Cuándo |
|---|---|---|
| `/api/traducir` | 400 | Falta `texto`, está vacío o supera 1000 caracteres |
| `/api/traducir/audio` | 400 | No llegó un archivo de audio, o supera 25 MB |
| `/api/traducir/audio` | 422 | Whisper no reconoció ninguna palabra |
| `/api/traducir/audio` | 503 | Falta `OPENAI_API_KEY` o la clave no es válida |
| `/api/traducir/audio` | 502 | Whisper respondió con otro error |
| `/api/traducir/audio` | 500 | Error inesperado del servidor |

## Reconocimiento de voz

El botón «Hablar» usa dos vías:

1. **Web Speech API del navegador** (Chrome, Edge, Chrome en Android): sin
   clave ni costo, con el texto apareciendo mientras se habla (`lang: es-CO`).
   El navegador envía el audio a su propio servicio de reconocimiento; la
   aplicación no lo recibe.
2. **Whisper en el servidor** (Firefox y navegadores sin Web Speech API): el
   audio se graba con MediaRecorder y se envía a `POST /api/traducir/audio`,
   que lo reenvía a la API de OpenAI. Necesita `OPENAI_API_KEY`.

En los dos casos el navegador pide permiso de micrófono, y solo lo concede en
HTTPS o en localhost.

## Vocabulario

`backend/src/data/diccionario_lsc.json` tiene 76 entradas en 6 categorías:

- `saludos_cortesia` (10), `interaccion_aula` (27), `preguntas` (6),
  `academico_general` (10), `matematicas` (12), `numeros` (11, del cero al diez).

`backend/src/data/alfabeto_dactilologico.json` tiene las 27 letras (a–z y ñ).
Las vocales con tilde y la ü no tienen entrada propia: se deletrean con la
letra base.

Cada entrada guarda la glosa, el nombre del clip (`animacion`), la duración en
segundos, la categoría y los sinónimos. Reglas del motor:

- Expresiones de varias palabras como una sola entrada: "buenos días" →
  BUENOS-DÍAS, "hasta mañana" → ADIÓS.
- "qué" (con tilde) tiene seña; "que" se omite.
- Cifras: "5" → CINCO; mayores que 10, dígito a dígito ("25" → DOS CINCO).
- "por" y "entre" son MULTIPLICAR y DIVIDIR solo entre dos números.
- Lo que no está en el diccionario se deletrea.

### Agregar una palabra

1. Producir el clip y exportarlo en `avatar.glb` con el nombre `LSC_…`
   (`herramientas/captura-movimiento/README.md`).
2. Agregar la entrada al JSON con ese mismo nombre en `animacion`.
3. `npm run sincronizar-duraciones` (falla si el clip no existe en el avatar).
4. `npm test`: la prueba de consistencia confirma que el clip existe y que la
   duración coincide.

## Avatar y animaciones

`frontend/public/modelos/avatar.glb` contiene el avatar (MetaPerson) y sus
animaciones. De cada seña hay dos: la que usa la aplicación (`LSC_tarea`) y la
captura sin recortar (`LSC_tarea_mocap_original`), que se conserva como
respaldo. Más `LSC_reposo`, que se repite cuando no hay seña activa.

El paso de reposo a seña es un corte, no un fundido: al mezclar dos poses muy
distintas la mano atravesaba el torso. La velocidad elegida (0,75×, 1×, 1,5×)
se aplica al clip y al temporizador que pasa a la seña siguiente.

## Despliegue

Un único servicio: Express sirve la API bajo `/api` y, si existe
`frontend/dist`, también la aplicación compilada.

### Render

El repositorio incluye `render.yaml` (servicio `traduccion-lsc`, plan gratuito,
verificación en `/api/salud`).

1. En [render.com](https://render.com): New → Blueprint, y conectar el repositorio.
2. Render compila el frontend, instala el backend y arranca `node src/index.js`.
3. Opcional: agregar `OPENAI_API_KEY` en el panel del servicio.

El plan gratuito duerme el servicio tras unos 15 minutos sin tráfico; la
primera petición después tarda más.

### Modo producción en local

```bash
cd frontend && npm ci && npm run build
cd ../backend && npm ci && npm start     # http://localhost:3001
```

## Estado del prototipo

- [x] Motor de traducción por diccionario, con deletreo
- [x] Voz con la Web Speech API y Whisper de respaldo
- [x] Avatar MetaPerson con las 76 señas y las 27 letras capturadas
- [x] Páginas Inicio, Traducir, Explorar y Configuración
- [x] Duraciones del vocabulario iguales a las de los clips, con prueba que lo vigila
- [x] Despliegue en un solo servicio (`render.yaml`)
- [ ] Revisión de las señas por un intérprete y por personas sordas
- [ ] Orden de las glosas, expresión facial
