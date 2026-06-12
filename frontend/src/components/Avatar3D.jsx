import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Avatar placeholder construido con primitivas. Cada ID de animación del
// diccionario se mapea a un gesto procedural (poses y oscilación de brazos)
// para poder probar el flujo completo texto → secuencia → animación sin tener
// todavía el modelo GLTF real. Cuando exista el modelo de MakeHuman/Blender,
// se reemplaza por <AvatarGLTF /> (misma prop `animacion`).
//
// Cada gesto define: pose objetivo de cada brazo [rotX, rotZ] (radianes),
// amplitud y velocidad de la oscilación, e inclinación de la cabeza.
const GESTOS = {
  LSC_tarea: { der: [-1.4, 0.3], izq: [-1.4, -0.3], amplitud: 0.25, velocidad: 7, cabeza: 0.15 },
  LSC_examen: { der: [-1.8, 0.2], izq: [-0.4, -0.2], amplitud: 0.35, velocidad: 9, cabeza: -0.1 },
  LSC_profesor: { der: [-2.2, 0.4], izq: [-0.2, -0.1], amplitud: 0.2, velocidad: 5, cabeza: 0 },
  LSC_estudiante: { der: [-1.0, 0.5], izq: [-1.0, -0.5], amplitud: 0.3, velocidad: 6, cabeza: 0.2 },
  LSC_universidad: { der: [-2.4, 0.6], izq: [-2.4, -0.6], amplitud: 0.15, velocidad: 4, cabeza: -0.15 },
  LSC_clase: { der: [-1.2, 0.1], izq: [-1.2, -0.1], amplitud: 0.4, velocidad: 8, cabeza: 0 },
  LSC_estudiar: { der: [-1.5, 0.2], izq: [-1.5, -0.2], amplitud: 0.2, velocidad: 10, cabeza: 0.3 },
  LSC_aprender: { der: [-1.9, 0.3], izq: [-1.3, -0.4], amplitud: 0.3, velocidad: 6, cabeza: 0.1 },
  LSC_libro: { der: [-1.3, 0.6], izq: [-1.3, -0.6], amplitud: 0.25, velocidad: 5, cabeza: 0.25 },
  LSC_pregunta: { der: [-2.0, 0.2], izq: [-0.3, -0.1], amplitud: 0.45, velocidad: 8, cabeza: -0.2 },
};

const POSE_REPOSO = { der: [0, 0.12], izq: [0, -0.12], amplitud: 0, velocidad: 0, cabeza: 0 };

// Para los IDs sin mapeo manual (números, vocabulario nuevo) se genera un
// gesto determinista a partir del nombre, así cada seña se ve distinta
// sin tener que definirla a mano.
const gestosGenerados = new Map();

function obtenerGesto(animacion) {
  if (GESTOS[animacion]) return GESTOS[animacion];
  if (!gestosGenerados.has(animacion)) {
    let hash = 0;
    for (const caracter of animacion) hash = (hash * 31 + caracter.charCodeAt(0)) >>> 0;
    const aleatorio = (desplazamiento) => ((hash >> desplazamiento) % 97) / 97;
    gestosGenerados.set(animacion, {
      der: [-0.8 - aleatorio(0) * 1.6, 0.1 + aleatorio(3) * 0.5],
      izq: [-0.8 - aleatorio(6) * 1.6, -(0.1 + aleatorio(9) * 0.5)],
      amplitud: 0.15 + aleatorio(12) * 0.3,
      velocidad: 4 + aleatorio(15) * 6,
      cabeza: (aleatorio(18) - 0.5) * 0.5,
    });
  }
  return gestosGenerados.get(animacion);
}

const PIEL = '#e0ac69';
const CAMISA = '#2563eb';

function Brazo({ lado, grupoRef }) {
  // El grupo pivota en el hombro; el brazo y la mano cuelgan hacia abajo
  return (
    <group ref={grupoRef} position={[lado * 0.42, 1.32, 0]}>
      <mesh position={[0, -0.3, 0]}>
        <boxGeometry args={[0.16, 0.6, 0.16]} />
        <meshStandardMaterial color={CAMISA} />
      </mesh>
      <mesh position={[0, -0.66, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color={PIEL} />
      </mesh>
    </group>
  );
}

export default function Avatar3D({ animacion }) {
  const brazoDer = useRef();
  const brazoIzq = useRef();
  const cabeza = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const gesto = animacion ? obtenerGesto(animacion) : POSE_REPOSO;
    const oscilacion = Math.sin(t * gesto.velocidad) * gesto.amplitud;

    // Interpolación suave hacia la pose del gesto actual
    const suavizado = 0.12;
    if (brazoDer.current && brazoIzq.current && cabeza.current) {
      brazoDer.current.rotation.x = THREE.MathUtils.lerp(
        brazoDer.current.rotation.x, gesto.der[0] + oscilacion, suavizado);
      brazoDer.current.rotation.z = THREE.MathUtils.lerp(
        brazoDer.current.rotation.z, gesto.der[1], suavizado);
      brazoIzq.current.rotation.x = THREE.MathUtils.lerp(
        brazoIzq.current.rotation.x, gesto.izq[0] - oscilacion, suavizado);
      brazoIzq.current.rotation.z = THREE.MathUtils.lerp(
        brazoIzq.current.rotation.z, gesto.izq[1], suavizado);
      cabeza.current.rotation.x = THREE.MathUtils.lerp(
        cabeza.current.rotation.x, gesto.cabeza, suavizado);
    }
  });

  return (
    <group position={[0, -1, 0]}>
      {/* Cabeza */}
      <group ref={cabeza} position={[0, 1.72, 0]}>
        <mesh>
          <sphereGeometry args={[0.24, 32, 32]} />
          <meshStandardMaterial color={PIEL} />
        </mesh>
        {/* Ojos */}
        <mesh position={[-0.08, 0.04, 0.2]}>
          <sphereGeometry args={[0.03, 12, 12]} />
          <meshStandardMaterial color="#1f2937" />
        </mesh>
        <mesh position={[0.08, 0.04, 0.2]}>
          <sphereGeometry args={[0.03, 12, 12]} />
          <meshStandardMaterial color="#1f2937" />
        </mesh>
      </group>
      {/* Cuello */}
      <mesh position={[0, 1.46, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.12, 16]} />
        <meshStandardMaterial color={PIEL} />
      </mesh>
      {/* Torso */}
      <mesh position={[0, 1.05, 0]}>
        <boxGeometry args={[0.68, 0.72, 0.32]} />
        <meshStandardMaterial color={CAMISA} />
      </mesh>
      {/* Brazos (pivotan en los hombros) */}
      <Brazo lado={1} grupoRef={brazoDer} />
      <Brazo lado={-1} grupoRef={brazoIzq} />
      {/* Base */}
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.22, 0.3, 0.6, 24]} />
        <meshStandardMaterial color="#374151" />
      </mesh>
    </group>
  );
}
