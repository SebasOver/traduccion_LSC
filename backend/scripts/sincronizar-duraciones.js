// Iguala el campo "duracion" de cada seña y de cada letra con la duración real
// de su clip en avatar.glb, para que el reproductor no corte ninguna seña ni
// deje al avatar quieto esperando.
//
// Uso (desde backend/):  npm run sincronizar-duraciones
// Hay que correrlo cada vez que se exporta de nuevo avatar.glb desde Blender.
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { leerDuracionesClips } from './duraciones-clips.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const carpetaDatos = path.join(__dirname, '..', 'src', 'data');
const clips = leerDuracionesClips();

// Se redondea hacia arriba a centésimas: nunca menos que el clip
const redondear = (segundos) => Math.ceil(segundos * 100 - 1e-6) / 100;

function sincronizar(nombreArchivo, clave) {
  const ruta = path.join(carpetaDatos, nombreArchivo);
  let texto = readFileSync(ruta, 'utf8');
  const datos = JSON.parse(texto);
  let cambiadas = 0;
  const sinClip = [];

  for (const [nombre, entrada] of Object.entries(datos[clave])) {
    const real = clips[entrada.animacion];
    if (real === undefined) {
      sinClip.push(`${nombre} → ${entrada.animacion}`);
      continue;
    }
    const nueva = redondear(real);
    if (entrada.duracion === nueva) continue;

    // Se cambia solo el número, sobre el texto, para no alterar el formato
    // del archivo ni ensuciar el historial de Git
    const patron = new RegExp(
      `("animacion":\\s*"${entrada.animacion}"[^}]*?"duracion":\\s*)[0-9.]+`,
    );
    if (!patron.test(texto)) {
      throw new Error(`No se pudo ubicar la duración de "${nombre}" en ${nombreArchivo}`);
    }
    texto = texto.replace(patron, `$1${nueva}`);
    cambiadas += 1;
  }

  writeFileSync(ruta, texto, 'utf8');
  console.log(`${nombreArchivo}: ${cambiadas} duraciones actualizadas`);
  return sinClip;
}

const faltantes = [
  ...sincronizar('diccionario_lsc.json', 'senas'),
  ...sincronizar('alfabeto_dactilologico.json', 'letras'),
];

if (faltantes.length > 0) {
  console.error('Entradas sin clip en avatar.glb:');
  faltantes.forEach((linea) => console.error(`  ${linea}`));
  process.exit(1);
}
