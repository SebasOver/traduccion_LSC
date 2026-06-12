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

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
