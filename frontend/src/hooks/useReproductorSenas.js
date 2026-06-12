import { useEffect, useMemo, useRef, useState } from 'react';

// Reproduce una secuencia de señas una tras otra, respetando la duración
// (en segundos) de cada una y la velocidad elegida por el usuario.
// Expone la seña actual (con su duración ya ajustada) para el avatar.
export function useReproductorSenas(velocidad = 1) {
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
    const duracionMs = ((secuencia[indice].duracion ?? 1.5) / velocidad) * 1000;
    timeoutRef.current = setTimeout(() => setIndice((i) => i + 1), duracionMs);
    return () => clearTimeout(timeoutRef.current);
  }, [indice, secuencia, velocidad]);

  const reproduciendo = indice >= 0 && indice < secuencia.length;

  // Identidad estable mientras no cambie la seña: el avatar la usa para saber
  // cuándo reiniciar la animación
  const senaActual = useMemo(() => {
    if (!reproduciendo) return null;
    const sena = secuencia[indice];
    return { ...sena, duracion: (sena.duracion ?? 1.5) / velocidad };
  }, [reproduciendo, secuencia, indice, velocidad]);

  return { reproducir, detener, senaActual, indice, total: secuencia.length, reproduciendo };
}
