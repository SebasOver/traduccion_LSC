// Poses por keyframes para el avatar placeholder. Cada seña define una línea
// de tiempo (t de 0 a 1, escalada a la duración del diccionario) con poses
// parciales: lo no especificado en un keyframe se hereda del anterior.
//
// Canales (rotaciones en radianes):
//   cabeza: [x, y]
//   brazoDer/brazoIzq: { hombro: [x, y, z], codo: x, muneca: [x, z] }
//   manoDer/manoIzq: { dedos: [índice, medio, anular, meñique], pulgar }
//     (0 = dedo extendido, 1 = cerrado)
//
// Estas poses son aproximaciones para el prototipo; las señas definitivas
// vendrán de la captura de movimiento (ver herramientas/captura-movimiento)
// o de clips animados en Blender.

const abierta = { dedos: [0, 0, 0, 0], pulgar: 0 };
const puno = { dedos: [1, 1, 1, 1], pulgar: 0.9 };
const indice = { dedos: [0, 1, 1, 1], pulgar: 0.9 };

export const POSE_BASE = {
  cabeza: [0, 0],
  brazoDer: { hombro: [0, 0, 0.12], codo: -0.15, muneca: [0, 0] },
  brazoIzq: { hombro: [0, 0, -0.12], codo: -0.15, muneca: [0, 0] },
  manoDer: { dedos: [0.25, 0.25, 0.25, 0.25], pulgar: 0.25 },
  manoIzq: { dedos: [0.25, 0.25, 0.25, 0.25], pulgar: 0.25 },
};

// Pose común para señar números con la mano derecha en alto
const numeroBase = (mano) => [
  { t: 0, brazoDer: { hombro: [-2.3, 0, 0.3], codo: -0.5 }, manoDer: mano },
  { t: 1, brazoDer: { hombro: [-2.3, 0, 0.3] } },
];

export const POSES = {
  LSC_hola: [
    { t: 0, brazoDer: { hombro: [-2.7, 0, 0.45], codo: -0.3, muneca: [0, 0.4] }, manoDer: abierta },
    { t: 0.25, brazoDer: { muneca: [0, -0.4] } },
    { t: 0.5, brazoDer: { muneca: [0, 0.4] } },
    { t: 0.75, brazoDer: { muneca: [0, -0.4] } },
    { t: 1, brazoDer: { muneca: [0, 0.2] } },
  ],
  LSC_adios: [
    { t: 0, brazoDer: { hombro: [-2.8, 0, 0.3], codo: -0.2 }, manoDer: abierta },
    { t: 0.33, brazoDer: { hombro: [-2.8, 0, 0.7] } },
    { t: 0.66, brazoDer: { hombro: [-2.8, 0, 0.3] } },
    { t: 1, brazoDer: { hombro: [-2.8, 0, 0.6] } },
  ],
  LSC_gracias: [
    { t: 0, brazoDer: { hombro: [-2.3, 0, 0.1], codo: -2.3 }, manoDer: abierta, cabeza: [0.15, 0] },
    { t: 0.4, brazoDer: { hombro: [-2.3, 0, 0.1], codo: -2.3 } },
    { t: 0.8, brazoDer: { hombro: [-1.8, 0, 0.2], codo: -0.9 }, cabeza: [0.05, 0] },
    { t: 1, brazoDer: { hombro: [-1.8, 0, 0.25], codo: -0.8 } },
  ],
  LSC_por_favor: [
    { t: 0, brazoDer: { hombro: [-1.6, 0.3, 0.2], codo: -1.9 }, manoDer: abierta },
    { t: 0.33, brazoDer: { hombro: [-1.5, 0.1, 0.32] } },
    { t: 0.66, brazoDer: { hombro: [-1.7, 0, 0.15] } },
    { t: 1, brazoDer: { hombro: [-1.6, 0.3, 0.2] } },
  ],
  LSC_si: [
    { t: 0, brazoDer: { hombro: [-1.9, 0, 0.25], codo: -0.9, muneca: [0.4, 0] }, manoDer: puno },
    { t: 0.33, brazoDer: { muneca: [-0.4, 0] } },
    { t: 0.66, brazoDer: { muneca: [0.4, 0] } },
    { t: 1, brazoDer: { muneca: [0, 0] } },
  ],
  LSC_no: [
    { t: 0, brazoDer: { hombro: [-2.2, 0, 0.3], codo: -0.6, muneca: [0, 0.4] }, manoDer: indice, cabeza: [0, 0.2] },
    { t: 0.33, brazoDer: { muneca: [0, -0.4] }, cabeza: [0, -0.2] },
    { t: 0.66, brazoDer: { muneca: [0, 0.4] }, cabeza: [0, 0.2] },
    { t: 1, brazoDer: { muneca: [0, 0] }, cabeza: [0, 0] },
  ],
  LSC_bien: [
    { t: 0, brazoDer: { hombro: [-1.7, 0, 0.2], codo: -0.4 }, manoDer: { dedos: [1, 1, 1, 1], pulgar: 0 } },
    { t: 0.5, brazoDer: { hombro: [-1.85, 0, 0.2] } },
    { t: 1, brazoDer: { hombro: [-1.7, 0, 0.2] } },
  ],
  LSC_muy_bien: [
    {
      t: 0,
      brazoDer: { hombro: [-1.7, 0, 0.25], codo: -0.4 },
      brazoIzq: { hombro: [-1.7, 0, -0.25], codo: -0.4 },
      manoDer: { dedos: [1, 1, 1, 1], pulgar: 0 },
      manoIzq: { dedos: [1, 1, 1, 1], pulgar: 0 },
    },
    { t: 0.5, brazoDer: { hombro: [-1.9, 0, 0.25] }, brazoIzq: { hombro: [-1.9, 0, -0.25] } },
    { t: 1, brazoDer: { hombro: [-1.7, 0, 0.25] }, brazoIzq: { hombro: [-1.7, 0, -0.25] } },
  ],
  LSC_sumar: [
    {
      t: 0,
      brazoDer: { hombro: [-1.4, 0, 0.7], codo: -0.4 },
      brazoIzq: { hombro: [-1.4, 0, -0.7], codo: -0.4 },
      manoDer: { dedos: [0.1, 0.1, 0.1, 0.1], pulgar: 0.1 },
      manoIzq: { dedos: [0.1, 0.1, 0.1, 0.1], pulgar: 0.1 },
    },
    {
      t: 0.55,
      brazoDer: { hombro: [-1.4, 0, 0.16] },
      brazoIzq: { hombro: [-1.4, 0, -0.16] },
      manoDer: { dedos: [0.6, 0.6, 0.6, 0.6], pulgar: 0.6 },
      manoIzq: { dedos: [0.6, 0.6, 0.6, 0.6], pulgar: 0.6 },
    },
    { t: 1, brazoDer: { hombro: [-1.4, 0, 0.16] } },
  ],
  LSC_restar: [
    {
      t: 0,
      brazoIzq: { hombro: [-1.5, 0, -0.2], codo: -0.4 },
      brazoDer: { hombro: [-1.9, 0, 0.25], codo: -0.8 },
      manoDer: abierta,
      manoIzq: abierta,
    },
    { t: 0.55, brazoDer: { hombro: [-1.2, 0, 0.2], codo: -0.2 }, manoDer: { dedos: [0.8, 0.8, 0.8, 0.8], pulgar: 0.7 } },
    { t: 1, brazoDer: { hombro: [-1.2, 0, 0.2] } },
  ],
  LSC_multiplicar: [
    {
      t: 0,
      brazoDer: { hombro: [-1.6, 0, 0.5], codo: -0.4 },
      brazoIzq: { hombro: [-1.6, 0, -0.5], codo: -0.4 },
      manoDer: indice,
      manoIzq: indice,
    },
    { t: 0.5, brazoDer: { hombro: [-1.6, 0, -0.18] }, brazoIzq: { hombro: [-1.6, 0, 0.18] } },
    { t: 1, brazoDer: { hombro: [-1.6, 0, -0.18] } },
  ],
  LSC_dividir: [
    {
      t: 0,
      brazoIzq: { hombro: [-1.5, 0, -0.15], codo: -0.5 },
      brazoDer: { hombro: [-2.0, 0, 0.35], codo: -0.6, muneca: [0, 1.2] },
      manoDer: abierta,
      manoIzq: abierta,
    },
    { t: 0.5, brazoDer: { hombro: [-1.5, 0, 0.1], codo: -0.3 } },
    { t: 1, brazoDer: { hombro: [-1.5, 0, 0.1] } },
  ],
  LSC_igual: [
    {
      t: 0,
      brazoDer: { hombro: [-1.5, 0, 0.3], codo: -0.5 },
      brazoIzq: { hombro: [-1.5, 0, -0.3], codo: -0.5 },
      manoDer: abierta,
      manoIzq: abierta,
    },
    { t: 0.35, brazoDer: { hombro: [-1.5, 0, 0.12] }, brazoIzq: { hombro: [-1.5, 0, -0.12] } },
    { t: 0.55, brazoDer: { hombro: [-1.5, 0, 0.3] }, brazoIzq: { hombro: [-1.5, 0, -0.3] } },
    { t: 0.8, brazoDer: { hombro: [-1.5, 0, 0.12] }, brazoIzq: { hombro: [-1.5, 0, -0.12] } },
    { t: 1, brazoDer: { hombro: [-1.5, 0, 0.2] }, brazoIzq: { hombro: [-1.5, 0, -0.2] } },
  ],
  LSC_pregunta: [
    { t: 0, brazoDer: { hombro: [-2.1, 0, 0.25], codo: -0.5 }, manoDer: indice },
    { t: 0.4, brazoDer: { hombro: [-2.3, 0, 0.45] } },
    { t: 0.7, brazoDer: { hombro: [-1.9, 0, 0.4] } },
    { t: 1, brazoDer: { hombro: [-1.8, 0, 0.25] } },
  ],
  LSC_cuanto: [
    {
      t: 0,
      brazoDer: { hombro: [-1.3, 0, 0.4], codo: -0.7, muneca: [0, 1.4] },
      brazoIzq: { hombro: [-1.3, 0, -0.4], codo: -0.7, muneca: [0, -1.4] },
      manoDer: { dedos: [0.15, 0.15, 0.15, 0.15], pulgar: 0.15 },
      manoIzq: { dedos: [0.15, 0.15, 0.15, 0.15], pulgar: 0.15 },
    },
    { t: 0.33, brazoDer: { hombro: [-1.2, 0, 0.4] }, brazoIzq: { hombro: [-1.4, 0, -0.4] } },
    { t: 0.66, brazoDer: { hombro: [-1.4, 0, 0.4] }, brazoIzq: { hombro: [-1.2, 0, -0.4] } },
    { t: 1, brazoDer: { hombro: [-1.3, 0, 0.4] }, brazoIzq: { hombro: [-1.3, 0, -0.4] } },
  ],
  LSC_profesor: [
    { t: 0, brazoDer: { hombro: [-2.5, 0, 0.25], codo: -2.0 }, manoDer: abierta },
    { t: 0.4, brazoDer: { codo: -1.7 } },
    { t: 0.7, brazoDer: { codo: -2.0 } },
    { t: 1, brazoDer: { codo: -1.8 } },
  ],
  LSC_escribir: [
    {
      t: 0,
      brazoIzq: { hombro: [-1.4, 0, -0.2], codo: -0.6, muneca: [0, -1.2] },
      brazoDer: { hombro: [-1.7, 0, 0.1], codo: -1.0 },
      manoIzq: abierta,
      manoDer: { dedos: [0.7, 0.7, 0.7, 0.7], pulgar: 0.7 },
    },
    { t: 0.33, brazoDer: { hombro: [-1.65, 0, 0.22] } },
    { t: 0.66, brazoDer: { hombro: [-1.7, 0, 0.05] } },
    { t: 1, brazoDer: { hombro: [-1.6, 0, 0.18] } },
  ],
  LSC_silencio: [
    { t: 0, brazoDer: { hombro: [-2.5, 0, 0.12], codo: -2.4 }, manoDer: indice, cabeza: [0.1, 0] },
    { t: 1, brazoDer: { hombro: [-2.5, 0, 0.12] } },
  ],
  LSC_tarea: [
    {
      t: 0,
      brazoIzq: { hombro: [-1.5, 0, -0.18], codo: -0.5 },
      brazoDer: { hombro: [-1.8, 0, 0.2], codo: -0.7 },
      manoDer: abierta,
      manoIzq: abierta,
    },
    { t: 0.4, brazoDer: { hombro: [-1.55, 0, 0.18] } },
    { t: 0.65, brazoDer: { hombro: [-1.75, 0, 0.2] } },
    { t: 1, brazoDer: { hombro: [-1.55, 0, 0.18] } },
  ],
  LSC_num_0: numeroBase({ dedos: [0.55, 0.55, 0.55, 0.55], pulgar: 0.55 }),
  LSC_num_1: numeroBase({ dedos: [0, 1, 1, 1], pulgar: 1 }),
  LSC_num_2: numeroBase({ dedos: [0, 0, 1, 1], pulgar: 1 }),
  LSC_num_3: numeroBase({ dedos: [0, 0, 0, 1], pulgar: 1 }),
  LSC_num_4: numeroBase({ dedos: [0, 0, 0, 0], pulgar: 1 }),
  LSC_num_5: numeroBase({ dedos: [0, 0, 0, 0], pulgar: 0 }),
};
