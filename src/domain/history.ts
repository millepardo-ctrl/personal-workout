import { MENUS } from '../data/meals.seed'
import { addDays, mondayOf, toISODate } from './dates'
import { dayTypeFor } from './schedule'
import { e1rm, volume } from './training'
import type { BodyMetric, DayLog, DayPlan, MacroTarget, WorkoutLog } from './types'
import { sumMacros } from './nutrition'

export type DayState = 'done' | 'partial' | 'missed' | 'cardio' | 'rest' | 'pending' | 'future' | 'none'

/** Semanas (lunes primero) del mes; las celdas fuera del mes son null. month es 0–11. */
export function monthGrid(year: number, month: number): (string | null)[][] {
  const first = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const offset = (first.getDay() + 6) % 7
  const cells: (string | null)[] = Array(offset).fill(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(toISODate(new Date(year, month, d)))
  while (cells.length % 7) cells.push(null)
  const weeks: (string | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

const isSession = (p: DayPlan) => p !== 'CARDIO' && p !== 'REST'

export interface StatusInput {
  date: string
  today: string
  /** primer día que cuenta (inicio del plan o primer dato): antes de eso no se marca incumplido */
  since: string
  plan: DayPlan
  workout?: WorkoutLog
  day?: DayLog
}

/**
 * Estado de un día para el calendario. La sesión realmente registrada manda sobre la planificada
 * (si cambió el orden de la semana, el pasado no se reescribe).
 */
export function dayStatus({ date, today, since, plan, workout, day }: StatusInput): DayState {
  if (date > today) return 'future'
  if (workout?.done) return 'done'
  const planned = workout ? workout.code : plan
  const hasSets = !!workout && workout.sets.some((s) => s.reps > 0)
  const cardio = (day?.cardioMin ?? 0) > 0
  // hoy con sesión planificada y aún sin empezar: pendiente, aunque ya haya hecho cardio
  if (date === today && isSession(planned) && !hasSets) return 'pending'
  if (hasSets) return date === today ? 'pending' : 'partial'
  if (cardio) return 'cardio'
  if (date < since) return 'none'
  if (planned === 'REST') return 'rest'
  return date === today ? 'pending' : 'missed'
}

export function adherence(day: DayLog | undefined, mealCount: number): number {
  if (!day || !mealCount) return 0
  const done = Object.values(day.meals).filter((m) => m.done).length
  return Math.min(1, done / mealCount)
}

/** Macros consumidos ese día (comidas marcadas del menú + comidas libres). */
export function consumedFor(day: DayLog | undefined, plan: DayPlan): MacroTarget {
  if (!day) return { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  const type = dayTypeFor(plan, day.refeed)
  return sumMacros([...MENUS[type].filter((m) => day.meals[m.slot]?.done).map((m) => m.macros), ...day.free])
}

export function mealCountFor(day: DayLog | undefined, plan: DayPlan): number {
  return MENUS[dayTypeFor(plan, day?.refeed ?? false)].length
}

export function weekDays(date: string): string[] {
  const mon = mondayOf(date)
  return Array.from({ length: 7 }, (_, i) => addDays(mon, i))
}

/** Racha de días cumplidos terminando hoy/ayer: descansos y días sin resolver no la rompen; un día perdido o parcial sí. */
export function streak(states: DayState[]): number {
  let n = 0
  for (let i = states.length - 1; i >= 0; i--) {
    const s = states[i]
    if (s === 'done' || s === 'cardio') n++
    else if (s === 'missed' || s === 'partial') break
  }
  return n
}

const bestE1rm = (sets: WorkoutLog['sets']) =>
  sets.filter((s) => s.weight > 0 && s.reps > 0).reduce((m, s) => Math.max(m, e1rm(s.weight, s.reps)), 0)

export interface PersonalRecord { exerciseId: string; previous: number; now: number }

/** Récord = mejor 1RM estimado de la semana que supera al mejor anterior (si no había antecedente no cuenta). */
export function personalRecords(week: WorkoutLog[], before: WorkoutLog[]): PersonalRecord[] {
  const best = (ws: WorkoutLog[]) => {
    const m = new Map<string, number>()
    for (const w of ws) {
      for (const id of new Set(w.sets.map((s) => s.exerciseId))) {
        m.set(id, Math.max(m.get(id) ?? 0, bestE1rm(w.sets.filter((s) => s.exerciseId === id))))
      }
    }
    return m
  }
  const prev = best(before)
  const prs: PersonalRecord[] = []
  for (const [id, now] of best(week)) {
    const p = prev.get(id)
    if (p && now > p) prs.push({ exerciseId: id, previous: p, now })
  }
  return prs
}

export interface WeekSummary {
  sessionsDone: number
  sessionsPlanned: number
  cardioMin: number
  mealAdherence: number // 0–1 promedio de los días transcurridos
  proteinAvg: number
  waterAvg: number // vasos
  volume: number
  prevVolume: number
  volumeDelta?: number // % vs semana previa
  prs: PersonalRecord[]
  weightChange?: number
  streak: number
  states: Record<string, DayState>
}

export interface WeekInput {
  days: string[]
  today: string
  since: string
  planOf: (date: string) => DayPlan
  workouts: WorkoutLog[]
  dayLogs: DayLog[]
  prevWeekWorkouts: WorkoutLog[]
  /** todos los entrenamientos anteriores a la semana (para detectar récords) */
  earlier: WorkoutLog[]
  metrics?: BodyMetric[]
}

export function weekSummary(i: WeekInput): WeekSummary {
  const wByDate = new Map(i.workouts.map((w) => [w.date, w]))
  const dByDate = new Map(i.dayLogs.map((d) => [d.date, d]))
  const states: Record<string, DayState> = {}
  for (const date of i.days) {
    states[date] = dayStatus({ date, today: i.today, since: i.since, plan: i.planOf(date), workout: wByDate.get(date), day: dByDate.get(date) })
  }
  const elapsed = i.days.filter((d) => d <= i.today && d >= i.since)
  const done = i.workouts.filter((w) => w.done)
  const sessionsPlanned = i.days.filter((d) => isSession(i.planOf(d))).length
  const logged = elapsed.map((d) => dByDate.get(d)).filter((d): d is DayLog => !!d)
  const mealAdh = elapsed.map((d) => adherence(dByDate.get(d), mealCountFor(dByDate.get(d), i.planOf(d))))
  const protein = logged.map((d) => consumedFor(d, i.planOf(d.date)).protein).filter((p) => p > 0)
  const vol = volume(done.flatMap((w) => w.sets))
  const prevVol = volume(i.prevWeekWorkouts.filter((w) => w.done).flatMap((w) => w.sets))
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)

  let weightChange: number | undefined
  const ms = [...(i.metrics ?? [])].sort((a, b) => a.date.localeCompare(b.date))
  const inWeek = ms.filter((m) => m.date >= i.days[0] && m.date <= i.days[6])
  const prior = ms.filter((m) => m.date < i.days[0]).at(-1)
  if (inWeek.length) {
    const ref = prior ?? (inWeek.length > 1 ? inWeek[0] : undefined)
    if (ref) weightChange = Math.round((inWeek.at(-1)!.weightKg - ref.weightKg) * 10) / 10
  }

  return {
    sessionsDone: done.length,
    sessionsPlanned,
    cardioMin: logged.reduce((a, d) => a + d.cardioMin, 0),
    mealAdherence: avg(mealAdh),
    proteinAvg: Math.round(avg(protein)),
    waterAvg: Math.round(avg(elapsed.map((d) => dByDate.get(d)?.water ?? 0)) * 10) / 10,
    volume: vol,
    prevVolume: prevVol,
    volumeDelta: prevVol > 0 ? Math.round(((vol - prevVol) / prevVol) * 100) : undefined,
    prs: personalRecords(done, i.earlier),
    weightChange,
    streak: streak(i.days.filter((d) => d <= i.today).map((d) => states[d])),
    states,
  }
}

/** Frase de lectura de la semana con reglas simples. */
export function readingFor(s: WeekSummary, weekIsOver: boolean): string {
  const missing = s.sessionsPlanned - s.sessionsDone
  const parts: string[] = []
  if (s.sessionsPlanned === 0) return 'Semana sin sesiones planificadas.'
  if (s.sessionsDone >= s.sessionsPlanned) parts.push(`Semana completa: ${s.sessionsDone}/${s.sessionsPlanned} sesiones.`)
  else if (weekIsOver) parts.push((missing === 1 ? 'Faltó 1 sesión' : `Faltaron ${missing} sesiones`) + ': prioriza no perder dos días seguidos.')
  else parts.push(`Llevas ${s.sessionsDone}/${s.sessionsPlanned} sesiones esta semana.`)
  if (s.prs.length) parts.push(`${s.prs.length} récord${s.prs.length === 1 ? '' : 's'} personal${s.prs.length === 1 ? '' : 'es'} 💪`)
  if (s.volumeDelta != null) parts.push(`Volumen ${s.volumeDelta >= 0 ? '+' : ''}${s.volumeDelta}% vs la semana anterior.`)
  if (s.mealAdherence && s.mealAdherence < 0.6) parts.push('La alimentación fue lo más flojo: marca las comidas del menú para ver dónde se te escapa.')
  else if (s.mealAdherence >= 0.8) parts.push('Muy buena adherencia a la comida.')
  return parts.join(' ')
}
