export type SessionCode = 'A' | 'B' | 'C' | 'E' | 'F'
export type DayPlan = SessionCode | 'CARDIO' | 'REST'
export type DayType = 'leg' | 'other' | 'refeed'
export type SetType = 'WU' | 'FD' | 'WS' | 'TS' | 'BO' | 'CS' | 'DROP' | 'STD'

/** Bloque de series de un ejercicio: `count` series de tipo `type` con `reps` repeticiones. */
export interface SetBlock {
  type: SetType
  count: number
  reps?: string
}

export interface Exercise {
  id: string
  name: string
  /** id en free-exercise-db (dominio público) para las fotos, si existe equivalente */
  imageId?: string
  muscle: string
  blocks: SetBlock[]
  note?: string
  /** ejercicio de mayor riesgo: en rutina ajustada se deja 1–2 repeticiones en reserva */
  keepReserve?: boolean
}

export interface PlannedSet {
  exerciseId: string
  index: number
  type: SetType
  reps?: string
}

export interface SetLog {
  exerciseId: string
  index: number
  type: SetType
  weight: number
  reps: number
}

export interface WorkoutLog {
  id?: number
  date: string // YYYY-MM-DD
  code: SessionCode
  sets: SetLog[]
  done: boolean
  energy?: number // 1-5
  sleepHours?: number
}

export interface DayLog {
  date: string
  water: number // vasos de 250 ml
  mobility: boolean
  abs: boolean
  calves: boolean
  creatine: boolean
  cardioMin: number
  steps?: number
  refeed: boolean
  meals: Record<string, { done: boolean; choice?: string }>
  free: { id: string; name: string; kcal: number; protein: number; carbs: number; fat: number }[]
}

export interface BodyMetric {
  id?: number
  date: string
  weightKg: number
  bodyFatPct?: number
  bodyFatKg?: number
  skeletalMuscleKg?: number
  leanMassKg?: number
  bmr?: number
  bmi?: number
  visceralFat?: number
  waterL?: number
  phaseAngle?: number
  waistCm?: number
  hipCm?: number
  source: 'inbody' | 'manual'
}

export interface Settings {
  id: 'main'
  activityFactor: number
  deficitKcal: number
  proteinPerKg: number
  fatG: number
  legCarbBonusG: number
  refeedEveryDays: number
  lastRefeed?: string
  adjustedRoutine: boolean
  restSeconds: number
  planStart: string
  goalBodyFatPct: number
  week: Record<number, DayPlan> // 0 = domingo
}

export interface MacroTarget {
  kcal: number
  protein: number
  carbs: number
  fat: number
}
