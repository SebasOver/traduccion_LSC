// Servicio de traducción: convierte texto en español a una secuencia de señas LSC
// usando el diccionario JSON. Estrategia del prototipo: mapeo palabra→seña con
// soporte de expresiones de varias palabras ("buenos días" es UNA seña) y
// omisión de palabras funcionales (artículos, preposiciones), ya que la
// gramática de la LSC no las utiliza como el español.
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RUTA_DICCIONARIO = path.join(__dirname, '..', 'data', 'diccionario_lsc.json');

const diccionario = JSON.parse(readFileSync(RUTA_DICCIONARIO, 'utf8'));

// Palabras funcionales que se omiten en la traducción (la LSC no las seña).
// Se comparan en minúsculas pero CONSERVANDO tildes, para distinguir "que"
// (conjunción, se omite) de "qué" (interrogativo, que sí tiene seña).
const PALABRAS_OMITIDAS = new Set([
  'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
  'de', 'del', 'al', 'a', 'en', 'con', 'por', 'para', 'sobre', 'hasta',
  'y', 'o', 'u', 'e', 'que', 'se', 'su', 'sus', 'mi', 'mis', 'tu', 'tus',
  'le', 'les', 'lo', 'me', 'te', 'nos', 'muy', 'ya', 'tambien', 'también',
  'es', 'son', 'ser', 'estar', 'esta', 'está', 'estas', 'estás',
  'estan', 'están', 'estamos', 'estoy', 'eres', 'soy', 'somos',
  'este', 'esto', 'hay', 'va', 'van', 'vamos', 'voy',
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

// Índices de búsqueda construidos al arrancar:
// - indice: palabra normalizada (clave o sinónimo de una palabra) → entrada
// - frases: expresiones de varias palabras ("buenos días", "por qué") → entrada
const indice = new Map();
const frases = [];

function registrarTermino(termino, entrada) {
  const tokens = termino.trim().split(/\s+/).map(normalizar);
  if (tokens.length > 1) {
    frases.push({ tokens, entrada });
  } else {
    indice.set(tokens[0], entrada);
  }
}

for (const [palabra, entrada] of Object.entries(diccionario.senas)) {
  const datos = { palabraBase: palabra, ...entrada };
  registrarTermino(palabra, datos);
  for (const sinonimo of entrada.sinonimos ?? []) {
    registrarTermino(sinonimo, datos);
  }
}

// Las frases más largas primero, para que "hasta mañana" gane sobre "mañana"
frases.sort((a, b) => b.tokens.length - a.tokens.length);

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

function coincideFrase(tokensNormalizados, posicion) {
  for (const frase of frases) {
    if (posicion + frase.tokens.length > tokensNormalizados.length) continue;
    const coincide = frase.tokens.every(
      (token, j) => tokensNormalizados[posicion + j] === token,
    );
    if (coincide) return frase;
  }
  return null;
}

function aSena(palabra, sena) {
  return {
    palabra,
    estado: 'traducida',
    glosa: sena.glosa,
    animacion: sena.animacion,
    duracion: sena.duracion,
  };
}

// Cifras escritas con dígitos: "5" se traduce como la seña de "cinco";
// los números mayores a 10 se señan dígito a dígito ("25" → DOS CINCO)
const PALABRA_DIGITO = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez'];

function traducirNumero(token, resultado) {
  const valor = Number(token);
  const digitos = valor >= 0 && valor <= 10 ? [valor] : [...token].map(Number);

  for (const digito of digitos) {
    const sena = buscarSena(PALABRA_DIGITO[digito]);
    resultado.push(aSena(digitos.length === 1 ? token : String(digito), sena));
  }
}

// Operadores que en lenguaje de aula se dicen con preposiciones:
// "7 por 8" → MULTIPLICAR, "10 entre 2" → DIVIDIR. Solo aplican entre números;
// en cualquier otro contexto "por" y "entre" se tratan como palabras funcionales.
const OPERADORES_CONTEXTUALES = new Map([
  ['por', 'multiplicar'],
  ['entre', 'dividir'],
]);

function esTokenNumerico(token) {
  if (token === undefined) return false;
  return /^[0-9]+$/.test(token) || PALABRA_DIGITO.includes(normalizar(token));
}

export function traducir(texto) {
  const tokens = texto.match(/[a-záéíóúüñ]+|[0-9]+/gi) ?? [];
  const tokensNormalizados = tokens.map(normalizar);
  const resultado = [];

  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i];

    // 1. Expresiones de varias palabras (una sola seña en LSC)
    const frase = coincideFrase(tokensNormalizados, i);
    if (frase) {
      const textoFrase = tokens.slice(i, i + frase.tokens.length).join(' ');
      resultado.push(aSena(textoFrase, frase.entrada));
      i += frase.tokens.length;
      continue;
    }

    // 2. Cifras con dígitos
    if (/^[0-9]+$/.test(token)) {
      traducirNumero(token, resultado);
      i += 1;
      continue;
    }

    // 3. Operadores contextuales entre números ("7 por 8", "10 entre 2")
    const operador = OPERADORES_CONTEXTUALES.get(tokensNormalizados[i]);
    if (operador && esTokenNumerico(tokens[i - 1]) && esTokenNumerico(tokens[i + 1])) {
      resultado.push(aSena(token, buscarSena(operador)));
      i += 1;
      continue;
    }

    // 4. Palabras funcionales que la LSC omite
    if (PALABRAS_OMITIDAS.has(token.toLowerCase())) {
      resultado.push({ palabra: token, estado: 'omitida' });
      i += 1;
      continue;
    }

    // 4. Búsqueda en el diccionario (con tildes normalizadas y plurales)
    const sena = buscarSena(tokensNormalizados[i]);
    if (sena) {
      resultado.push(aSena(token, sena));
    } else {
      // Palabra fuera del diccionario: en el futuro se puede deletrear (dactilología)
      resultado.push({ palabra: token, estado: 'desconocida' });
    }
    i += 1;
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
