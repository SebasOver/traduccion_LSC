import { traducir } from '../services/traductor.js';

// POST /traducir — recibe { texto } y devuelve la secuencia de señas LSC
export function traducirTexto(req, res) {
  const { texto } = req.body ?? {};

  if (typeof texto !== 'string' || texto.trim() === '') {
    return res.status(400).json({
      error: 'Debes enviar un campo "texto" con el contenido a traducir.',
    });
  }

  if (texto.length > 1000) {
    return res.status(400).json({
      error: 'El texto no puede superar los 1000 caracteres.',
    });
  }

  return res.json(traducir(texto.trim()));
}
