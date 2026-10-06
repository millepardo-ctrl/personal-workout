import { describe, expect, it } from 'vitest'
import { computeTargets, rateWarning } from '../src/domain/nutrition'
import { dayTypeFor, isDeloadWeek, isRefeedDue, planFor, extrasFor, isLegDay } from '../src/domain/schedule'
import { dropWeights, e1rm, expandSets, nextTopSet, suggestWeight } from '../src/domain/training'
import { SESSIONS, allExercises, imageIds } from '../src/data/routine.seed'
import { MENUS } from '../src/data/meals.seed'
import { sumMacros } from '../src/domain/nutrition'

describe('nutrición', () => {
  const t = computeTargets({ bmr: 1316, weightKg: 64.4 })
  it('TDEE y promedio con InBody de julio', () => {
    expect(t.tdee).toBe(2040)
    expect(t.averageKcal).toBe(1840)
  })
  it('proteína ≈ 135 g y ciclado +30 g carbos en pierna', () => {
    expect(t.leg.protein).toBe(135)
    expect(t.leg.carbs - t.other.carbs).toBe(30)
    expect(t.leg.kcal).toBeGreaterThan(t.other.kcal)
  })
  it('promedio semanal (3 pierna / 4 otros) ≈ meta', () => {
    const avg = (3 * t.leg.kcal + 4 * t.other.kcal) / 7
    expect(Math.abs(avg - t.averageKcal)).toBeLessThan(2)
  })
  it('refeed = TDEE', () => expect(t.refeed.kcal).toBe(t.tdee))
  it('aviso de bajada rápida', () => {
    expect(rateWarning(-1)).not.toBeNull()
    expect(rateWarning(-0.5)).toBeNull()
  })
})

describe('agenda', () => {
  it('lunes a viernes A B C E F, fin de semana cardio', () => {
    // 2026-10-05 es lunes
    const days = ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11']
    expect(days.map((d) => planFor(d))).toEqual(['A', 'B', 'C', 'E', 'F', 'CARDIO', 'CARDIO'])
  })
  it('días de pierna A C F; refeed solo en pierna', () => {
    expect(isLegDay('A') && isLegDay('C') && isLegDay('F')).toBe(true)
    expect(isLegDay('B')).toBe(false)
    expect(dayTypeFor('B', true)).toBe('other')
    expect(dayTypeFor('C', true)).toBe('refeed')
  })
  it('refeed cada 10 días', () => {
    expect(isRefeedDue('2026-10-01', '2026-10-10')).toBe(false)
    expect(isRefeedDue('2026-10-01', '2026-10-11')).toBe(true)
    expect(isRefeedDue(undefined, '2026-10-11')).toBe(false)
  })
  it('extras: abdominales mar/jue/sáb, pantorrilla lun/mié/vie', () => {
    expect(extrasFor('2026-10-06').abs).toBe(true)
    expect(extrasFor('2026-10-05').calves).toBe(true)
    expect(extrasFor('2026-10-07').abs).toBe(false)
  })
  it('descarga cada 6 semanas', () => {
    expect(isDeloadWeek('2026-10-05', '2026-11-09')).toBe(true) // semana 6
    expect(isDeloadWeek('2026-10-05', '2026-10-12')).toBe(false)
  })
})

describe('entrenamiento', () => {
  it('doble progresión: >10 reps sube peso', () => {
    expect(nextTopSet({ weight: 40, reps: 11 }).weight).toBe(42.5)
    expect(nextTopSet({ weight: 40, reps: 9 }).weight).toBe(40)
    expect(nextTopSet({ weight: 10, reps: 12 }).weight).toBe(11)
  })
  it('BO = 70 %, drop 100/70/40', () => {
    expect(suggestWeight('BO', 100)).toBe(70)
    expect(dropWeights(100)).toEqual([100, 70, 40])
  })
  it('e1RM', () => expect(e1rm(60, 10)).toBe(80))
  it('expande series según el PDF', () => {
    const [curl] = SESSIONS.A.exercises
    expect(expandSets(curl).map((s) => s.type)).toEqual(['FD', 'WS', 'TS'])
    const ext = SESSIONS.C.exercises.find((e) => e.id === 'c-extensiones')!
    expect(expandSets(ext).map((s) => s.type)).toEqual(['FD', 'STD', 'STD', 'STD', 'DROP'])
  })
  it('rutina completa: 6/6/5/6/6 ejercicios, ids únicos', () => {
    expect(Object.values(SESSIONS).map((s) => s.exercises.length)).toEqual([6, 6, 5, 6, 6])
    const ids = allExercises().map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(imageIds().length).toBeGreaterThan(15)
  })
})

describe('menú del PDF', () => {
  it('otros días suma 1,825 kcal (coincide con el PDF)', () => {
    expect(sumMacros(MENUS.other.map((m) => m.macros)).kcal).toBe(1825)
  })
  it('día de pierna: las comidas del PDF suman 2,185 kcal (el PDF dice ~1,885)', () => {
    expect(sumMacros(MENUS.leg.map((m) => m.macros)).kcal).toBe(2185)
  })
})

import { suggestSet } from '../src/domain/training'
describe('sugerencias de serie', () => {
  const last = [
    { exerciseId: 'x', index: 0, type: 'WS' as const, weight: 35, reps: 9 },
    { exerciseId: 'x', index: 1, type: 'TS' as const, weight: 40, reps: 11 },
  ]
  it('TS con >10 reps sube peso; WS/BO se calculan del nuevo TS', () => {
    expect(suggestSet({ exerciseId: 'x', index: 1, type: 'TS' }, last).weight).toBe(42.5)
    expect(suggestSet({ exerciseId: 'x', index: 0, type: 'BO' }, last).weight).toBe(29.5) // 42.5*0.7≈29.75 → redondeo a 0.5 kg
    expect(suggestSet({ exerciseId: 'x', index: 0, type: 'DROP' }, last).hint).toContain('→')
  })
  it('sin historial no sugiere', () => expect(suggestSet({ exerciseId: 'x', index: 0, type: 'TS' }, undefined)).toEqual({}))
  it('STD: al tope de reps sube peso', () => {
    const l = [{ exerciseId: 'y', index: 0, type: 'STD' as const, weight: 20, reps: 12 }]
    expect(suggestSet({ exerciseId: 'y', index: 0, type: 'STD', reps: '10–12' }, l).weight).toBe(22.5)
  })
})
