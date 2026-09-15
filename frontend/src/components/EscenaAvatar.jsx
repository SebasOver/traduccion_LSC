import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import AvatarGLTF from './AvatarGLTF.jsx';
import LimiteErroresAvatar from './LimiteErroresAvatar.jsx';

// Escena 3D con el avatar. Recibe la seña actual y muestra su glosa.
// El lienzo 3D queda oculto para lectores de pantalla porque es puramente
// visual — la glosa de al lado (aria-live) ya comunica lo mismo en texto.
export default function EscenaAvatar({ senaActual }) {
  return (
    <div className="escena-avatar">
      <LimiteErroresAvatar>
        <div aria-hidden="true" style={{ width: '100%', height: '100%' }}>
          <Canvas camera={{ position: [0, 0.4, 2.6], fov: 45 }} dpr={[1, 2]}>
            <hemisphereLight intensity={0.5} groundColor="#cbd5e1" />
            <directionalLight position={[3, 4, 5]} intensity={1.2} />
            <directionalLight position={[-3, 2, -2]} intensity={0.3} />
            <Suspense fallback={null}>
              <AvatarGLTF animacion={senaActual?.animacion ?? null} />
              <ContactShadows position={[0, -1, 0]} opacity={0.35} scale={4} blur={2.4} far={1.6} />
            </Suspense>
            <OrbitControls enablePan={false} minDistance={1.5} maxDistance={5} target={[0, 0.2, 0]} />
          </Canvas>
        </div>
      </LimiteErroresAvatar>
      <div className="subtitulo-glosa" aria-live="polite">
        {senaActual ? senaActual.glosa : ' '}
      </div>
    </div>
  );
}
