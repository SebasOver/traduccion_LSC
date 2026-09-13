// Pruebas del motor de traducción (traductor.js). Se enfocan en el
// comportamiento observable de traducir(texto): qué glosas produce y con
// qué estado queda cada palabra, no en los detalles internos de cómo se
// calculan.
import { describe, it, expect } from 'vitest';
import { traducir } from './traductor.js';

function glosasDe(texto) {
  return traducir(texto).glosas;
}

function estadosDe(texto) {
  return traducir(texto).resultado.map((item) => item.estado);
}

describe('búsqueda básica en el diccionario', () => {
  it('traduce una palabra que está directamente en el diccionario', () => {
    const r = traducir('profesor');
    expect(r.glosas).toBe('PROFESOR');
    expect(r.resultado).toEqual([
      { palabra: 'profesor', estado: 'traducida', glosa: 'PROFESOR', animacion: 'LSC_profesor', duracion: 1.6 },
    ]);
  });

  it('encuentra la seña a través de un sinónimo', () => {
    expect(glosasDe('maestro')).toBe('PROFESOR');
    expect(glosasDe('parcial')).toBe('EXAMEN');
  });

  it('resuelve plurales simples contra la forma singular', () => {
    expect(glosasDe('estudiantes')).toBe('ESTUDIANTE');
    expect(glosasDe('profesores')).toBe('PROFESOR');
  });

  it('ignora mayúsculas y tildes al buscar', () => {
    expect(glosasDe('PROFESOR')).toBe('PROFESOR');
    expect(glosasDe('exámen')).toBe('EXAMEN'); // tilde de más, error común
  });
});

describe('palabras funcionales', () => {
  it('omite artículos y preposiciones comunes, sin señarlas', () => {
    const r = traducir('el profesor de la clase');
    expect(r.glosas).toBe('PROFESOR CLASE');
    expect(estadosDe('el profesor de la clase')).toEqual([
      'omitida', 'traducida', 'omitida', 'omitida', 'traducida',
    ]);
  });

  it('distingue "qué" (interrogativo, tiene seña) de "que" (conjunción, se omite)', () => {
    expect(glosasDe('qué')).toBe('QUÉ');
    expect(glosasDe('que')).toBe('');
    expect(estadosDe('que')).toEqual(['omitida']);
  });
});

describe('expresiones de varias palabras', () => {
  it('traduce una frase de dos palabras como una sola seña', () => {
    const r = traducir('buenos días');
    expect(r.glosas).toBe('BUENOS-DÍAS');
    expect(r.resultado).toHaveLength(1);
    expect(r.resultado[0].palabra).toBe('buenos días');
  });

  it('prefiere la frase más larga sobre una palabra suelta que también coincide', () => {
    // "hasta mañana" es sinónimo de adiós; "mañana" sola es otra seña distinta
    expect(glosasDe('hasta mañana')).toBe('ADIÓS');
    expect(glosasDe('mañana')).toBe('MAÑANA');
  });
});

describe('cifras numéricas', () => {
  it('traduce un dígito suelto a la seña del número', () => {
    expect(glosasDe('5')).toBe('CINCO');
    expect(glosasDe('0')).toBe('CERO');
  });

  it('traduce números de más de un dígito, dígito por dígito', () => {
    const r = traducir('25');
    expect(r.glosas).toBe('DOS CINCO');
    expect(r.secuencia).toHaveLength(2);
  });
});

describe('operadores contextuales entre números', () => {
  it('traduce "por" como MULTIPLICAR cuando está entre dos números', () => {
    expect(glosasDe('7 por 8')).toBe('SIETE MULTIPLICAR OCHO');
  });

  it('traduce "entre" como DIVIDIR cuando está entre dos números', () => {
    expect(glosasDe('10 entre 2')).toBe('DIEZ DIVIDIR DOS');
  });

  it('no reinterpreta "por" como operador fuera de un contexto numérico', () => {
    // "el tablero" no es un número, así que "por" se omite como preposición normal
    const r = traducir('Miren por el tablero');
    expect(r.glosas).toBe('MIRAR TABLERO');
    expect(r.resultado.find((item) => item.palabra === 'por').estado).toBe('omitida');
  });
});

describe('dactilología (deletreo)', () => {
  it('deletrea una palabra que no está en el diccionario', () => {
    const r = traducir('Andrés');
    expect(r.glosas).toBe('A N D R E S'); // sin tilde: el alfabeto no tiene letra acentuada
    expect(r.resultado).toHaveLength(6);
    expect(r.resultado.every((item) => item.estado === 'deletreada')).toBe(true);
  });

  it('preserva la ñ al deletrear', () => {
    expect(glosasDe('niño')).toBe('N I Ñ O');
  });

  it('incluye las letras deletreadas en la secuencia de animación', () => {
    const r = traducir('hola Andrés');
    expect(r.secuencia.map((s) => s.glosa)).toEqual(['HOLA', 'A', 'N', 'D', 'R', 'E', 'S']);
  });
});

describe('frases completas', () => {
  it('combina diccionario, omisión y dactilología en una sola frase', () => {
    const r = traducir('El profesor Andrés explica 7 por 8');
    expect(r.glosas).toBe('PROFESOR A N D R E S EXPLICAR SIETE MULTIPLICAR OCHO');
  });

  it('frase de ejemplo real de la app: saludo de clase', () => {
    expect(glosasDe('Buenos días estudiantes, bienvenidos a la clase de matemáticas'))
      .toBe('BUENOS-DÍAS ESTUDIANTE BIENVENIDO CLASE MATEMÁTICAS');
  });

  it('frase de ejemplo real de la app: pregunta de cierre', () => {
    expect(glosasDe('Muy bien, terminamos, hasta mañana'))
      .toBe('MUY-BIEN TERMINAR ADIÓS');
  });
});

describe('casos borde', () => {
  it('un texto vacío no produce ninguna seña', () => {
    const r = traducir('');
    expect(r.resultado).toEqual([]);
    expect(r.secuencia).toEqual([]);
    expect(r.glosas).toBe('');
  });

  it('conserva el texto original tal cual se recibió', () => {
    const r = traducir('  Hola   Profesor  ');
    expect(r.textoOriginal).toBe('  Hola   Profesor  ');
    expect(r.glosas).toBe('HOLA PROFESOR');
  });
});
