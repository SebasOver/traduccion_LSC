// Cliente HTTP hacia el backend. Las rutas /api/* se redirigen al backend
// mediante el proxy configurado en vite.config.js.

async function procesarRespuesta(respuesta) {
  const datos = await respuesta.json().catch(() => null);
  if (!respuesta.ok) {
    throw new Error(datos?.error ?? `Error del servidor (${respuesta.status})`);
  }
  return datos;
}

export async function traducirTexto(texto) {
  const respuesta = await fetch('/api/traducir', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texto }),
  });
  return procesarRespuesta(respuesta);
}

export async function traducirAudio(blobAudio) {
  const formulario = new FormData();
  const extension = blobAudio.type.includes('ogg') ? 'ogg' : 'webm';
  formulario.append('audio', blobAudio, `grabacion.${extension}`);

  const respuesta = await fetch('/api/traducir/audio', {
    method: 'POST',
    body: formulario,
  });
  return procesarRespuesta(respuesta);
}
