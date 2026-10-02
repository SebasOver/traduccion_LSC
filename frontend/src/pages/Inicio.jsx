import { Link } from 'react-router-dom';
import EscenaAvatar from '../components/EscenaAvatar.jsx';

const PASOS = [
  {
    numero: '01',
    titulo: 'Escribe o di una frase',
    texto: 'En español, por texto o con el micrófono del navegador.',
  },
  {
    numero: '02',
    titulo: 'Se busca en el diccionario LSC',
    texto: 'Cada palabra se compara contra el vocabulario de la clase de matemáticas.',
  },
  {
    numero: '03',
    titulo: 'El avatar hace la seña',
    texto: 'En un modelo 3D, palabra por palabra, a la velocidad que elijas.',
  },
];

export default function Inicio() {
  return (
    <div className="pagina">
      <section className="hero-inicio">
        <div className="hero-texto">
          <p className="eyebrow">Prototipo de tesis</p>
          <h1>
            Traductor <span className="marca-acento">LSC</span>
          </h1>
          <p className="hero-subtitulo">
            Convierte texto y voz en español a Lengua de Señas Colombiana, con un avatar 3D.
            Vocabulario centrado en el aula de matemáticas.
          </p>
          <Link to="/traducir" className="boton-cta">
            Comenzar a traducir →
          </Link>
        </div>
        <div className="hero-avatar tarjeta columna-avatar">
          <EscenaAvatar senaActual={null} />
        </div>
      </section>

      <section className="como-funciona">
        <h2>¿Cómo funciona?</h2>
        <div className="pasos">
          {PASOS.map((paso) => (
            <div className="paso tarjeta" key={paso.numero}>
              <span className="paso-numero">{paso.numero}</span>
              <h3>{paso.titulo}</h3>
              <p>{paso.texto}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
