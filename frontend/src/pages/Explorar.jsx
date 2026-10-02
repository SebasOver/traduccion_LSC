import { IconoLibro } from '../components/Iconos.jsx';

// Futuro diccionario navegable del vocabulario LSC. Se mantiene oculto del
// flujo principal (solo un enlace de navegación) hasta que haya suficientes
// señas con animación real grabada — mostrar el diccionario completo ahora
// mostraría casi todo con el mismo gesto provisional, lo cual sería engañoso.
export default function Explorar() {
  return (
    <div className="pagina">
      <header className="encabezado-pagina">
        <h1>Explorar</h1>
        <p>El diccionario completo del vocabulario LSC del proyecto.</p>
      </header>

      <div className="tarjeta en-construccion">
        <IconoLibro />
        <h2>Todavía en construcción</h2>
        <p>
          Esta sección va a listar cada palabra del diccionario con su seña, para
          explorarlas sin necesidad de armar una frase. Por ahora la mayoría de las
          señas usan un gesto provisional mientras se graban las animaciones reales,
          así que el diccionario se activa cuando haya suficientes señas grabadas
          para que valga la pena mostrarlo.
        </p>
      </div>
    </div>
  );
}
