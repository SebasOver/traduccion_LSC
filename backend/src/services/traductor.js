// Servicio de traducción: convierte texto en español a una secuencia de señas LSC
// usando el diccionario JSON. Estrategia del prototipo: mapeo palabra→seña con
// omisión de palabras funcionales (artículos, preposiciones), ya que la gramática
// de la LSC no las utiliza como el español.
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RUTA_DICCIONARIO = path.join(__dirname, '..', 'data', 'diccionario_lsc.json');

const diccionario = JSON.parse(readFileSync(RUTA_DICCIONARIO, 'utf8'));

// Palabras funcionales que se omiten en la traducción (la LSC no las seña)
const PALABRAS_OMITIDAS = new Set([
  'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
  'de', 'del', 'al', 'a', 'en', 'con', 'por', 'para',
  'y', 'o', 'u', 'e', 'que', 'se', 'su', 'sus', 'mi', 'mis', 'tu', 'tus',
  'es', 'son', 'esta', 'este', 'esto', 'hay',
]);

// Quita tildes/diéresis preservando la ñ ("exámen" → "examen", "señas" → "señas")
function normalizar(palabra) {
  return palabra
    .toLowerCase()
    .replaceAll('\u00f1', '\u0001')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replaceAll('\u0001', '\u00f1');
}

// Índice de búsqueda: palabra normalizada (incluyendo sinónimos) → entrada
const indice = new Map();
for (const [palabra, entrada] of Object.entries(diccionario.senas)) {
  indice.set(normalizar(palabra), { palabraBase: palabra, ...entrada });
  for (const sinonimo of entrada.sinonimos ?? []) {
    indice.set(normalizar(sinonimo), { palabraBase: palabra, ...entrada });
  }
}

// Busca una palabra probando también singulares simples ("tareas" → "tarea")
function buscarSena(palabraNormalizada) {
  const candidatas = [palabraNormalizada];
  if (palabraNormalizada.endsWith('es')) candidatas.push(palabraNormalizada.slice(0, -2));
  if (palabraNormalizada.endsWith('s')) candidatas.push(palabraNormalizada.slice(0, -1));
  for (const candidata of candidatas) {
    const entrada = indice.get(candidata);
    if (entrada) return entrada;
  }
  return null;
}

// Cifras escritas con dígitos: "5" se traduce como la seña de "cinco";
// los números mayores a 10 se señan dígito a dígito ("25" → DOS CINCO)
const PALABRA_DIGITO = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez'];

function traducirNumero(token, resultado) {
  const valor = Number(token);
  const digitos = valor >= 0 && valor <= 10 ? [valor] : [...token].map(Number);

  for (const digito of digitos) {
    const sena = buscarSena(PALABRA_DIGITO[digito]);
    resultado.push({
      palabra: digitos.length === 1 ? token : String(digito),
      estado: 'traducida',
      glosa: sena.glosa,
      animacion: sena.animacion,
      duracion: sena.duracion,
    });
  }
}

export function traducir(texto) {
  const tokens = texto.match(/[a-záéíóúüñ]+|[0-9]+/gi) ?? [];
  const resultado = [];

  for (const token of tokens) {
    if (/^[0-9]+$/.test(token)) {
      traducirNumero(token, resultado);
      continue;
    }

    const normalizada = normalizar(token);

    if (PALABRAS_OMITIDAS.has(normalizada)) {
      resultado.push({ palabra: token, estado: 'omitida' });
      continue;
    }

    const sena = buscarSena(normalizada);
    if (sena) {
      resultado.push({
        palabra: token,
        estado: 'traducida',
        glosa: sena.glosa,
        animacion: sena.animacion,
        duracion: sena.duracion,
      });
    } else {
      // Palabra fuera del diccionario: en el futuro se puede deletrear (dactilología)
      resultado.push({ palabra: token, estado: 'desconocida' });
    }
  }

  const secuencia = resultado
    .filter((item) => item.estado === 'traducida')
    .map(({ glosa, animacion, duracion }) => ({ glosa, animacion, duracion }));

  return {
    textoOriginal: texto,
    glosas: secuencia.map((s) => s.glosa).join(' '),
    resultado,
    secuencia,
  };
}
