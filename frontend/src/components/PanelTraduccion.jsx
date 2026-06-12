import { useState } from 'react';

const ETIQUETA_ESTADO = {
  traducida: 'Traducida a seña',
  omitida: 'Omitida (palabra funcional, la LSC no la usa)',
  desconocida: 'Sin seña en el diccionario',
};

// Panel de entrada de texto y visualización del resultado de la traducción.
export default function PanelTraduccion({ onTraducir, traduccion, error, cargando }) {
  const [texto, setTexto] = useState('');

  function manejarEnvio(evento) {
    evento.preventDefault();
    if (texto.trim()) onTraducir(texto.trim());
  }

  return (
    <section className="panel-traduccion">
      <form onSubmit={manejarEnvio}>
        <label htmlFor="texto-entrada">Texto en español</label>
        <textarea
          id="texto-entrada"
          rows={3}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder='Ej.: "El profesor dejó una tarea para los estudiantes"'
        />
        <button type="submit" disabled={cargando || !texto.trim()}>
          {cargando ? 'Traduciendo…' : 'Traducir a LSC'}
        </button>
      </form>

      {error && <p className="mensaje-error" role="alert">{error}</p>}

      {traduccion && (
        <div className="resultado">
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
