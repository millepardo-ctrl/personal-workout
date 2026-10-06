import type { DayType, MacroTarget } from './types'

export interface NutritionInput {
  bmr: number
  weightKg: number
  activityFactor?: number
  deficitKcal?: number
  proteinPerKg?: number
  fatG?: number
  legCarbBonusG?: number
  /** días de pierna y otros por semana (Lun–Vie: 3 pierna, 4 otros) */
  legDaysPerWeek?: number
}

export interface NutritionTargets {
  tdee: number
  averageKcal: number
  leg: MacroTarget
  other: MacroTarget
  refeed: MacroTarget
}

const round = (n: number) => Math.round(n)

/**
 * Metas a partir del InBody: TDEE = TMB × factor; promedio semanal = TDEE − déficit.
 * Día de pierna lleva +`legCarbBonusG` g de carbos respecto a los otros días, de modo que el
 * promedio semanal (3 pierna / 4 otros) coincida con la meta. Refeed = TDEE.
 */
export function computeTargets(i: NutritionInput): NutritionTargets {
  const activity = i.activityFactor ?? 1.55
  const deficit = i.deficitKcal ?? 200
  const protein = round(i.weightKg * (i.proteinPerKg ?? 2.1))
  const fat = i.fatG ?? 52
  const bonus = i.legCarbBonusG ?? 30
  const legDays = i.legDaysPerWeek ?? 3

  const tdee = round(i.bmr * activity)
  const average = tdee - deficit
  const bonusKcal = bonus * 4
  // average = (legDays*(x+bonus) + (7-legDays)*x)/7  →  x = average - legDays*bonus/7
  const otherKcal = round(average - (legDays * bonusKcal) / 7)
  const legKcal = otherKcal + bonusKcal

  const build = (kcal: number, f = fat): MacroTarget => ({
    kcal,
    protein,
    fat: f,
    carbs: round((kcal - protein * 4 - f * 9) / 4),
  })

  return { tdee, averageKcal: average, leg: build(legKcal), other: build(otherKcal), refeed: build(tdee, 35) }
}

export function targetFor(t: NutritionTargets, type: DayType): MacroTarget {
  return type === 'leg' ? t.leg : type === 'refeed' ? t.refeed : t.other
}

export function sumMacros(items: Partial<MacroTarget>[]): MacroTarget {
  return items.reduce<MacroTarget>(
    (a, m) => ({
      kcal: a.kcal + (m.kcal ?? 0),
      protein: a.protein + (m.protein ?? 0),
      carbs: a.carbs + (m.carbs ?? 0),
      fat: a.fat + (m.fat ?? 0),
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  )
}

/** Aviso si el peso baja demasiado rápido (> 0.8 kg/semana): subir calorías. */
export function rateWarning(kgPerWeek: number): string | null {
  if (kgPerWeek < -0.8) return 'Estás bajando más de 0.8 kg/semana: sube ~150 kcal para proteger el músculo.'
  return null
}
