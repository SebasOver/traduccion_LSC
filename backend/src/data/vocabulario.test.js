// Comprueba que los datos del vocabulario y el avatar no se desincronicen:
// cada seña y cada letra debe tener su clip en avatar.glb, y la duración
// anotada debe ser la del clip (si no, el reproductor corta la seña o deja
// al avatar esperando). Si falla tras exportar el avatar desde Blender,
// correr: npm run sincronizar-duraciones
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { leerDuracionesClips } from '../../scripts/duraciones-clips.js';

const leer = (nombre) => JSON.parse(readFileSync(new URL(nombre, import.meta.url), 'utf8'));

const entradas = [
  ...Object.entries(leer('./diccionario_lsc.json').senas),
  ...Object.entries(leer('./alfabeto_dactilologico.json').letras),
];
const clips = leerDuracionesClips();

describe('vocabulario frente a avatar.glb', () => {
  it('cada seña y cada letra tiene su clip de animación en el avatar', () => {
    const sinClip = entradas
      .filter(([, entrada]) => clips[entrada.animacion] === undefined)
      .map(([nombre, entrada]) => `${nombre} → ${entrada.animacion}`);
    expect(sinClip).toEqual([]);
  });

  it('la duración anotada coincide con la del clip (±0,05 s)', () => {
    const desajustadas = entradas
      .filter(([, entrada]) => Math.abs(entrada.duracion - clips[entrada.animacion]) > 0.05)
      .map(([nombre, entrada]) => `${nombre}: ${entrada.duracion} s vs ${clips[entrada.animacion].toFixed(2)} s`);
    expect(desajustadas).toEqual([]);
  });
});
