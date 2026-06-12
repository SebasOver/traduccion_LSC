// Transcripción de voz a texto usando Whisper a través de la API de OpenAI.
// Requiere OPENAI_API_KEY en el archivo .env.

export class ErrorTranscripcion extends Error {
  constructor(mensaje, estadoHttp = 500) {
    super(mensaje);
    this.estadoHttp = estadoHttp;
  }
}

export async function transcribirAudio(buffer, nombreArchivo, tipoMime) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new ErrorTranscripcion(
      'El reconocimiento de voz no está configurado: falta OPENAI_API_KEY en el archivo .env del backend.',
      503,
    );
  }

  const formulario = new FormData();
  formulario.append('file', new Blob([buffer], { type: tipoMime }), nombreArchivo);
  formulario.append('model', 'whisper-1');
  formulario.append('language', 'es');

  const respuesta = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formulario,
  });

  if (!respuesta.ok) {
    const detalle = await respuesta.json().catch(() => null);
    throw new ErrorTranscripcion(
      `Whisper no pudo transcribir el audio: ${detalle?.error?.message ?? respuesta.statusText}`,
      respuesta.status === 401 ? 503 : 502,
    );
  }

  const { text } = await respuesta.json();
  return text?.trim() ?? '';
}
