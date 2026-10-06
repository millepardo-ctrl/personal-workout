import type { Exercise, SessionCode } from '../domain/types'

const b = (type: Exercise['blocks'][number]['type'], count: number, reps?: string) => ({ type, count, reps })

/** Rutina del coach (PDF "Rutina de entrenamiento"). Las imágenes vienen de free-exercise-db (dominio público). */
export const SESSIONS: Record<SessionCode, { title: string; focus: string; exercises: Exercise[] }> = {
  A: {
    title: 'Entrenamiento A',
    focus: 'Femorales y glúteo',
    exercises: [
      { id: 'a-curl-acostada', name: 'Curl de femoral acostada', imageId: 'Lying_Leg_Curls', muscle: 'Femorales', blocks: [b('FD', 1), b('WS', 1), b('TS', 1)] },
      { id: 'a-curl-sentado', name: 'Curl de femoral sentado', imageId: 'Seated_Leg_Curl', muscle: 'Femorales', blocks: [b('STD', 3, '10–12')], note: 'Contracción de 2 s.' },
      { id: 'a-rumano', name: 'Peso muerto rumano', imageId: 'Romanian_Deadlift', muscle: 'Femorales / glúteo', blocks: [b('STD', 3, '12–15')], note: 'Trabaja con el 80 % de tu carga máxima.', keepReserve: true },
      { id: 'a-hip-thrust', name: 'Hip thrust', imageId: 'Barbell_Hip_Thrust', muscle: 'Glúteo', blocks: [b('FD', 1), b('WS', 1), b('TS', 1)] },
      { id: 'a-abduccion', name: 'Abducción en máquina', imageId: 'Thigh_Abductor', muscle: 'Glúteo medio', blocks: [b('STD', 4, '10–12')], note: 'Contracción máxima.' },
      { id: 'a-patada-diagonal', name: 'Patada de glúteo diagonal (polea)', imageId: 'One-Legged_Cable_Kickback', muscle: 'Glúteo', blocks: [b('FD', 1), b('STD', 3, '10–12')], note: 'Contracción máxima.' },
    ],
  },
  B: {
    title: 'Entrenamiento B',
    focus: 'Hombro y tríceps',
    exercises: [
      { id: 'b-press-militar', name: 'Press militar con máquina', imageId: 'Leverage_Shoulder_Press', muscle: 'Hombro', blocks: [b('WU', 1), b('STD', 3, '10–12')], note: 'Excéntrica de 3 s.' },
      { id: 'b-vuelo-frontal', name: 'Vuelos frontales en polea con cuerda', imageId: 'Front_Cable_Raise', muscle: 'Hombro anterior', blocks: [b('STD', 3, '10–12')], note: 'Excéntrica de 2 s.' },
      { id: 'b-vuelo-lat-manc', name: 'Vuelos laterales con mancuerna', imageId: 'Side_Lateral_Raise', muscle: 'Hombro lateral', blocks: [b('STD', 3, '10–12')], note: 'Peso máximo.' },
      { id: 'b-vuelo-lat-polea', name: 'Vuelos laterales en polea', imageId: 'Cable_Seated_Lateral_Raise', muscle: 'Hombro lateral', blocks: [b('STD', 3, '10–12')], note: 'Peso máximo.' },
      { id: 'b-posterior', name: 'Posterior en máquina invertida', imageId: 'Reverse_Machine_Flyes', muscle: 'Hombro posterior', blocks: [b('STD', 3, '12–15')], note: 'Casi al fallo, 2 repeticiones en reserva.' },
      { id: 'b-triceps', name: 'Extensión de tríceps con barra en polea', imageId: 'Triceps_Pushdown', muscle: 'Tríceps', blocks: [b('STD', 3, '10–12')], note: 'Casi al fallo, 1 repetición en reserva.' },
    ],
  },
  C: {
    title: 'Entrenamiento C',
    focus: 'Cuádriceps',
    exercises: [
      { id: 'c-sentadilla', name: 'Sentadilla en Smith o hack', imageId: 'Smith_Machine_Squat', muscle: 'Cuádriceps / glúteo', blocks: [b('WU', 1), b('FD', 1), b('WS', 1), b('TS', 1)], keepReserve: true },
      { id: 'c-extensiones', name: 'Extensiones', imageId: 'Leg_Extensions', muscle: 'Cuádriceps', blocks: [b('FD', 1), b('STD', 3, '12–15'), b('DROP', 1)], note: 'Contracción de 2 s.' },
      { id: 'c-prensa', name: 'Prensa inclinada', imageId: 'Leg_Press', muscle: 'Cuádriceps / glúteo', blocks: [b('FD', 1), b('WS', 1), b('TS', 1), b('BO', 1)] },
      { id: 'c-bulgaras', name: 'Búlgaras', imageId: 'Split_Squat_with_Dumbbells', muscle: 'Cuádriceps / glúteo', blocks: [b('STD', 4, '12–15')], note: '3 series casi al fallo y la última al fallo con máximo peso.', keepReserve: true },
      { id: 'c-aduccion', name: 'Aducción en máquina', imageId: 'Thigh_Adductor', muscle: 'Aductores', blocks: [b('STD', 4, '12–15')], note: 'Peso máximo.' },
    ],
  },
  E: {
    title: 'Entrenamiento E',
    focus: 'Espalda y bíceps',
    exercises: [
      { id: 'e-jalon', name: 'Jalón al pecho agarre prono', imageId: 'Wide-Grip_Lat_Pulldown', muscle: 'Dorsal', blocks: [b('WU', 1), b('FD', 1), b('WS', 1), b('TS', 1)] },
      { id: 'e-remo-uni', name: 'Remo unilateral agarre neutro o supino', imageId: 'Seated_Cable_Rows', muscle: 'Dorsal', blocks: [b('FD', 1), b('WS', 1), b('TS', 1)] },
      { id: 'e-remo-maq', name: 'Remo en máquina agarre prono', imageId: 'Leverage_High_Row', muscle: 'Espalda alta', blocks: [b('WU', 1), b('FD', 1), b('WS', 1), b('TS', 1)] },
      { id: 'e-vuelo-post', name: 'Vuelos posteriores con mancuerna', imageId: 'Bent_Over_Dumbbell_Rear_Delt_Raise_With_Head_On_Bench', muscle: 'Hombro posterior', blocks: [b('STD', 4, '10–12')] },
      { id: 'e-vuelo-sentado', name: 'Vuelos laterales sentado con mancuerna', imageId: 'Seated_Side_Lateral_Raise', muscle: 'Hombro lateral', blocks: [b('STD', 3, '12–15'), b('BO', 1)], note: 'Peso máximo.' },
      { id: 'e-curl-bayesian', name: 'Curl de bíceps bayesian unilateral', imageId: 'Standing_One-Arm_Cable_Curl', muscle: 'Bíceps', blocks: [b('STD', 4, '10–12')], note: 'Máxima contracción.' },
    ],
  },
  F: {
    title: 'Entrenamiento F',
    focus: 'Glúteo, femoral y cuádriceps',
    exercises: [
      { id: 'f-abduccion', name: 'Abducción en máquina', imageId: 'Thigh_Abductor', muscle: 'Glúteo medio', blocks: [b('FD', 1), b('WS', 1), b('TS', 1)] },
      { id: 'f-hip-thrust', name: 'Hip thrusts', imageId: 'Barbell_Hip_Thrust', muscle: 'Glúteo', blocks: [b('FD', 1), b('STD', 2, '10–12')], note: 'Máxima contracción, al fallo.' },
      { id: 'f-patada-abajo', name: 'Patada de glúteo hacia abajo (polea)', imageId: 'One-Legged_Cable_Kickback', muscle: 'Glúteo', blocks: [b('FD', 1), b('STD', 3, '10–12')], note: 'Máximo peso.' },
      { id: 'f-estocada', name: 'Estocada en Smith con step', imageId: 'Smith_Single-Leg_Split_Squat', muscle: 'Glúteo / cuádriceps', blocks: [b('STD', 3, '10–12')], note: 'Casi al fallo.', keepReserve: true },
      { id: 'f-curl-acostada', name: 'Curl de femoral acostada', imageId: 'Lying_Leg_Curls', muscle: 'Femorales', blocks: [b('FD', 1), b('WS', 1), b('DROP', 1)] },
      { id: 'f-extensiones', name: 'Extensiones', imageId: 'Leg_Extensions', muscle: 'Cuádriceps', blocks: [b('WU', 1), b('STD', 2, '12–15'), b('DROP', 1)], note: 'Contracción máxima de 2 s.' },
    ],
  },
}

export interface ExtraItem { id: string; name: string; detail: string; imageId?: string }

export const ABS: ExtraItem[] = [
  { id: 'abs-crunch', name: 'Crunch', detail: '3 series × 12–15 repeticiones', imageId: 'Crunches' },
  { id: 'abs-plancha', name: 'Plancha', detail: '3 series × 60 segundos', imageId: 'Plank' },
]

export const CALVES: ExtraItem[] = [
  { id: 'cal-sentado', name: 'Elevación de talón sentado en máquina', detail: '4 series × 12–15 repeticiones', imageId: 'Seated_Calf_Raise' },
  { id: 'cal-pie', name: 'Elevación de talón en máquina o Smith', detail: '4 series × 12–15 repeticiones', imageId: 'Smith_Machine_Calf_Raise' },
]

export const MOBILITY: ExtraItem[] = [
  { id: 'mov-1', name: 'Estiramiento de isquiotibiales sentado', detail: '2 series × 30 s', imageId: 'Seated_Floor_Hamstring_Stretch' },
  { id: 'mov-2', name: 'Flexor de cadera (rodilla en suelo)', detail: '3 series × 8 repeticiones por pierna + 10 s isométrico', imageId: 'Kneeling_Hip_Flexor' },
  { id: 'mov-3', name: 'Mariposa (aductores)', detail: '2 series × 30 s' },
  { id: 'mov-4', name: 'Postura de la rana / cadera', detail: '1 serie × 60 s' },
  { id: 'mov-5', name: 'Estiramiento de cuádriceps tumbada', detail: '1 serie × 60 s' },
]

export const REST_SECONDS_DEFAULT = 150 // coach: 120–180 s

export function allExercises(): Exercise[] {
  return Object.values(SESSIONS).flatMap((s) => s.exercises)
}

export function imageIds(): string[] {
  const ids = [...allExercises().map((e) => e.imageId), ...[...ABS, ...CALVES, ...MOBILITY].map((e) => e.imageId)]
  return [...new Set(ids.filter((x): x is string => !!x))]
}
