// Punto de entrada del backend del traductor LSC.
// El endpoint POST /traducir se implementará en el paso 2.
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

// Endpoint de verificación para comprobar que el servidor está vivo
app.get('/salud', (req, res) => {
  res.json({ estado: 'ok', servicio: 'traduccion-lsc-backend' });
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
