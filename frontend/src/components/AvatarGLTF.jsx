import { useEffect, useRef } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';

// Avatar real exportado desde MakeHuman/Blender. Para usarlo:
//   1. Exportar el modelo con sus clips de animación a frontend/public/modelos/avatar.glb
//      (los nombres de los clips deben coincidir con los IDs del diccionario, ej. "LSC_tarea").
//   2. En EscenaAvatar.jsx, reemplazar <Avatar3D /> por <AvatarGLTF />.
export default function AvatarGLTF({ animacion, url = '/modelos/avatar.glb' }) {
  const grupo = useRef();
  const { scene, animations } = useGLTF(url);
  const { actions } = useAnimations(animations, grupo);

  useEffect(() => {
    if (!animacion) return undefined;
    const accion = actions[animacion];
    if (!accion) {
      console.warn(`No existe el clip de animación "${animacion}" en ${url}`);
      return undefined;
    }
    accion.reset().setLoop(THREE.LoopOnce, 1).fadeIn(0.2).play();
    accion.clampWhenFinished = true;
    return () => accion.fadeOut(0.2);
  }, [animacion, actions, url]);

  return <primitive ref={grupo} object={scene} position={[0, -1, 0]} />;
}
