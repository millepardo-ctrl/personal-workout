import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { AppDB, ensureSeed, getDay, setDb, updateDay, latestMetric, db } from '../src/db/db'
import { clearAll, exportAll, importAll } from '../src/db/backup'

beforeEach(async () => {
  setDb(new AppDB('test-' + Math.random()))
  await ensureSeed()
})

describe('base local', () => {
  it('siembra settings y el InBody de julio', async () => {
    expect((await latestMetric())?.bmr).toBe(1316)
    expect((await db.settings.get('main'))?.week[1]).toBe('A')
  })
  it('exportar → borrar → importar conserva los datos', async () => {
    await updateDay('2026-10-06', { water: 5, mobility: true })
    await db.workouts.add({ date: '2026-10-06', code: 'B', done: true, sets: [{ exerciseId: 'b-triceps', index: 0, type: 'STD', weight: 20, reps: 12 }] })
    const backup = await exportAll()
    await clearAll()
    expect((await getDay('2026-10-06')).water).toBe(0)
    await importAll(JSON.parse(JSON.stringify(backup)))
    expect((await getDay('2026-10-06')).water).toBe(5)
    expect((await db.workouts.toArray())[0].sets[0].weight).toBe(20)
    expect(await latestMetric()).toBeTruthy()
  })
  it('rechaza archivos que no son del app', async () => {
    await expect(importAll({ app: 'otro' } as never)).rejects.toThrow()
  })
})
