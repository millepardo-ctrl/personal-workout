import { DEFAULT_WEEK } from '../domain/schedule'
import { toISODate } from '../domain/dates'
import type { BodyMetric, Settings } from '../domain/types'

export function defaultSettings(): Settings {
  return {
    id: 'main',
    activityFactor: 1.55,
    deficitKcal: 200,
    proteinPerKg: 2.1,
    fatG: 52,
    legCarbBonusG: 30,
    refeedEveryDays: 10,
    adjustedRoutine: true,
    restSeconds: 150,
    planStart: toISODate(),
    goalBodyFatPct: 27,
    week: { ...DEFAULT_WEEK },
  }
}

/** InBody del 9 jul 2026 (capturas de la app InBody). Dato inicial provisional hasta subir uno nuevo. */
export const INBODY_JULY: BodyMetric = {
  date: '2026-07-09',
  weightKg: 64.4,
  bodyFatPct: 32.6,
  bodyFatKg: 21,
  skeletalMuscleKg: 41.2,
  leanMassKg: 43.4,
  bmr: 1316,
  bmi: 23.6,
  visceralFat: 5,
  waterL: 31.6,
  phaseAngle: 6,
  source: 'inbody',
}
