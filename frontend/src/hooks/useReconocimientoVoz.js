import { useRef, useState } from 'react';

// Reconocimiento de voz GRATUITO con la Web Speech API del navegador
// (Chrome, Edge y Android la incluyen; usa el reconocedor de Google sin costo
// ni clave de API). Cuando no está disponible (Firefox, algunos iOS), la
// aplicación recurre automáticamente a grabar audio y enviarlo a Whisper.
const SpeechRecognition =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : undefined;

export function useReconocimientoVoz({ onTextoParcial, onTextoFinal }) {
  const [escuchando, setEscuchando] = useState(false);
  const [errorVoz, setErrorVoz] = useState(null);
  const reconocedorRef = useRef(null);

  const disponible = Boolean(SpeechRecognition);

  function iniciar() {
    if (!disponible || escuchando) return;
    setErrorVoz(null);

    const reconocedor = new SpeechRecognition();
    reconocedor.lang = 'es-CO';
    reconocedor.continuous = true;
    reconocedor.interimResults = true;
    reconocedor.maxAlternatives = 1;

    let textoFinal = '';

    reconocedor.onresult = (evento) => {
      // evento.results trae TODO el historial de la sesión, no solo lo
      // nuevo — hay que reconstruir el texto final desde cero cada vez,
      // no acumularlo con +=, o las frases largas quedan duplicadas.
      let final = '';
      let parcial = '';
      for (const resultado of evento.results) {
        if (resultado.isFinal) final += resultado[0].transcript;
        else parcial += resultado[0].transcript;
      }
      textoFinal = final;
      onTextoParcial?.((final + parcial).trim());
    };

    reconocedor.onerror = (evento) => {
      if (evento.error === 'not-allowed') {
        setErrorVoz('Permiso de micrófono denegado. Revisa la configuración del navegador.');
      } else if (evento.error === 'no-speech') {
        setErrorVoz('No se detectó voz. Intenta hablar más cerca del micrófono.');
      } else if (evento.error !== 'aborted') {
        setErrorVoz(`Error del reconocimiento de voz: ${evento.error}`);
      }
    };

    reconocedor.onend = () => {
      setEscuchando(false);
      const texto = textoFinal.trim();
      if (texto) {
        onTextoFinal(texto);
      } else {
        setErrorVoz('No se detectó ninguna frase completa. Intenta hablar un poco más fuerte o más cerca del micrófono.');
      }
    };

    reconocedor.start();
    reconocedorRef.current = reconocedor;
    setEscuchando(true);
  }

  function detener() {
    reconocedorRef.current?.stop();
  }

  return { disponible, escuchando, iniciar, detener, errorVoz };
}
