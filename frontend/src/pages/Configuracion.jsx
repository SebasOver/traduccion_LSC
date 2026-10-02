export default function Configuracion() {
  return (
    <div className="pagina">
      <header className="encabezado-pagina">
        <h1>Configuración</h1>
        <p>Acerca de este prototipo.</p>
      </header>

      <div className="tarjeta seccion-info">
        <h2>Sobre el proyecto</h2>
        <p>
          Traductor LSC es un prototipo de tesis: traduce texto y voz en español a
          Lengua de Señas Colombiana mediante un avatar 3D, con un vocabulario
          centrado en el aula de matemáticas.
        </p>
      </div>

      <div className="tarjeta seccion-info">
        <h2>Estado de las señas</h2>
        <p>
          La mayoría de las señas todavía usan un gesto provisional mientras se
          graban las animaciones reales a partir de captura de movimiento. La
          sección "Explorar" mostrará cuáles ya están listas.
        </p>
      </div>
    </div>
  );
}
