// Cliente HTTP hacia el backend. Las rutas /api/* se redirigen al backend
// mediante el proxy configurado en vite.config.js.

async function procesarRespuesta(respuesta) {
  const datos = await respuesta.json().catch(() => null);
  if (!respuesta.ok) {
    throw new Error(datos?.error ?? `Error del servidor (${respuesta.status})`);
  }
  return datos;
}

// fetch() lanza un TypeError genérico ("Failed to fetch") si no hay
// conexión con el servidor — no dice nada útil, así que se traduce a un
// mensaje que el usuario sí puede entender y accionar.
async function peticion(...argumentos) {
  try {
    return await fetch(...argumentos);
  } catch {
    throw new Error('No se pudo conectar con el servidor. Revisa tu conexión a internet e intenta de nuevo.');
  }
}

export async function traducirTexto(texto) {
  const respuesta = await peticion('/api/traducir', {
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

  const respuesta = await peticion('/api/traducir/audio', {
    method: 'POST',
    body: formulario,
  });
  return procesarRespuesta(respuesta);
}
