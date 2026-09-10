import { useEffect, useRef } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';

// Avatar real exportado desde Blender (MetaPerson/Avatar SDK, MakeHuman, etc.).
// Para usarlo:
//   1. Exportar el modelo con sus clips de animación a frontend/public/modelos/avatar.glb
//      (los nombres de los clips deben coincidir con los IDs del diccionario, ej. "LSC_hola").
//   2. Exportar también un clip llamado "LSC_reposo": una pose neutral con los brazos
//      abajo. El avatar la reproduce en bucle mientras no hay ninguna seña activa — sin
//      este clip, se queda en la pose de referencia del modelo (T-pose) en reposo.
//   En Blender: cada acción se exporta al glTF solo si está "empujada" a un strip de NLA
//   (Push Down, en el Action Editor o el editor NLA) — si solo hay una acción activa sin
//   NLA, el exportador solo incluye esa y las demás no aparecen en el archivo.
//
// El cambio entre reposo y una seña es un CORTE instantáneo, no una mezcla progresiva:
// con solo un puñado de clips capturados por separado, mezclar (crossfade) entre poses
// muy distintas (ej. brazos abajo → brazo levantado) hace que el camino intermedio de
// la interpolación atraviese el cuerpo del avatar durante la fracción de segundo del
// fundido — se ve como si la mano se "teletransportara" metida en el torso. Un corte
// directo evita ese artefacto, a costa de perder la suavidad de una mezcla.
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
