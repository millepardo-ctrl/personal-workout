import { db } from './db'

export interface BackupFile {
  app: 'mi-plan'
  version: 1
  exportedAt: string
  settings: unknown[]
  days: unknown[]
  workouts: unknown[]
  metrics: unknown[]
}

export async function exportAll(): Promise<BackupFile> {
  return {
    app: 'mi-plan',
    version: 1,
    exportedAt: new Date().toISOString(),
    settings: await db.settings.toArray(),
    days: await db.days.toArray(),
    workouts: await db.workouts.toArray(),
    metrics: await db.metrics.toArray(),
  }
}

export async function importAll(data: BackupFile) {
  if (data?.app !== 'mi-plan' || data.version !== 1) throw new Error('Archivo de respaldo no válido')
  await db.transaction('rw', db.settings, db.days, db.workouts, db.metrics, async () => {
    await Promise.all([db.settings.clear(), db.days.clear(), db.workouts.clear(), db.metrics.clear()])
    await db.settings.bulkPut(data.settings as never[])
    await db.days.bulkPut(data.days as never[])
    await db.workouts.bulkPut(data.workouts as never[])
    await db.metrics.bulkPut(data.metrics as never[])
  })
}

export async function exportCsv(): Promise<string> {
  const rows = [['fecha', 'sesion', 'ejercicio', 'serie', 'tipo', 'peso_kg', 'reps']]
  for (const w of await db.workouts.toArray()) {
    for (const s of w.sets) rows.push([w.date, w.code, s.exerciseId, String(s.index + 1), s.type, String(s.weight), String(s.reps)])
  }
  return rows.map((r) => r.join(',')).join('\n')
}

export async function clearAll() {
  await Promise.all([db.settings.clear(), db.days.clear(), db.workouts.clear(), db.metrics.clear()])
}
