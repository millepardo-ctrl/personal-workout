import { Link } from 'react-router-dom'
import { ABS, CALVES, MOBILITY, SESSIONS } from '../data/routine.seed'
import { ExerciseImage } from '../components/ui'
import { SET_HELP, SET_LABEL } from '../domain/training'
import { isLegDay, planFor } from '../domain/schedule'
import { useSettings } from '../hooks'
import type { SessionCode } from '../domain/types'
import { toISODate } from '../domain/dates'

const NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

export default function Train() {
  const settings = useSettings()
  const today = toISODate()
  const order = [1, 2, 3, 4, 5, 6, 0]
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Entrenar</h1>
      <section className="card">
        <h2 className="mb-2 font-bold">Tu semana</h2>
        <ul className="space-y-1">
          {order.map((d) => {
            const p = settings.week[d]
            const isToday = new Date().getDay() === d
            return (
              <li key={d} className={`flex items-center justify-between rounded-lg px-2 py-1 ${isToday ? 'bg-brand-soft font-semibold' : ''}`}>
                <span>{NAMES[d]}</span>
                <span>
                  {p === 'CARDIO' ? '🪜 Cardio' : p === 'REST' ? 'Descanso' : `${p} · ${SESSIONS[p as SessionCode].focus}`}
                </span>
              </li>
            )
          })}
        </ul>
        <p className="mt-2 text-xs text-ink/60">Hoy: {planFor(today, settings.week)}. Puedes cambiar los días en Ajustes.</p>
      </section>

      {(Object.keys(SESSIONS) as SessionCode[]).map((code) => (
        <Link key={code} to={`/entrenar/${code}`} className="card block">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold">{SESSIONS[code].title}</h2>
              <p className="text-sm text-ink/70">{SESSIONS[code].focus} · {SESSIONS[code].exercises.length} ejercicios</p>
            </div>
            {isLegDay(code) && <span className="rounded-full bg-brand-soft px-2 py-1 text-xs font-semibold text-brand">pierna</span>}
          </div>
        </Link>
      ))}

      <section className="card space-y-3">
        <h2 className="font-bold">Extras</h2>
        {[['Abdominales (3×/semana)', ABS], ['Pantorrilla (3×/semana)', CALVES], ['Movilidad (todos los días)', MOBILITY]].map(([title, list]) => (
          <details key={title as string}>
            <summary className="min-h-11 cursor-pointer py-2 font-semibold">{title as string}</summary>
            <ul className="space-y-2">
              {(list as typeof ABS).map((e) => (
                <li key={e.id} className="flex items-center gap-3">
                  <ExerciseImage imageId={e.imageId} alt={e.name} />
                  <div><p className="font-semibold">{e.name}</p><p className="text-sm text-ink/70">{e.detail}</p></div>
                </li>
              ))}
            </ul>
          </details>
        ))}
      </section>

      <details className="card">
        <summary className="min-h-11 cursor-pointer py-2 font-bold">Guía de series del coach</summary>
        <dl className="space-y-1 text-sm">
          {(Object.keys(SET_LABEL) as (keyof typeof SET_LABEL)[]).filter((k) => k !== 'STD').map((k) => (
            <div key={k}><dt className="inline font-bold">{k} · {SET_LABEL[k]}: </dt><dd className="inline">{SET_HELP[k]}</dd></div>
          ))}
          <p className="pt-1 font-semibold">Descansos de 120 a 180 segundos.</p>
        </dl>
      </details>
    </div>
  )
}
