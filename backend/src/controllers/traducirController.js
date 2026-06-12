import { traducir } from '../services/traductor.js';
import { transcribirAudio, ErrorTranscripcion } from '../services/whisper.js';

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

// POST /traducir/audio — recibe un archivo de audio, lo transcribe con Whisper
// y devuelve la traducción a señas del texto reconocido
export async function traducirAudio(req, res) {
  if (!req.file) {
    return res.status(400).json({
      error: 'Debes enviar un archivo de audio en el campo "audio".',
    });
  }

  try {
    const texto = await transcribirAudio(
      req.file.buffer,
      req.file.originalname || 'grabacion.webm',
      req.file.mimetype,
    );

    if (!texto) {
      return res.status(422).json({
        error: 'No se reconoció ninguna palabra en el audio. Intenta hablar más cerca del micrófono.',
      });
    }

    return res.json({ textoTranscrito: texto, ...traducir(texto) });
  } catch (error) {
    if (error instanceof ErrorTranscripcion) {
      return res.status(error.estadoHttp).json({ error: error.message });
    }
    console.error('Error inesperado al transcribir audio:', error);
    return res.status(500).json({ error: 'Error interno al procesar el audio.' });
  }
}
