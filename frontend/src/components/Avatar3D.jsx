import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { POSES, POSE_BASE } from '../data/posesLsc.js';

// Avatar placeholder articulado (hombro → codo → muñeca → dedos) que reproduce
// las señas de dos maneras:
//   1. Señas con pose definida en posesLsc.js: interpolación de keyframes.
//   2. Resto de señas: gesto procedural determinista generado desde el ID.
// Cuando exista el modelo real de MakeHuman/Blender se reemplaza por
// <AvatarGLTF /> sin tocar el resto de la aplicación.

const PIEL = '#e0ac69';
const CAMISA = '#2563eb';

// --- Motor de poses -------------------------------------------------------

// Mezcla una pose parcial sobre otra completa (lo no especificado se hereda)
function fusionar(base, parcial) {
  if (parcial === undefined) return base;
  if (typeof base === 'number') return parcial;
  if (Array.isArray(base)) return base.map((v, i) => (parcial[i] !== undefined ? parcial[i] : v));
  const resultado = {};
  for (const clave of Object.keys(base)) resultado[clave] = fusionar(base[clave], parcial[clave]);
  return resultado;
}

function interpolarPose(a, b, u) {
  if (typeof a === 'number') return a + (b - a) * u;
  if (Array.isArray(a)) return a.map((v, i) => v + (b[i] - v) * u);
  const resultado = {};
  for (const clave of Object.keys(a)) resultado[clave] = interpolarPose(a[clave], b[clave], u);
  return resultado;
}

// Completa los keyframes en cascada: cada uno hereda del anterior
const POSES_COMPLETAS = new Map();
for (const [id, keyframes] of Object.entries(POSES)) {
  const completos = [];
  let anterior = POSE_BASE;
  for (const kf of keyframes) {
    // fusionar solo copia los canales de la pose, por lo que el campo t del
    // keyframe no se cuela dentro de la pose resultante
    const pose = fusionar(anterior, kf);
    completos.push({ t: kf.t, pose });
    anterior = pose;
  }
  POSES_COMPLETAS.set(id, completos);
}

function poseEnInstante(keyframes, u) {
  if (u <= keyframes[0].t) return keyframes[0].pose;
  for (let i = 0; i < keyframes.length - 1; i++) {
    const a = keyframes[i];
    const b = keyframes[i + 1];
    if (u <= b.t) return interpolarPose(a.pose, b.pose, (u - a.t) / (b.t - a.t || 1));
  }
  return keyframes[keyframes.length - 1].pose;
}

// --- Gestos procedurales para señas sin pose definida ---------------------

const gestosGenerados = new Map();

function obtenerGestoProcedural(animacion) {
  if (!gestosGenerados.has(animacion)) {
    let hash = 0;
    for (const caracter of animacion) hash = (hash * 31 + caracter.charCodeAt(0)) >>> 0;
    const aleatorio = (n) => ((hash >> n) % 97) / 97;
    gestosGenerados.set(animacion, {
      der: [-0.8 - aleatorio(0) * 1.6, 0.1 + aleatorio(3) * 0.5],
      izq: [-0.8 - aleatorio(6) * 1.6, -(0.1 + aleatorio(9) * 0.5)],
      amplitud: 0.15 + aleatorio(12) * 0.3,
      velocidad: 4 + aleatorio(15) * 6,
      cabeza: (aleatorio(18) - 0.5) * 0.4,
    });
  }
  return gestosGenerados.get(animacion);
}

function poseProcedural(animacion, t) {
  const gesto = obtenerGestoProcedural(animacion);
  const oscilacion = Math.sin(t * gesto.velocidad) * gesto.amplitud;
  return fusionar(POSE_BASE, {
    cabeza: [gesto.cabeza, 0],
    brazoDer: { hombro: [gesto.der[0] + oscilacion, 0, gesto.der[1]], codo: -0.5 },
    brazoIzq: { hombro: [gesto.izq[0] - oscilacion, 0, gesto.izq[1]], codo: -0.5 },
  });
}

// --- Geometría del avatar --------------------------------------------------

function Brazo({ lado, refs }) {
  return (
    <group ref={refs.hombro} position={[lado * 0.42, 1.32, 0]}>
      <mesh position={[0, -0.22, 0]}>
        <boxGeometry args={[0.15, 0.44, 0.15]} />
        <meshStandardMaterial color={CAMISA} />
      </mesh>
      <group ref={refs.codo} position={[0, -0.44, 0]}>
        <mesh position={[0, -0.16, 0]}>
          <boxGeometry args={[0.13, 0.32, 0.13]} />
          <meshStandardMaterial color={PIEL} />
        </mesh>
        <group ref={refs.muneca} position={[0, -0.32, 0]}>
          <mesh position={[0, -0.07, 0]}>
            <boxGeometry args={[0.14, 0.14, 0.05]} />
            <meshStandardMaterial color={PIEL} />
          </mesh>
          {[0, 1, 2, 3].map((i) => (
            <group
              key={i}
              ref={(el) => { refs.dedos.current[i] = el; }}
              position={[-0.0525 + i * 0.035, -0.14, 0]}
            >
              <mesh position={[0, -0.055, 0]}>
                <boxGeometry args={[0.028, 0.11, 0.03]} />
                <meshStandardMaterial color={PIEL} />
              </mesh>
            </group>
          ))}
          <group
            ref={refs.pulgar}
            position={[lado * 0.085, -0.05, 0]}
            rotation={[0, 0, lado * -0.7]}
          >
            <mesh position={[0, -0.045, 0]}>
              <boxGeometry args={[0.028, 0.09, 0.03]} />
              <meshStandardMaterial color={PIEL} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}

function usarRefsBrazo() {
  return {
    hombro: useRef(),
    codo: useRef(),
    muneca: useRef(),
    dedos: useRef([]),
    pulgar: useRef(),
  };
}

export default function Avatar3D({ sena }) {
  const cabeza = useRef();
  const refsDer = usarRefsBrazo();
  const refsIzq = usarRefsBrazo();
  const inicioRef = useRef(0);
  const senaAnteriorRef = useRef(null);

  const poseReposo = useMemo(() => fusionar(POSE_BASE, {}), []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (senaAnteriorRef.current !== sena) {
      senaAnteriorRef.current = sena;
      inicioRef.current = t;
    }

    let pose;
    if (sena) {
      const keyframes = POSES_COMPLETAS.get(sena.animacion);
      if (keyframes) {
        const u = Math.min((t - inicioRef.current) / (sena.duracion || 1.5), 1);
        pose = poseEnInstante(keyframes, u);
      } else {
        pose = poseProcedural(sena.animacion, t);
      }
    } else {
      // Reposo con una respiración sutil
      pose = poseReposo;
      pose.cabeza = [Math.sin(t * 1.2) * 0.04, Math.sin(t * 0.6) * 0.06];
    }

    aplicarPose(pose, cabeza, refsDer, refsIzq);
  });

  return (
    <group position={[0, -1, 0]}>
      {/* Cabeza */}
      <group ref={cabeza} position={[0, 1.72, 0]}>
        <mesh>
          <sphereGeometry args={[0.24, 32, 32]} />
          <meshStandardMaterial color={PIEL} />
        </mesh>
        <mesh position={[-0.08, 0.04, 0.2]}>
          <sphereGeometry args={[0.03, 12, 12]} />
          <meshStandardMaterial color="#1f2937" />
        </mesh>
        <mesh position={[0.08, 0.04, 0.2]}>
          <sphereGeometry args={[0.03, 12, 12]} />
          <meshStandardMaterial color="#1f2937" />
        </mesh>
      </group>
      {/* Cuello y torso */}
      <mesh position={[0, 1.46, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.12, 16]} />
        <meshStandardMaterial color={PIEL} />
      </mesh>
      <mesh position={[0, 1.05, 0]}>
        <boxGeometry args={[0.68, 0.72, 0.32]} />
        <meshStandardMaterial color={CAMISA} />
      </mesh>
      {/* Brazos articulados */}
      <Brazo lado={1} refs={refsDer} />
      <Brazo lado={-1} refs={refsIzq} />
      {/* Base */}
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.22, 0.3, 0.6, 24]} />
        <meshStandardMaterial color="#374151" />
      </mesh>
    </group>
  );
}

const SUAVIZADO = 0.28;

function suavizarRotacion(objeto, x, y, z) {
  if (!objeto) return;
  if (x !== undefined) objeto.rotation.x = THREE.MathUtils.lerp(objeto.rotation.x, x, SUAVIZADO);
  if (y !== undefined) objeto.rotation.y = THREE.MathUtils.lerp(objeto.rotation.y, y, SUAVIZADO);
  if (z !== undefined) objeto.rotation.z = THREE.MathUtils.lerp(objeto.rotation.z, z, SUAVIZADO);
}

function aplicarBrazo(refs, brazo, mano) {
  suavizarRotacion(refs.hombro.current, brazo.hombro[0], brazo.hombro[1], brazo.hombro[2]);
  suavizarRotacion(refs.codo.current, brazo.codo);
  suavizarRotacion(refs.muneca.current, brazo.muneca[0], undefined, brazo.muneca[1]);
  mano.dedos.forEach((curvatura, i) => {
    suavizarRotacion(refs.dedos.current[i], curvatura * 1.6);
  });
  suavizarRotacion(refs.pulgar.current, mano.pulgar * 1.2);
}

function aplicarPose(pose, cabeza, refsDer, refsIzq) {
  suavizarRotacion(cabeza.current, pose.cabeza[0], pose.cabeza[1]);
  aplicarBrazo(refsDer, pose.brazoDer, pose.manoDer);
  aplicarBrazo(refsIzq, pose.brazoIzq, pose.manoIzq);
}
