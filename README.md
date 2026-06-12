# Traductor LSC — Texto y voz a Lengua de Señas Colombiana

Prototipo de aplicación web que traduce texto y audio en español a Lengua de
Señas Colombiana (LSC), representada mediante un avatar 3D animado.
Proyecto de tesis.

## Arquitectura

```
Texto / Audio ──► Backend (Node.js + Express)
                    ├── Whisper (audio → texto)
                    └── Diccionario LSC (texto → secuencia de animaciones)
                            │
                            ▼
                  Frontend (React + Three.js)
                    └── Avatar GLTF que reproduce las animaciones
```

## Estructura del proyecto

```
traduccion_LSC/
├── backend/                  # API REST (Node.js + Express)
│   ├── src/
│   │   ├── index.js          # Punto de entrada del servidor
│   │   ├── routes/           # Definición de rutas (ej. /traducir)
│   │   ├── controllers/      # Lógica de cada endpoint
│   │   ├── services/         # Traducción, Whisper, etc.
│   │   └── data/             # diccionario_lsc.json (palabra → animación)
│   ├── .env.example          # Plantilla de variables de entorno
│   └── package.json
├── frontend/                 # Interfaz web (React + Vite + Three.js)
│   ├── public/
│   │   ├── modelos/          # Modelos GLTF/GLB del avatar (MakeHuman/Blender)
│   │   └── animaciones/      # Clips de animación de las señas
│   ├── src/
│   │   ├── components/       # Avatar3D, panel de entrada, etc.
│   │   ├── services/         # Cliente HTTP hacia el backend
│   │   ├── hooks/            # Hooks reutilizables (audio, animaciones)
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── README.md
```

## Requisitos

- Node.js 18 o superior
- npm

## Puesta en marcha (desarrollo)

### Backend

```bash
cd backend
cp .env.example .env   # completar OPENAI_API_KEY cuando se integre Whisper
npm install
npm run dev            # http://localhost:3001
```

### Frontend

```bash
cd frontend
npm install
npm run dev            # http://localhost:5173
```

El frontend redirige las peticiones que empiezan por `/api` al backend
(configurado en `vite.config.js`), por lo que ambos deben estar corriendo.

## API

### `POST /traducir`

Recibe texto en español y devuelve la secuencia de señas LSC a reproducir.

```bash
curl -X POST http://localhost:3001/traducir \
  -H 'Content-Type: application/json' \
  -d '{"texto": "El profesor dejó una tarea"}'
```

Respuesta (resumida):

```json
{
  "textoOriginal": "El profesor dejó una tarea",
  "glosas": "PROFESOR TAREA",
  "resultado": [
    { "palabra": "El", "estado": "omitida" },
    { "palabra": "profesor", "estado": "traducida", "glosa": "PROFESOR",
      "animacion": "LSC_profesor", "duracion": 1.6 },
    { "palabra": "dejó", "estado": "desconocida" },
    { "palabra": "una", "estado": "omitida" },
    { "palabra": "tarea", "estado": "traducida", "glosa": "TAREA",
      "animacion": "LSC_tarea", "duracion": 1.5 }
  ],
  "secuencia": [
    { "glosa": "PROFESOR", "animacion": "LSC_profesor", "duracion": 1.6 },
    { "glosa": "TAREA", "animacion": "LSC_tarea", "duracion": 1.5 }
  ]
}
```

Estados posibles de cada palabra:

- `traducida`: existe una seña en el diccionario (búsqueda con normalización de
  tildes, plurales simples y sinónimos).
- `omitida`: palabra funcional (artículos, preposiciones…) que la LSC no seña.
- `desconocida`: sin entrada en el diccionario (a futuro: dactilología/deletreo).

### `POST /traducir/audio`

Recibe un archivo de audio (campo multipart `audio`, máx. 25 MB), lo transcribe
a texto con Whisper (API de OpenAI) y devuelve la misma estructura que
`POST /traducir` más el campo `textoTranscrito`. Requiere `OPENAI_API_KEY` en
el `.env` del backend; sin ella responde 503 con un mensaje explicativo.

```bash
curl -X POST http://localhost:3001/traducir/audio -F "audio=@grabacion.webm"
```

En el frontend, el botón «🎤 Hablar» graba desde el micrófono con la API
MediaRecorder del navegador y envía el audio a este endpoint al detener la
grabación. El navegador pedirá permiso de micrófono (requiere HTTPS o
localhost).

## Diccionario LSC

`backend/src/data/diccionario_lsc.json` define el vocabulario del prototipo,
**centrado en una clase de matemáticas básicas** (dominio acotado y fácil de
demostrar) más vocabulario académico general de aula. 36 señas en 3 categorías:

- `academico_general` (10): tarea, examen, profesor, estudiante, universidad,
  clase, estudiar, aprender, libro, pregunta.
- `matematicas` (15): matemáticas, número, sumar, restar, multiplicar, dividir,
  igual, resultado, problema, ejercicio, calcular, mitad, mayor, menor, cuánto.
- `numeros` (11): cero a diez.

Cada entrada define la glosa, el ID del clip de animación, su duración en
segundos, la categoría y los sinónimos/formas verbales que se traducen con la
misma seña ("parcial" → EXAMEN, "calculen" → CALCULAR). Las cifras escritas
con dígitos también se traducen: "5" → CINCO, y los números mayores a 10 se
señan dígito a dígito ("25" → DOS CINCO).

Ejemplo: «¿Cuánto es 2 más 3?» → `CUÁNTO DOS SUMAR TRES`.

Para ampliar el vocabulario solo hay que agregar entradas al JSON (y, cuando
exista el avatar real, exportar el clip de animación con el mismo ID).

## Avatar 3D

Mientras no exista el modelo definitivo, `Avatar3D.jsx` renderiza un avatar
placeholder hecho con primitivas que ejecuta un gesto procedural distinto por
cada ID de animación. Cuando el modelo de MakeHuman/Blender esté listo:

1. Exportarlo con sus clips de animación a `frontend/public/modelos/avatar.glb`
   (los clips deben llamarse igual que los IDs del diccionario, ej. `LSC_tarea`).
2. En `EscenaAvatar.jsx`, reemplazar `<Avatar3D />` por `<AvatarGLTF />`
   (componente ya preparado con `useGLTF` + `useAnimations`).

## Hoja de ruta del prototipo

- [x] Estructura inicial del proyecto
- [x] Endpoint `POST /traducir`: recibe texto y devuelve secuencia de IDs de animación
- [x] Diccionario LSC de ejemplo con vocabulario académico (10 palabras)
- [x] Frontend React + Three.js con avatar placeholder que reproduce la secuencia
- [x] Reconocimiento de voz con Whisper (audio → texto → señas)
- [ ] Reemplazar el placeholder por el avatar GLTF de MakeHuman/Blender
- [ ] Dactilología (deletreo) para palabras fuera del diccionario
