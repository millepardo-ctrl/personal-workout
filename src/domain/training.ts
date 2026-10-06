import type { Exercise, PlannedSet, SetLog, SetType } from './types'

export function expandSets(ex: Exercise): PlannedSet[] {
  const out: PlannedSet[] = []
  for (const b of ex.blocks) {
    for (let i = 0; i < b.count; i++) out.push({ exerciseId: ex.id, index: out.length, type: b.type, reps: b.reps })
  }
  return out
}

/** Redondea a 0.5 kg (discos/placas de máquina). */
export const roundWeight = (w: number) => Math.round(w * 2) / 2

/** Fracción del peso del set superior (TS) sugerida para cada tipo de serie (guía del coach). */
export const FRACTION: Record<SetType, number> = {
  WU: 0.4, // 12–20 reps sin fatigar, peso ligero
  FD: 0.65, // 6–8 reps subiendo el peso en cada serie
  WS: 0.85, // 80–90 % de la carga máxima, 2 reps en reserva
  TS: 1,
  BO: 0.7, // 70 % de la carga máxima, reps máximas
  CS: 0.7,
  DROP: 1, // se calcula con dropWeights
  STD: 1,
}

export function suggestWeight(type: SetType, topWeight: number): number {
  return roundWeight(topWeight * FRACTION[type])
}

/** Drop set: 100 % / 70 % / 40 % de la carga. */
export function dropWeights(top: number): [number, number, number] {
  return [roundWeight(top), roundWeight(top * 0.7), roundWeight(top * 0.4)]
}

/** Doble progresión: si el set superior pasa de 10 reps, sube el peso; si no, repite el peso e intenta más reps. */
export function nextTopSet(prev: { weight: number; reps: number }, maxReps = 10) {
  if (prev.reps > maxReps) {
    const step = prev.weight < 20 ? 1 : 2.5
    return { weight: roundWeight(prev.weight + step), advice: `Subiste de ${maxReps} reps: sube a ${roundWeight(prev.weight + step)} kg` }
  }
  return { weight: prev.weight, advice: `Mantén ${prev.weight} kg e intenta superar ${prev.reps} reps (meta >${maxReps})` }
}

export const SET_LABEL: Record<SetType, string> = {
  WU: 'Calentamiento',
  FD: 'Aproximación',
  WS: 'Working set',
  TS: 'Set superior',
  BO: 'Back-off',
  CS: 'Cluster',
  DROP: 'Drop set',
  STD: 'Serie',
}

export const SET_HELP: Record<SetType, string> = {
  WU: '12–20 reps sin fatigar con peso ligero.',
  FD: '6–8 reps aumentando el peso en cada serie.',
  WS: '80–90 % de tu carga máxima, 8–10 reps dejando 2 en reserva.',
  TS: 'Hasta el fallo, 8–10 reps. Si pasas de 10, sube el peso.',
  BO: '70 % de la carga máxima, repeticiones máximas.',
  CS: '24 reps en 4 bloques de 6 con 10 s de pausa.',
  DROP: '10 reps al 100 % + 10 al 70 % + 10 al 40 %.',
  STD: '',
}

export const volume = (sets: { weight: number; reps: number }[]) =>
  sets.reduce((a, s) => a + s.weight * s.reps, 0)

/** Estimación 1RM de Epley, útil para récords personales. */
export const e1rm = (weight: number, reps: number) => (reps <= 1 ? weight : roundWeight(weight * (1 + reps / 30)))

const maxRep = (reps?: string) => {
  const nums = reps?.match(/\d+/g)?.map(Number)
  return nums?.length ? Math.max(...nums) : 12
}

/** Sugerencia de peso para una serie a partir de la última sesión con ese ejercicio. */
export function suggestSet(plan: PlannedSet, last?: SetLog[]): { weight?: number; hint?: string } {
  if (!last?.length) return {}
  const ts = last.find((s) => s.type === 'TS')
  const stdSets = last.filter((s) => s.type === 'STD')
  const heaviest = last.reduce((a, s) => (s.weight > a.weight ? s : a), last[0])

  if (plan.type === 'TS' && ts) {
    const n = nextTopSet(ts)
    return { weight: n.weight, hint: n.advice }
  }
  if (plan.type === 'STD' && stdSets.length) {
    const prev = stdSets.find((s) => s.index === plan.index) ?? stdSets.at(-1)!
    const top = maxRep(plan.reps)
    if (prev.reps >= top) {
      const w = roundWeight(prev.weight + (prev.weight < 20 ? 1 : 2.5))
      return { weight: w, hint: `Llegaste a ${prev.reps} reps con ${prev.weight} kg → prueba ${w} kg` }
    }
    return { weight: prev.weight, hint: `Última vez ${prev.weight} kg × ${prev.reps}. Intenta sumar 1 rep` }
  }
  const top = ts ? nextTopSet(ts).weight : heaviest.weight
  if (plan.type === 'DROP') {
    const [a, b, c] = dropWeights(top)
    return { weight: a, hint: `10 reps: ${a} kg → ${b} kg → ${c} kg` }
  }
  return { weight: suggestWeight(plan.type, top), hint: `${SET_LABEL[plan.type]} ≈ ${Math.round(FRACTION[plan.type] * 100)} % del set superior` }
}
