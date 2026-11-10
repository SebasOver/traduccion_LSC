// Lee avatar.glb y devuelve la duración real (en segundos) de cada clip de
// animación. Sirve para dos cosas: sincronizar el campo "duracion" del
// diccionario (npm run sincronizar-duraciones) y comprobar en las pruebas que
// cada seña del diccionario tiene su clip en el avatar.
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const RUTA_AVATAR = path.join(
  __dirname, '..', '..', 'frontend', 'public', 'modelos', 'avatar.glb',
);

export function leerDuracionesClips(rutaGlb = RUTA_AVATAR) {
  const archivo = readFileSync(rutaGlb);
  if (archivo.toString('latin1', 0, 4) !== 'glTF') {
    throw new Error(`${rutaGlb} no es un archivo .glb válido`);
  }
  // El primer bloque de un .glb es el JSON que describe la escena
  const longitudJson = archivo.readUInt32LE(12);
  const gltf = JSON.parse(archivo.toString('utf8', 20, 20 + longitudJson));

  const duraciones = {};
  for (const animacion of gltf.animations ?? []) {
    let fin = 0;
    for (const muestreador of animacion.samplers) {
      // El accessor de tiempos trae en "max" el instante del último fotograma
      const maximo = gltf.accessors[muestreador.input].max?.[0] ?? 0;
      if (maximo > fin) fin = maximo;
    }
    duraciones[animacion.name] = fin;
  }
  return duraciones;
}
