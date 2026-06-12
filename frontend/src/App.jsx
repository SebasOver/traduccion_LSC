import { useState } from 'react';
import EscenaAvatar from './components/EscenaAvatar.jsx';
import PanelTraduccion from './components/PanelTraduccion.jsx';
import { traducirTexto } from './services/api.js';
import { useReproductorSenas } from './hooks/useReproductorSenas.js';

function App() {
  const [traduccion, setTraduccion] = useState(null);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);
  const { reproducir, senaActual, indice, total, reproduciendo } = useReproductorSenas();

  async function manejarTraduccion(texto) {
    setCargando(true);
    setError(null);
    try {
      const respuesta = await traducirTexto(texto);
      setTraduccion(respuesta);
      reproducir(respuesta.secuencia);
    } catch (e) {
      setError(e.message);
      setTraduccion(null);
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="aplicacion">
      <header>
        <h1>Traductor LSC</h1>
        <p>Texto y voz a Lengua de Señas Colombiana mediante un avatar 3D</p>
      </header>

      <div className="contenido">
        <div className="columna-avatar">
          <EscenaAvatar senaActual={senaActual} />
          <p className="estado-reproduccion">
            {reproduciendo
              ? `Señando ${indice + 1} de ${total}: ${senaActual.glosa}`
              : total > 0
                ? 'Reproducción finalizada'
                : 'Escribe un texto para ver las señas'}
          </p>
          {total > 0 && !reproduciendo && traduccion && (
            <button onClick={() => reproducir(traduccion.secuencia)}>
              Repetir señas
            </button>
          )}
        </div>

        <PanelTraduccion
          onTraducir={manejarTraduccion}
          traduccion={traduccion}
          error={error}
          cargando={cargando}
        />
      </div>
    </main>
  );
}

export default App;
