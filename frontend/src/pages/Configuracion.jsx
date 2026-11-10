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
          Traductor LSC es un prototipo de tesis: convierte texto y voz en
          español en una secuencia de señas de Lengua de Señas Colombiana que
          reproduce un avatar 3D, con un vocabulario centrado en el aula de
          matemáticas.
        </p>
      </div>

      <div className="tarjeta seccion-info">
        <h2>Estado de las señas</h2>
        <p>
          Todas las señas del diccionario y las letras del alfabeto
          dactilológico tienen su animación, grabada con captura de
          movimiento. Se pueden ver una por una en la sección "Explorar".
        </p>
        <p>
          Ninguna seña ha sido revisada todavía por una persona sorda ni por
          un intérprete certificado: es un prototipo experimental de apoyo,
          no un traductor validado de LSC.
        </p>
      </div>

      <div className="tarjeta seccion-info">
        <h2>Privacidad</h2>
        <p>
          La aplicación no pide cuenta ni guarda un historial de lo que
          escribes. El texto se envía al servidor del prototipo para
          traducirlo.
        </p>
        <p>
          La voz sale de tu equipo: en Chrome y Edge la procesa el servicio
          de reconocimiento del navegador; en los navegadores sin ese
          servicio, el audio se envía al servidor y de ahí a OpenAI (Whisper).
        </p>
      </div>
    </div>
  );
}
