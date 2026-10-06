import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { SESSIONS } from '../data/routine.seed'
import { ExerciseImage, RestTimer } from '../components/ui'
import { db, lastSetsFor } from '../db/db'
import { toISODate } from '../domain/dates'
import { isDeloadWeek } from '../domain/schedule'
import { SET_HELP, SET_LABEL, expandSets, suggestSet, volume } from '../domain/training'
import { useSettings } from '../hooks'
import type { SessionCode, SetLog, WorkoutLog } from '../domain/types'

const key = (id: string, i: number) => `${id}#${i}`

export default function Session() {
  const code = useParams().code as SessionCode
  const session = SESSIONS[code]
  const settings = useSettings()
  const date = toISODate()
  const [log, setLog] = useState<WorkoutLog>({ date, code, sets: [], done: false })
  const [last, setLast] = useState<Record<string, SetLog[]>>({})
  const [timerRun, setTimerRun] = useState(0)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!session) return
    ;(async () => {
      const existing = (await db.workouts.where('date').equals(date).toArray()).find((w) => w.code === code)
      if (existing) setLog(existing)
      const map: Record<string, SetLog[]> = {}
      for (const ex of session.exercises) {
        const l = await lastSetsFor(ex.id, date)
        if (l) map[ex.id] = l.sets
      }
      setLast(map)
      setLoaded(true)
    })()
  }, [code, date, session])

  const persist = async (next: WorkoutLog) => {
    setLog(next)
    const id = await db.workouts.put(next)
    if (!next.id) setLog({ ...next, id })
  }

  const setValue = (s: SetLog) => {
    const rest = log.sets.filter((x) => !(x.exerciseId === s.exerciseId && x.index === s.index))
    return persist({ ...log, sets: [...rest, s] })
  }
  const byKey = useMemo(() => Object.fromEntries(log.sets.map((s) => [key(s.exerciseId, s.index), s])), [log.sets])
  const total = useMemo(() => volume(log.sets), [log.sets])

  if (!session) return <p>Sesión no encontrada. <Link to="/entrenar" className="underline">Volver</Link></p>
  const deload = isDeloadWeek(settings.planStart, date)

  return (
    <div className="space-y-4">
      <Link to="/entrenar" className="text-sm font-semibold text-brand">← Entrenar</Link>
      <h1 className="text-2xl font-bold">{session.title}</h1>
      <p className="-mt-3 text-sm text-ink/70">{session.focus}</p>
      {deload && <p className="card border border-amber-300 bg-amber-50 text-sm">Semana de descarga: haz ~60 % de las series de cada ejercicio.</p>}

      {session.exercises.map((ex) => {
        const planned = expandSets(ex)
        return (
          <section key={ex.id} className="card space-y-3">
            <div className="flex gap-3">
              <ExerciseImage imageId={ex.imageId} alt={ex.name} />
              <div>
                <h2 className="font-bold">{ex.name}</h2>
                <p className="text-sm text-ink/70">{ex.muscle}</p>
                {ex.note && <p className="text-sm">{ex.note}</p>}
                {settings.adjustedRoutine && ex.keepReserve && <p className="text-sm text-violet-700">Ajuste: deja 1–2 reps en reserva (técnica y rodillas).</p>}
              </div>
            </div>
            <ul className="space-y-2">
              {planned.map((p) => {
                const cur = byKey[key(ex.id, p.index)]
                const sug = suggestSet(p, last[ex.id])
                return (
                  <li key={p.index} className="rounded-xl bg-brand-soft/60 p-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold">{p.index + 1}. {p.type === 'STD' ? `${p.reps} reps` : `${p.type} · ${SET_LABEL[p.type]}`}</span>
                      <span className="text-xs text-ink/60">{p.type !== 'STD' ? SET_HELP[p.type] : ''}</span>
                    </div>
                    {sug.hint && <p className="text-xs text-violet-700">{sug.hint}</p>}
                    <div className="mt-1 flex items-center gap-2">
                      <label className="flex-1"><span className="label">Peso (kg)</span>
                        <input inputMode="decimal" className="field" placeholder={sug.weight ? String(sug.weight) : '0'} value={cur?.weight ?? ''}
                          onChange={(e) => setValue({ exerciseId: ex.id, index: p.index, type: p.type, weight: Number(e.target.value.replace(',', '.')) || 0, reps: cur?.reps ?? 0 })} /></label>
                      <label className="flex-1"><span className="label">Reps</span>
                        <input inputMode="numeric" className="field" placeholder={p.reps?.split('–')[0] ?? ''} value={cur?.reps || ''}
                          onChange={(e) => setValue({ exerciseId: ex.id, index: p.index, type: p.type, weight: cur?.weight ?? sug.weight ?? 0, reps: Number(e.target.value) || 0 })} /></label>
                      <button className="btn-ghost mt-4" aria-label={`Terminar serie ${p.index + 1}`} onClick={() => {
                        if (!cur) setValue({ exerciseId: ex.id, index: p.index, type: p.type, weight: sug.weight ?? 0, reps: Number(p.reps?.split('–')[0]) || 0 })
                        setTimerRun((n) => n + 1)
                      }}>{cur?.reps ? '✓' : 'OK'}</button>
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}

      <section className="card space-y-2">
        <p>Volumen total: <b>{Math.round(total)} kg</b></p>
        <label className="block"><span className="label">Energía hoy (1–5)</span>
          <input type="number" min={1} max={5} className="field" value={log.energy ?? ''} onChange={(e) => persist({ ...log, energy: Number(e.target.value) || undefined })} /></label>
        <label className="block"><span className="label">Horas de sueño anoche</span>
          <input type="number" step="0.5" className="field" value={log.sleepHours ?? ''} onChange={(e) => persist({ ...log, sleepHours: Number(e.target.value) || undefined })} /></label>
        <button className="btn w-full" disabled={!loaded} onClick={() => persist({ ...log, done: !log.done })}>
          {log.done ? '✓ Sesión terminada (toca para reabrir)' : 'Terminar sesión'}
        </button>
      </section>
      <RestTimer seconds={settings.restSeconds} runId={timerRun} />
    </div>
  )
}
