import { useEffect, useRef } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';

// Avatar real exportado desde Blender. Los nombres de los clips deben
// coincidir con los IDs del diccionario ("LSC_hola", etc.), más un clip
// "LSC_reposo" (brazos abajo) que se reproduce en bucle cuando no hay
// ninguna seña activa — sin él, el avatar se queda en la T-pose del modelo.
// En Blender, cada acción solo se exporta si está empujada a un strip de
// NLA (Push Down); con una sola acción activa sin eso, el exportador de
// glTF descarta las demás.
//
// El cambio entre reposo y una seña es un corte, no un fundido: mezclar
// (crossfade) entre poses muy distintas hace que el camino intermedio de
// la interpolación atraviese el cuerpo del avatar — se ve como si la mano
// se teletransportara metida en el torso.
const CLIP_REPOSO = 'LSC_reposo';

export default function AvatarGLTF({ animacion, url = '/modelos/avatar.glb' }) {
  const grupo = useRef();
  const { scene, animations } = useGLTF(url);
  const { actions } = useAnimations(animations, grupo);
  const accionActivaRef = useRef(null);

  // Pose de reposo en bucle por defecto, si el archivo la trae
  useEffect(() => {
    const reposo = actions[CLIP_REPOSO];
    if (!reposo) return undefined;
    reposo.reset().setLoop(THREE.LoopRepeat, Infinity).play();
    accionActivaRef.current = reposo;
    return () => reposo.stop();
  }, [actions]);

  useEffect(() => {
    if (!animacion) return undefined;
    const accion = actions[animacion];
    if (!accion) {
      console.warn(`No existe el clip de animación "${animacion}" en ${url}`);
      return undefined;
    }

    const anterior = accionActivaRef.current;
    if (anterior && anterior !== accion) anterior.stop();
    accion.reset().setLoop(THREE.LoopOnce, 1);
    accion.clampWhenFinished = true;
    accion.play();
    accionActivaRef.current = accion;

    return () => {
      accion.stop();
      const reposo = actions[CLIP_REPOSO];
      if (reposo) {
        reposo.reset().setLoop(THREE.LoopRepeat, Infinity).play();
        accionActivaRef.current = reposo;
      }
    };
  }, [animacion, actions, url]);

  return <primitive ref={grupo} object={scene} position={[0, -1, 0]} />;
}
