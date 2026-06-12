import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import Avatar3D from './Avatar3D.jsx';
// Cuando exista el modelo real: import AvatarGLTF from './AvatarGLTF.jsx';

// Escena 3D con el avatar. Recibe la seña actual y muestra su glosa.
export default function EscenaAvatar({ senaActual }) {
  return (
    <div className="escena-avatar">
      <Canvas camera={{ position: [0, 0.4, 2.6], fov: 45 }} dpr={[1, 2]}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 4, 5]} intensity={1.1} />
        <Suspense fallback={null}>
          <Avatar3D animacion={senaActual?.animacion ?? null} />
          {/* Con el modelo real: <AvatarGLTF animacion={senaActual?.animacion ?? null} /> */}
        </Suspense>
        <OrbitControls enablePan={false} minDistance={1.5} maxDistance={5} target={[0, 0.2, 0]} />
      </Canvas>
      <div className="subtitulo-glosa" aria-live="polite">
        {senaActual ? senaActual.glosa : ' '}
      </div>
    </div>
  );
}
