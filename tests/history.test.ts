import { describe, expect, it } from 'vitest'
import { mondayOf } from '../src/domain/dates'
import { adherence, dayStatus, monthGrid, personalRecords, readingFor, streak, weekDays, weekSummary } from '../src/domain/history'
import type { DayLog, DayPlan, WorkoutLog } from '../src/domain/types'
import { DEFAULT_WEEK, planFor } from '../src/domain/schedule'

const planOf = (d: string): DayPlan => planFor(d, DEFAULT_WEEK)
const wk = (date: string, code: WorkoutLog['code'], done: boolean, sets: [string, number, number][]): WorkoutLog => ({
  date, code, done, sets: sets.map(([exerciseId, weight, reps], index) => ({ exerciseId, index, type: 'STD', weight, reps })),
})
const day = (date: string, p: Partial<DayLog> = {}): DayLog => ({
  date, water: 0, mobility: false, abs: false, calves: false, creatine: false, cardioMin: 0, refeed: false, meals: {}, free: [], ...p,
})

describe('calendario', () => {
  it('octubre 2026: empieza jueves, 31 días, semanas de lunes a domingo', () => {
    const g = monthGrid(2026, 9)
    expect(g.every((w) => w.length === 7)).toBe(true)
    expect(g[0].slice(0, 4)).toEqual([null, null, null, '2026-10-01'])
    expect(g.flat().filter(Boolean)).toHaveLength(31)
    expect(g.at(-1)!.filter(Boolean).at(-1)).toBe('2026-10-31')
  })
  it('lunes de la semana', () => {
    expect(mondayOf('2026-10-07')).toBe('2026-10-05') // miércoles
    expect(mondayOf('2026-10-11')).toBe('2026-10-05') // domingo
    expect(mondayOf('2026-10-05')).toBe('2026-10-05')
    expect(weekDays('2026-10-07')[6]).toBe('2026-10-11')
  })
})

describe('estado del día', () => {
  const base = { today: '2026-10-09', since: '2026-10-05' }
  it('hecho, parcial, incumplido, pendiente y futuro', () => {
    expect(dayStatus({ ...base, date: '2026-10-05', plan: 'A', workout: wk('2026-10-05', 'A', true, [['x', 10, 10]]) })).toBe('done')
    expect(dayStatus({ ...base, date: '2026-10-06', plan: 'B', workout: wk('2026-10-06', 'B', false, [['x', 10, 10]]) })).toBe('partial')
    expect(dayStatus({ ...base, date: '2026-10-07', plan: 'C' })).toBe('missed')
    expect(dayStatus({ ...base, date: '2026-10-09', plan: 'F' })).toBe('pending')
    expect(dayStatus({ ...base, date: '2026-10-10', plan: 'CARDIO' })).toBe('future')
  })
  it('hoy con sesión planificada sigue pendiente aunque haya cardio', () => {
    expect(dayStatus({ ...base, date: '2026-10-09', plan: 'F', day: day('2026-10-09', { cardioMin: 30 }) })).toBe('pending')
  })
  it('no marca incumplido antes del inicio del plan', () => {
    expect(dayStatus({ ...base, date: '2026-10-02', plan: 'F' })).toBe('none')
  })
  it('cardio hecho y descanso', () => {
    expect(dayStatus({ ...base, today: '2026-10-12', date: '2026-10-10', plan: 'CARDIO', day: day('2026-10-10', { cardioMin: 35 }) })).toBe('cardio')
    expect(dayStatus({ ...base, date: '2026-10-08', plan: 'REST' })).toBe('rest')
  })
  it('manda la sesión registrada sobre la planificada', () => {
    expect(dayStatus({ ...base, date: '2026-10-06', plan: 'CARDIO', workout: wk('2026-10-06', 'B', true, [['x', 1, 1]]) })).toBe('done')
  })
  it('racha: descansos no la rompen, un día perdido sí', () => {
    expect(streak(['missed', 'done', 'rest', 'cardio', 'done', 'pending'])).toBe(3)
    expect(streak(['done', 'done', 'missed', 'pending'])).toBe(0)
  })
})

describe('resumen semanal', () => {
  const week = weekDays('2026-10-05')
  const w1 = [
    wk('2026-10-05', 'A', true, [['curl', 40, 12], ['curl', 40, 10]]), // 400+480 → vol 880
    wk('2026-10-06', 'B', true, [['press', 30, 10]]), // 300
    wk('2026-10-07', 'C', false, [['prensa', 100, 10]]), // parcial: no suma
  ]
  const prev = [wk('2026-09-28', 'A', true, [['curl', 30, 10]])] // 300
  const earlier = [wk('2026-09-28', 'A', true, [['curl', 30, 10]])]
  const s = weekSummary({
    days: week, today: '2026-10-08', since: '2026-10-05', planOf, workouts: w1,
    dayLogs: [day('2026-10-05', { water: 8, meals: { desayuno: { done: true }, almuerzo: { done: true }, cena: { done: true } } })],
    prevWeekWorkouts: prev, earlier,
    metrics: [
      { date: '2026-10-03', weightKg: 64.4, source: 'manual' },
      { date: '2026-10-08', weightKg: 63.9, source: 'manual' },
    ],
  })
  it('cuenta sesiones terminadas y planificadas', () => {
    expect(s.sessionsDone).toBe(2)
    expect(s.sessionsPlanned).toBe(5)
  })
  it('volumen solo de sesiones terminadas y variación vs semana previa', () => {
    expect(s.volume).toBe(1180)
    expect(s.prevVolume).toBe(300)
    expect(s.volumeDelta).toBe(293)
  })
  it('detecta récord (curl 40×12 supera 30×10)', () => {
    expect(s.prs.map((p) => p.exerciseId)).toEqual(['curl'])
    expect(personalRecords(w1.filter((w) => w.done), [])).toEqual([]) // sin antecedente no es récord
  })
  it('cambio de peso, estados y lectura', () => {
    expect(s.weightChange).toBe(-0.5)
    expect(s.states['2026-10-07']).toBe('partial')
    expect(s.states['2026-10-12' as string]).toBeUndefined()
    expect(readingFor(s, false)).toContain('2/5')
    expect(readingFor({ ...s, sessionsDone: 3 }, true)).toContain('Faltaron 2 sesiones')
  })
  it('adherencia a comidas', () => {
    const d = day('2026-10-05', { meals: { a: { done: true }, b: { done: true }, c: { done: false } } })
    expect(adherence(d, 6)).toBeCloseTo(2 / 6)
    expect(adherence(undefined, 6)).toBe(0)
  })
})
