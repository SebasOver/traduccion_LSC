import { Suspense, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { CameraControls, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import AvatarGLTF from './AvatarGLTF.jsx';
import LimiteErroresAvatar from './LimiteErroresAvatar.jsx';
import { IconoAcercar, IconoAlejar, IconoRepetir } from './Iconos.jsx';

// Encuadre de cuerpo casi completo, el normal para ver una seña cualquiera.
const CAMARA_DEFECTO = { posicion: [0, 0.4, 2.6], objetivo: [0, 0.2, 0] };

// Acercamiento para señas que se hacen solo con los dedos (los números, el
// deletreo): a la distancia normal el movimiento de los dedos casi no se
// distingue. Estos valores son un punto de partida calculado sobre la pose
// de reposo — hay que revisarlos con las animaciones reales de los números
// ya puestas, porque una seña con la mano al frente del pecho no queda
// exactamente donde queda la mano colgando en reposo.
const CAMARA_MANOS = { posicion: [0.1, 0.55, 1.15], objetivo: [0.1, 0.5, 0] };

// Escena 3D con el avatar. Recibe la seña actual y muestra su glosa.
// El lienzo 3D queda oculto para lectores de pantalla porque es puramente
// visual — la glosa de al lado (aria-live) ya comunica lo mismo en texto.
// Los controles de zoom sí son reales controles y quedan fuera de ese
// bloque oculto.
export default function EscenaAvatar({ senaActual }) {
  const controlesRef = useRef(null);
  const encuadrePrevioRef = useRef(null);

  // Acerca la cámara a las manos mientras se señe algo que se hace solo con
  // los dedos, y la devuelve a donde estaba (no a un encuadre fijo, para no
  // pelear con un zoom manual del usuario) cuando termina.
  useEffect(() => {
    const controles = controlesRef.current;
    if (!controles) return;

    if (senaActual?.enfoqueManos) {
      if (!encuadrePrevioRef.current) {
        encuadrePrevioRef.current = {
          posicion: controles.getPosition(new THREE.Vector3()),
          objetivo: controles.getTarget(new THREE.Vector3()),
        };
      }
      controles.setLookAt(...CAMARA_MANOS.posicion, ...CAMARA_MANOS.objetivo, true);
    } else if (encuadrePrevioRef.current) {
      const { posicion, objetivo } = encuadrePrevioRef.current;
      controles.setLookAt(posicion.x, posicion.y, posicion.z, objetivo.x, objetivo.y, objetivo.z, true);
      encuadrePrevioRef.current = null;
    }
  }, [senaActual]);

  function acercar() {
    controlesRef.current?.dolly(0.5, true);
  }

  function alejar() {
    controlesRef.current?.dolly(-0.5, true);
  }

  function centrar() {
    controlesRef.current?.reset(true);
  }

  return (
    <div className="escena-avatar">
      <LimiteErroresAvatar>
        <div aria-hidden="true" style={{ width: '100%', height: '100%' }}>
          <Canvas camera={{ position: CAMARA_DEFECTO.posicion, fov: 45 }} dpr={[1, 2]}>
            <hemisphereLight intensity={0.5} groundColor="#cbd5e1" />
            <directionalLight position={[3, 4, 5]} intensity={1.2} />
            <directionalLight position={[-3, 2, -2]} intensity={0.3} />
            <Suspense fallback={null}>
              <AvatarGLTF animacion={senaActual?.animacion ?? null} />
              <ContactShadows position={[0, -1, 0]} opacity={0.35} scale={4} blur={2.4} far={1.6} />
            </Suspense>
            {/* dollySpeed más bajo: en la rueda del mouse el zoom por defecto es muy brusco */}
            <CameraControls
              ref={controlesRef}
              minDistance={0.7}
              maxDistance={5}
              dollySpeed={0.5}
              truckSpeed={0}
            />
          </Canvas>
        </div>
      </LimiteErroresAvatar>

      <div className="controles-zoom" role="group" aria-label="Zoom del avatar">
        <button type="button" className="boton-zoom" onClick={acercar} aria-label="Acercar">
          <IconoAcercar />
        </button>
        <button type="button" className="boton-zoom" onClick={alejar} aria-label="Alejar">
          <IconoAlejar />
        </button>
        <button type="button" className="boton-zoom" onClick={centrar} aria-label="Centrar de nuevo">
          <IconoRepetir />
        </button>
      </div>

      <div className="subtitulo-glosa" aria-live="polite">
        {senaActual ? senaActual.glosa : ' '}
      </div>
    </div>
  );
}
