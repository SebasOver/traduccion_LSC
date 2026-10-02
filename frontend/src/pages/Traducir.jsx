import { useState } from 'react';
import EscenaAvatar from '../components/EscenaAvatar.jsx';
import PanelTraduccion from '../components/PanelTraduccion.jsx';
import LineaTiempoSenas from '../components/LineaTiempoSenas.jsx';
import { IconoRepetir } from '../components/Iconos.jsx';
import { traducirTexto, traducirAudio } from '../services/api.js';
import { useReproductorSenas } from '../hooks/useReproductorSenas.js';

const VELOCIDADES = [0.75, 1, 1.5];

export default function Traducir() {
  const [traduccion, setTraduccion] = useState(null);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [velocidad, setVelocidad] = useState(1);
  const { reproducir, senaActual, indice, total, reproduciendo } = useReproductorSenas(velocidad);

  async function ejecutarTraduccion(peticion) {
    setCargando(true);
    setError(null);
    try {
      const respuesta = await peticion();
      setTraduccion(respuesta);
      reproducir(respuesta.secuencia);
    } catch (e) {
      setError(e.message);
      setTraduccion(null);
    } finally {
      setCargando(false);
    }
  }

  const manejarTraduccion = (texto) => ejecutarTraduccion(() => traducirTexto(texto));
  const manejarAudio = (blob) => ejecutarTraduccion(() => traducirAudio(blob));

  return (
    <div className="pagina">
      <header className="encabezado-pagina">
        <h1>Traducir</h1>
        <p>Convierte texto o audio en español a Lengua de Señas Colombiana.</p>
      </header>

      <div className="contenido">
        <section className="columna-avatar tarjeta">
          <EscenaAvatar senaActual={senaActual} />
          <LineaTiempoSenas secuencia={traduccion?.secuencia ?? []} indice={indice} />
          <div className="barra-reproduccion">
            <p className="estado-reproduccion" aria-live="polite">
              {reproduciendo
                ? `Señando ${indice + 1} de ${total}`
                : total > 0
                  ? 'Reproducción finalizada'
                  : traduccion
                    ? 'Esta frase no tiene ninguna seña para mostrar'
                    : 'Escribe o di una frase para ver las señas'}
            </p>
            <div className="controles-reproduccion">
              <div className="selector-velocidad" role="group" aria-label="Velocidad de las señas">
                {VELOCIDADES.map((v) => (
                  <button
                    key={v}
                    aria-pressed={v === velocidad}
                    className={v === velocidad ? 'boton-velocidad activa' : 'boton-velocidad'}
                    onClick={() => setVelocidad(v)}
                  >
                    {v}×
                  </button>
                ))}
              </div>
              {total > 0 && !reproduciendo && traduccion && (
                <button className="boton-secundario" onClick={() => reproducir(traduccion.secuencia)}>
                  <IconoRepetir /> Repetir
                </button>
              )}
            </div>
          </div>
        </section>

        <PanelTraduccion
          onTraducir={manejarTraduccion}
          onTraducirAudio={manejarAudio}
          traduccion={traduccion}
          error={error}
          cargando={cargando}
        />
      </div>
    </div>
  );
}
