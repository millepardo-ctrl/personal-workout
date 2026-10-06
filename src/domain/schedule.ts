import { daysBetween, fromISODate } from './dates'
import type { DayPlan, DayType, SessionCode } from './types'

/** Lun–Vie gym (A, B, C, E, F), Sáb/Dom cardio. Clave = Date.getDay() (0 = domingo). */
export const DEFAULT_WEEK: Record<number, DayPlan> = {
  1: 'A',
  2: 'B',
  3: 'C',
  4: 'E',
  5: 'F',
  6: 'CARDIO',
  0: 'CARDIO',
}

export const LEG_SESSIONS: SessionCode[] = ['A', 'C', 'F']

export function planFor(date: string, week: Record<number, DayPlan> = DEFAULT_WEEK): DayPlan {
  return week[fromISODate(date).getDay()] ?? 'REST'
}

export function isLegDay(plan: DayPlan): boolean {
  return plan !== 'CARDIO' && plan !== 'REST' && LEG_SESSIONS.includes(plan)
}

/** Refeed: cada N días desde el último, y siempre en día de pierna (Cap. 4 del plan). */
export function isRefeedDue(lastRefeed: string | undefined, today: string, every = 10): boolean {
  if (!lastRefeed) return false
  return daysBetween(lastRefeed, today) >= every
}

export function dayTypeFor(plan: DayPlan, refeedChosen: boolean): DayType {
  if (refeedChosen && isLegDay(plan)) return 'refeed'
  return isLegDay(plan) ? 'leg' : 'other'
}

/** Extras semanales del PDF: abdominales 3×/sem (Mar, Jue, Sáb), pantorrilla 3×/sem (Lun, Mié, Vie). */
export function extrasFor(date: string) {
  const dow = fromISODate(date).getDay()
  return {
    mobility: true,
    abs: [2, 4, 6].includes(dow),
    calves: [1, 3, 5].includes(dow),
  }
}

/** Cardio de escalera sugerido en la rutina ajustada (nunca después de A/C/F). */
export function stairCardio(plan: DayPlan): string | null {
  switch (plan) {
    case 'B':
    case 'E':
      return 'Escalera 15–20 min, ritmo moderado, al terminar la sesión'
    case 'CARDIO':
      return null // se decide por día en stairCardioForDate
    default:
      return null
  }
}

export function stairCardioForDate(date: string, plan: DayPlan): string | null {
  const dow = fromISODate(date).getDay()
  if (plan === 'CARDIO' && dow === 6) return 'Escalera 35–40 min, ritmo moderado constante (zona 2)'
  if (plan === 'CARDIO' && dow === 0) return 'Escalera 25–30 min en intervalos suaves o caminata inclinada'
  return stairCardio(plan)
}

/** Semana de descarga (−40 % de volumen): cada 6.ª semana desde el inicio del plan. */
export function isDeloadWeek(planStart: string, today: string): boolean {
  const week = Math.floor(daysBetween(planStart, today) / 7) + 1
  return week > 0 && week % 6 === 0
}

export function weekNumber(planStart: string, today: string): number {
  return Math.floor(daysBetween(planStart, today) / 7) + 1
}
