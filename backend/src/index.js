// Punto de entrada del backend del traductor LSC.
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import traducirRouter from './routes/traducir.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

// Endpoint de verificación para comprobar que el servidor está vivo
app.get('/salud', (req, res) => {
  res.json({ estado: 'ok', servicio: 'traduccion-lsc-backend' });
});

// Traducción de texto a secuencia de señas LSC
app.use('/traducir', traducirRouter);

// Errores de subida de archivos (ej. audio demasiado grande)
app.use((error, req, res, next) => {
  if (error?.name === 'MulterError') {
    return res.status(400).json({ error: `Error al recibir el audio: ${error.message}` });
  }
  return next(error);
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
