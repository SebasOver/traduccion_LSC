import { useEffect, useRef, useState } from 'react';

// Reproduce una secuencia de señas una tras otra, respetando la duración
// (en segundos) de cada una. Expone la seña actual para que el avatar la anime.
export function useReproductorSenas() {
  const [secuencia, setSecuencia] = useState([]);
  const [indice, setIndice] = useState(-1);
  const timeoutRef = useRef(null);

  function reproducir(nuevaSecuencia) {
    clearTimeout(timeoutRef.current);
    setSecuencia(nuevaSecuencia);
    setIndice(nuevaSecuencia.length > 0 ? 0 : -1);
  }

  function detener() {
    clearTimeout(timeoutRef.current);
    setIndice(-1);
  }

  useEffect(() => {
    if (indice < 0 || indice >= secuencia.length) return undefined;
    const duracionMs = (secuencia[indice].duracion ?? 1.5) * 1000;
    timeoutRef.current = setTimeout(() => setIndice((i) => i + 1), duracionMs);
    return () => clearTimeout(timeoutRef.current);
  }, [indice, secuencia]);

  const reproduciendo = indice >= 0 && indice < secuencia.length;
  const senaActual = reproduciendo ? secuencia[indice] : null;

  return { reproducir, detener, senaActual, indice, total: secuencia.length, reproduciendo };
}
