// Cliente HTTP hacia el backend. Las rutas /api/* se redirigen al backend
// mediante el proxy configurado en vite.config.js.
export async function traducirTexto(texto) {
  const respuesta = await fetch('/api/traducir', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texto }),
  });

  const datos = await respuesta.json().catch(() => null);

  if (!respuesta.ok) {
    throw new Error(datos?.error ?? `Error del servidor (${respuesta.status})`);
  }

  return datos;
}
