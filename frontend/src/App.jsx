import { useState } from 'react';
import EscenaAvatar from './components/EscenaAvatar.jsx';
import PanelTraduccion from './components/PanelTraduccion.jsx';
import { traducirTexto, traducirAudio } from './services/api.js';
import { useReproductorSenas } from './hooks/useReproductorSenas.js';

function App() {
  const [traduccion, setTraduccion] = useState(null);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);
  const { reproducir, senaActual, indice, total, reproduciendo } = useReproductorSenas();

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
    <div className="aplicacion">
      <header className="encabezado">
        <h1>Traductor LSC</h1>
        <p>Español → Lengua de Señas Colombiana · aula de matemáticas</p>
      </header>

      <main className="contenido">
        <section className="columna-avatar tarjeta">
          <EscenaAvatar senaActual={senaActual} />
          <div className="barra-reproduccion">
            <p className="estado-reproduccion" aria-live="polite">
              {reproduciendo
                ? `Señando ${indice + 1} de ${total}: ${senaActual.glosa}`
                : total > 0
                  ? 'Reproducción finalizada'
                  : 'Escribe o di una frase para ver las señas'}
            </p>
            {total > 0 && !reproduciendo && traduccion && (
              <button className="boton-secundario" onClick={() => reproducir(traduccion.secuencia)}>
                ↻ Repetir
              </button>
            )}
          </div>
        </section>

        <PanelTraduccion
          onTraducir={manejarTraduccion}
          onTraducirAudio={manejarAudio}
          traduccion={traduccion}
          error={error}
          cargando={cargando}
        />
      </main>

      <footer className="pie">
        Prototipo de tesis · vocabulario centrado en clases de matemáticas ·
        avatar provisional mientras se integra el modelo de MakeHuman/Blender
      </footer>
    </div>
  );
}

export default App;
