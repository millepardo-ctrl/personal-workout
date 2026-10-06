import Dexie, { type Table } from 'dexie'
import type { BodyMetric, DayLog, Settings, WorkoutLog } from '../domain/types'
import { defaultSettings, INBODY_JULY } from '../data/defaults'

export class AppDB extends Dexie {
  settings!: Table<Settings, string>
  days!: Table<DayLog, string>
  workouts!: Table<WorkoutLog, number>
  metrics!: Table<BodyMetric, number>

  constructor(name = 'mi-plan') {
    super(name)
    this.version(1).stores({
      settings: 'id',
      days: 'date',
      workouts: '++id, date, code',
      metrics: '++id, date',
    })
  }
}

export let db = new AppDB()

/** Solo para pruebas: reemplaza la base por otra instancia. */
export function setDb(next: AppDB) {
  db = next
}

export const emptyDay = (date: string): DayLog => ({
  date,
  water: 0,
  mobility: false,
  abs: false,
  calves: false,
  creatine: false,
  cardioMin: 0,
  refeed: false,
  meals: {},
  free: [],
})

export async function ensureSeed() {
  if (!(await db.settings.get('main'))) await db.settings.put(defaultSettings())
  if ((await db.metrics.count()) === 0) await db.metrics.add(INBODY_JULY)
}

export async function getSettings(): Promise<Settings> {
  return (await db.settings.get('main')) ?? defaultSettings()
}

export const saveSettings = (s: Settings) => db.settings.put(s)

export async function getDay(date: string): Promise<DayLog> {
  return (await db.days.get(date)) ?? emptyDay(date)
}

export async function updateDay(date: string, patch: Partial<DayLog>) {
  const cur = await getDay(date)
  await db.days.put({ ...cur, ...patch, date })
}

export async function latestMetric(): Promise<BodyMetric | undefined> {
  const all = await db.metrics.orderBy('date').toArray()
  return all.at(-1)
}

/** Último registro de pesos del ejercicio (de la sesión terminada anterior) para mostrar "última vez". */
export async function lastSetsFor(exerciseId: string, beforeDate: string) {
  const ws = await db.workouts.where('date').below(beforeDate).reverse().sortBy('date')
  for (const w of ws) {
    const sets = w.sets.filter((s) => s.exerciseId === exerciseId && s.weight > 0)
    if (sets.length) return { date: w.date, sets }
  }
  return undefined
}
