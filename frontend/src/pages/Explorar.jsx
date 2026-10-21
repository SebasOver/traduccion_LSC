import { useEffect, useMemo, useState } from 'react';
import EscenaAvatar from '../components/EscenaAvatar.jsx';
import { obtenerDiccionario } from '../services/api.js';

const TODAS = 'todas';

const ETIQUETA_CATEGORIA = {
  saludos_cortesia: 'Saludos y cortesía',
  interaccion_aula: 'Interacción de aula',
  preguntas: 'Preguntas',
  academico_general: 'Académico',
  matematicas: 'Matemáticas',
  numeros: 'Números',
};

function aVistaPrevia(sena) {
  return { animacion: sena.animacion, glosa: sena.glosa, duracion: sena.duracion };
}

// Diccionario navegable: busca o filtra por categoría cualquier palabra, o
// cualquier letra del alfabeto dactilológico, y la reproduce en el avatar
// sin necesidad de armar una frase en "Traducir".
export default function Explorar() {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState(TODAS);
  const [pestana, setPestana] = useState('palabras');
  const [vistaPrevia, setVistaPrevia] = useState(null);

  useEffect(() => {
    obtenerDiccionario()
      .then((d) => {
        setDatos(d);
        if (d.senas.length > 0) setVistaPrevia(aVistaPrevia(d.senas[0]));
      })
      .catch((e) => setError(e.message));
  }, []);

  const senasFiltradas = useMemo(() => {
    if (!datos) return [];
    const termino = busqueda.trim().toLowerCase();
    return datos.senas
      .filter((s) => categoria === TODAS || s.categoria === categoria)
      .filter((s) => {
        if (!termino) return true;
        return (
          s.palabra.toLowerCase().includes(termino) ||
          s.glosa.toLowerCase().includes(termino) ||
          s.sinonimos.some((sin) => sin.toLowerCase().includes(termino))
        );
      });
  }, [datos, busqueda, categoria]);

  if (error) {
    return (
      <div className="pagina">
        <header className="encabezado-pagina">
          <h1>Explorar</h1>
        </header>
        <p className="mensaje-error" role="alert">{error}</p>
      </div>
    );
  }

  if (!datos) {
    return (
      <div className="pagina">
        <header className="encabezado-pagina">
          <h1>Explorar</h1>
        </header>
        <p>Cargando diccionario…</p>
      </div>
    );
  }

  return (
    <div className="pagina">
      <header className="encabezado-pagina">
        <h1>Explorar</h1>
        <p>
          El diccionario completo: {datos.senas.length} señas y las {datos.letras.length} letras
          del alfabeto dactilológico. Elige una para verla en el avatar.
        </p>
      </header>

      <div className="contenido">
        <section className="columna-avatar tarjeta">
          <EscenaAvatar senaActual={vistaPrevia} />
        </section>

        <section className="panel-explorar tarjeta">
          <div className="explorar-pestanas" role="tablist">
            <button
              role="tab"
              aria-selected={pestana === 'palabras'}
              className={pestana === 'palabras' ? 'boton-pestana activa' : 'boton-pestana'}
              onClick={() => setPestana('palabras')}
            >
              Palabras ({datos.senas.length})
            </button>
            <button
              role="tab"
              aria-selected={pestana === 'alfabeto'}
              className={pestana === 'alfabeto' ? 'boton-pestana activa' : 'boton-pestana'}
              onClick={() => setPestana('alfabeto')}
            >
              Alfabeto ({datos.letras.length})
            </button>
          </div>

          {pestana === 'palabras' ? (
            <>
              <label htmlFor="buscador-diccionario" className="etiqueta-oculta">
                Buscar en el diccionario
              </label>
              <input
                id="buscador-diccionario"
                type="search"
                className="buscador-diccionario"
                placeholder="Buscar una palabra…"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />

              <div className="filtros-categoria" role="group" aria-label="Filtrar por categoría">
                <button
                  className={categoria === TODAS ? 'chip-categoria activa' : 'chip-categoria'}
                  onClick={() => setCategoria(TODAS)}
                >
                  Todas
                </button>
                {datos.categorias.map((c) => (
                  <button
                    key={c}
                    className={categoria === c ? 'chip-categoria activa' : 'chip-categoria'}
                    onClick={() => setCategoria(c)}
                  >
                    {ETIQUETA_CATEGORIA[c] ?? c}
                  </button>
                ))}
              </div>

              {senasFiltradas.length > 0 ? (
                <ul className="lista-diccionario">
                  {senasFiltradas.map((s) => (
                    <li key={s.palabra}>
                      <button
                        className={
                          vistaPrevia?.animacion === s.animacion
                            ? 'item-diccionario activo'
                            : 'item-diccionario'
                        }
                        onClick={() => setVistaPrevia(aVistaPrevia(s))}
                      >
                        <span className="item-glosa">{s.glosa}</span>
                        <span className="item-palabra">{s.palabra}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="sin-resultados">Ninguna palabra coincide con "{busqueda}".</p>
              )}
            </>
          ) : (
            <div className="grid-alfabeto">
              {datos.letras.map((l) => (
                <button
                  key={l.letra}
                  className={
                    vistaPrevia?.animacion === l.animacion ? 'item-letra activo' : 'item-letra'
                  }
                  onClick={() => setVistaPrevia(aVistaPrevia(l))}
                  aria-label={`Letra ${l.letra}`}
                >
                  {l.letra.toUpperCase()}
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
