import { useRef, useState } from 'react';

// Graba audio del micrófono con la API MediaRecorder del navegador.
// Al detener la grabación entrega un Blob listo para enviar al backend.
export function useGrabadorAudio(onAudioListo) {
  const [grabando, setGrabando] = useState(false);
  const [errorMicrofono, setErrorMicrofono] = useState(null);
  const grabadorRef = useRef(null);
  const fragmentosRef = useRef([]);

  async function iniciar() {
    setErrorMicrofono(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const grabador = new MediaRecorder(stream);
      fragmentosRef.current = [];

      grabador.ondataavailable = (evento) => {
        if (evento.data.size > 0) fragmentosRef.current.push(evento.data);
      };
      grabador.onstop = () => {
        stream.getTracks().forEach((pista) => pista.stop());
        const blob = new Blob(fragmentosRef.current, { type: grabador.mimeType });
        if (blob.size > 0) onAudioListo(blob);
      };

      grabador.start();
      grabadorRef.current = grabador;
      setGrabando(true);
    } catch {
      setErrorMicrofono(
        'No se pudo acceder al micrófono. Revisa los permisos del navegador.',
      );
    }
  }

  function detener() {
    grabadorRef.current?.stop();
    grabadorRef.current = null;
    setGrabando(false);
  }

  return { grabando, iniciar, detener, errorMicrofono };
}
