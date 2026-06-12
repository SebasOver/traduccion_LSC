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

## Hoja de ruta del prototipo

- [x] Estructura inicial del proyecto
- [ ] Endpoint `POST /traducir`: recibe texto y devuelve secuencia de IDs de animación
- [ ] Avatar GLTF en el frontend que reproduce las animaciones recibidas
- [ ] Diccionario LSC de ejemplo con vocabulario académico (10 palabras)
- [ ] Reconocimiento de voz con Whisper (audio → texto → señas)
