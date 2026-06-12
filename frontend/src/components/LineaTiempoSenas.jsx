import { useEffect, useRef } from 'react';

// Muestra la secuencia de glosas como fichas y resalta la que se está señando.
export default function LineaTiempoSenas({ secuencia, indice }) {
  const activaRef = useRef(null);

  useEffect(() => {
    activaRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [indice]);

  if (secuencia.length === 0) return null;

  return (
    <ol className="linea-tiempo" aria-label="Secuencia de señas">
      {secuencia.map((sena, i) => (
        <li
          key={`${sena.animacion}-${i}`}
          ref={i === indice ? activaRef : null}
          className={i === indice ? 'ficha-sena activa' : i < indice ? 'ficha-sena hecha' : 'ficha-sena'}
        >
          {sena.glosa}
        </li>
      ))}
    </ol>
  );
}
