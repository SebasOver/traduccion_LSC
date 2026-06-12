import { useState } from 'react';
import { useGrabadorAudio } from '../hooks/useGrabadorAudio.js';

const ETIQUETA_ESTADO = {
  traducida: 'Traducida a seña',
  omitida: 'Omitida (palabra funcional, la LSC no la usa)',
  desconocida: 'Sin seña en el diccionario',
};

// Frases típicas del aula para probar con un toque (útil en móvil)
const FRASES_EJEMPLO = [
  'Buenos días estudiantes, bienvenidos a la clase de matemáticas',
  '¿Cuánto es 7 por 8?',
  'Escriban la tarea en el cuaderno por favor',
  '¿Entendieron el tema o tienen preguntas?',
  'Muy bien, terminamos, hasta mañana',
];

// Panel de entrada (texto escrito o voz) y visualización del resultado.
export default function PanelTraduccion({ onTraducir, onTraducirAudio, traduccion, error, cargando }) {
  const [texto, setTexto] = useState('');
  const { grabando, iniciar, detener, errorMicrofono } = useGrabadorAudio(onTraducirAudio);

  function manejarEnvio(evento) {
    evento.preventDefault();
    if (texto.trim()) onTraducir(texto.trim());
  }

  function usarEjemplo(frase) {
    setTexto(frase);
    onTraducir(frase);
  }

  return (
    <section className="panel-traduccion tarjeta">
      <form onSubmit={manejarEnvio}>
        <label htmlFor="texto-entrada">Texto en español</label>
        <textarea
          id="texto-entrada"
          rows={3}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder='Ej.: "El profesor dejó una tarea para los estudiantes"'
        />
        <div className="botones-entrada">
          <button type="submit" disabled={cargando || grabando || !texto.trim()}>
            {cargando ? 'Traduciendo…' : 'Traducir a LSC'}
          </button>
          <button
            type="button"
            className={grabando ? 'boton-microfono grabando' : 'boton-microfono'}
            onClick={grabando ? detener : iniciar}
            disabled={cargando}
          >
            {grabando ? '⏹ Detener y traducir' : '🎤 Hablar'}
          </button>
        </div>
      </form>

      <div className="ejemplos">
        <p className="ejemplos-titulo">Prueba con una frase de clase:</p>
        <div className="ejemplos-lista">
          {FRASES_EJEMPLO.map((frase) => (
            <button
              key={frase}
              type="button"
              className="chip-ejemplo"
              onClick={() => usarEjemplo(frase)}
              disabled={cargando || grabando}
            >
              {frase}
            </button>
          ))}
        </div>
      </div>

      {(error || errorMicrofono) && (
        <p className="mensaje-error" role="alert">{error ?? errorMicrofono}</p>
      )}

      {traduccion && (
        <div className="resultado">
          {traduccion.textoTranscrito && (
            <>
              <h2>Texto reconocido (Whisper)</h2>
              <p className="texto-transcrito">«{traduccion.textoTranscrito}»</p>
            </>
          )}

          <h2>Glosas LSC</h2>
          <p className="glosas">{traduccion.glosas || '(ninguna seña encontrada)'}</p>

          <h2>Análisis palabra por palabra</h2>
          <ul className="lista-palabras">
            {traduccion.resultado.map((item, i) => (
              <li key={i} className={`palabra palabra--${item.estado}`} title={ETIQUETA_ESTADO[item.estado]}>
                {item.palabra}
                {item.glosa && <span className="palabra-glosa"> → {item.glosa}</span>}
              </li>
            ))}
          </ul>
          <p className="leyenda">
            <span className="palabra palabra--traducida">traducida</span>
            <span className="palabra palabra--omitida">omitida</span>
            <span className="palabra palabra--desconocida">sin seña</span>
          </p>
        </div>
      )}
    </section>
  );
}
