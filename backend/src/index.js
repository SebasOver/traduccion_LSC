// Punto de entrada del backend del traductor LSC.
// Toda la API vive bajo /api. En producción, si existe frontend/dist,
// este mismo servidor sirve la aplicación web (despliegue de un solo servicio).
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import traducirRouter from './routes/traducir.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

// Endpoint de verificación para comprobar que el servidor está vivo
app.get('/api/salud', (req, res) => {
  res.json({ estado: 'ok', servicio: 'traduccion-lsc-backend' });
});

// Traducción de texto/audio a secuencia de señas LSC
app.use('/api/traducir', traducirRouter);

// Errores de subida de archivos (ej. audio demasiado grande)
app.use((error, req, res, next) => {
  if (error?.name === 'MulterError') {
    return res.status(400).json({ error: `Error al recibir el audio: ${error.message}` });
  }
  return next(error);
});

// En producción se sirve el frontend compilado desde este mismo servidor
const rutaFrontend = path.join(__dirname, '..', '..', 'frontend', 'dist');
if (existsSync(rutaFrontend)) {
  app.use(express.static(rutaFrontend));
  app.get(/^\/(?!api\/).*/, (req, res) => {
    res.sendFile(path.join(rutaFrontend, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
