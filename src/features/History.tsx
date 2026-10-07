import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link, useSearchParams } from 'react-router-dom'
import { exerciseById } from '../components/ui'
import { SESSIONS } from '../data/routine.seed'
import { db } from '../db/db'
import { addDays, fromISODate, mondayOf, toISODate } from '../domain/dates'
import { adherence, consumedFor, dayStatus, mealCountFor, monthGrid, readingFor, weekDays, weekSummary, type DayState } from '../domain/history'
import { planFor } from '../domain/schedule'
import { volume } from '../domain/training'
import { useRange, useSettings, useSince, useToday } from '../hooks'
import type { WorkoutLog } from '../domain/types'

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const DOW = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
const LONG_DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

const STATE: Record<DayState, { icon: string; label: string; cls: string }> = {
  done: { icon: '✅', label: 'sesión hecha', cls: 'bg-emerald-100 text-emerald-900' },
  partial: { icon: '🟡', label: 'sesión parcial', cls: 'bg-amber-100 text-amber-900' },
  missed: { icon: '✖', label: 'no hecho', cls: 'bg-red-100 text-red-800' },
  cardio: { icon: '🪜', label: 'cardio hecho', cls: 'bg-sky-100 text-sky-900' },
  rest: { icon: '·', label: 'descanso', cls: 'bg-white text-ink/50' },
  pending: { icon: '•', label: 'pendiente hoy', cls: 'bg-violet-50 text-brand' },
  future: { icon: '', label: 'próximo', cls: 'bg-white text-ink/40' },
  none: { icon: '', label: 'sin datos', cls: 'bg-white text-ink/40' },
}

const prettyDate = (d: string) => {
  const x = fromISODate(d)
  return `${LONG_DAYS[x.getDay()]} ${x.getDate()} de ${MONTHS[x.getMonth()]}`
}
const shortDate = (d: string) => `${Number(d.slice(8))} ${MONTHS[Number(d.slice(5, 7)) - 1].slice(0, 3)}`
const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1)

export default function History() {
  const [params, setParams] = useSearchParams()
  const today = toISODate()
  const selected = params.get('d') ?? today
  const [view, setView] = useState<'cal' | 'week'>('cal')
  const select = (d: string) => setParams({ d }, { replace: true })

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Historial</h1>
      <div role="tablist" className="grid grid-cols-2 gap-1 rounded-xl bg-brand-soft p-1">
        {([['cal', 'Calendario'], ['week', 'Semana']] as const).map(([k, label]) => (
          <button key={k} role="tab" aria-selected={view === k} onClick={() => setView(k)}
            className={`min-h-11 rounded-lg font-semibold ${view === k ? 'bg-white text-brand shadow-sm' : 'text-ink/60'}`}>{label}</button>
        ))}
      </div>
      {view === 'cal' ? <CalendarView selected={selected} onSelect={select} today={today} /> : <WeekView anchor={selected} today={today} onPick={(d) => { select(d); setView('cal') }} />}
    </div>
  )
}

function CalendarView({ selected, onSelect, today }: { selected: string; onSelect: (d: string) => void; today: string }) {
  const settings = useSettings()
  const since = useSince()
  const sel = fromISODate(selected)
  const [ym, setYm] = useState({ y: sel.getFullYear(), m: sel.getMonth() })
  const grid = useMemo(() => monthGrid(ym.y, ym.m), [ym])
  const from = grid[0].find(Boolean)!
  const to = grid.at(-1)!.filter(Boolean).at(-1)!
  const data = useRange(from, to)
  const wBy = new Map<string, WorkoutLog>()
  for (const w of data?.workouts ?? []) if (!wBy.has(w.date) || w.done) wBy.set(w.date, w)
  const dBy = new Map((data?.days ?? []).map((d) => [d.date, d]))
  const states = new Map<string, DayState>()
  for (const d of grid.flat()) if (d) states.set(d, dayStatus({ date: d, today, since, plan: planFor(d, settings.week), workout: wBy.get(d), day: dBy.get(d) }))
  const monthDone = [...states.values()].filter((s) => s === 'done').length
  const monthPlanned = [...states.entries()].filter(([d, s]) => d <= today && s !== 'none' && s !== 'rest' && (wBy.get(d)?.code ?? planFor(d, settings.week)) !== 'CARDIO' && (wBy.get(d)?.code ?? planFor(d, settings.week)) !== 'REST').length
  const shift = (n: number) => setYm(({ y, m }) => { const x = new Date(y, m + n, 1); return { y: x.getFullYear(), m: x.getMonth() } })

  return (
    <>
      <section className="card space-y-3">
        <div className="flex items-center justify-between">
          <button className="btn-ghost" aria-label="Mes anterior" onClick={() => shift(-1)}>‹</button>
          <h2 className="font-bold">{cap(MONTHS[ym.m])} {ym.y}</h2>
          <button className="btn-ghost" aria-label="Mes siguiente" onClick={() => shift(1)}>›</button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-ink/60" aria-hidden>{DOW.map((d) => <span key={d}>{d}</span>)}</div>
        <div className="grid grid-cols-7 gap-1" role="grid" aria-label={`Calendario de ${MONTHS[ym.m]}`}>
          {grid.flat().map((d, i) => {
            if (!d) return <span key={i} />
            const st = states.get(d)!
            const meta = STATE[st]
            const adh = adherence(dBy.get(d), mealCountFor(dBy.get(d), planFor(d, settings.week))) >= 0.8
            return (
              <button key={d} role="gridcell" aria-label={`${prettyDate(d)}: ${meta.label}`} aria-selected={d === selected}
                onClick={() => onSelect(d)}
                className={`relative flex aspect-square min-h-11 flex-col items-center justify-center rounded-lg text-xs ${meta.cls} ${d === selected ? 'ring-2 ring-brand' : ''} ${d === today ? 'font-bold underline' : ''}`}>
                <span>{Number(d.slice(8))}</span>
                <span className="text-sm leading-none" aria-hidden>{meta.icon}</span>
                {adh && <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-violet-500" aria-hidden />}
              </button>
            )
          })}
        </div>
        <p className="text-sm"><b>{monthDone}</b> {monthDone === 1 ? 'sesión' : 'sesiones'} de gimnasio este mes{monthPlanned ? ` (de ${monthPlanned} planificadas hasta hoy)` : ''}.</p>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink/70">
          {(['done', 'partial', 'missed', 'cardio', 'rest'] as DayState[]).map((k) => <li key={k}>{STATE[k].icon} {STATE[k].label}</li>)}
          <li><span className="inline-block h-1.5 w-1.5 rounded-full bg-violet-500" /> comida ≥ 80 %</li>
        </ul>
      </section>
      <DayDetail date={selected} today={today} />
    </>
  )
}

export function DayDetail({ date, today }: { date: string; today: string }) {
  const { settings, targets } = useToday(date)
  const data = useRange(date, date)
  const plan = planFor(date, settings.week)
  const day = data?.days[0]
  const workouts = data?.workouts ?? []
  const consumed = consumedFor(day, plan)
  const prevByCode = useLiveQuery(async () => {
    const out: Record<string, WorkoutLog | undefined> = {}
    for (const w of workouts) {
      const all = await db.workouts.where('code').equals(w.code).toArray()
      out[w.code] = all.filter((x) => x.done && x.date < date).sort((a, b) => a.date.localeCompare(b.date)).at(-1)
    }
    return out
  }, [date, workouts.length])
  const extras = [day?.mobility && 'Movilidad', day?.abs && 'Abdominales', day?.calves && 'Pantorrilla', day?.creatine && 'Creatina'].filter(Boolean) as string[]
  const plannedName = plan === 'CARDIO' ? 'Cardio' : plan === 'REST' ? 'Descanso' : SESSIONS[plan].title
  const target = targets ? (day?.refeed ? targets.refeed : targets.other) : undefined

  return (
    <section className="card space-y-3" aria-live="polite">
      <div>
        <h2 className="font-bold">{cap(prettyDate(date))}{date === today ? ' (hoy)' : ''}</h2>
        <p className="text-sm text-ink/70">Plan: {plannedName}</p>
      </div>

      {workouts.length === 0 && plan !== 'CARDIO' && plan !== 'REST' && (
        <p className="text-sm">{date > today ? 'Aún no llega este día.' : 'No registraste esta sesión.'}</p>
      )}
      {workouts.map((w) => {
        const vol = volume(w.sets)
        const prev = prevByCode?.[w.code]
        const pv = prev ? volume(prev.sets) : 0
        const delta = pv > 0 ? Math.round(((vol - pv) / pv) * 100) : undefined
        const ids = [...new Set(w.sets.map((s) => s.exerciseId))]
        return (
          <div key={w.id ?? w.code} className="space-y-2">
            <p className="font-semibold">{SESSIONS[w.code].title} · {w.done ? 'terminada ✅' : 'sin terminar 🟡'}</p>
            <p className="text-sm">Volumen {Math.round(vol)} kg{delta != null && ` · ${delta >= 0 ? '+' : ''}${delta}% vs la última vez (${shortDate(prev!.date)})`}</p>
            <ul className="space-y-1 text-sm">
              {ids.map((id) => (
                <li key={id}><b>{exerciseById(id)?.name ?? id}</b>: {w.sets.filter((s) => s.exerciseId === id && s.reps > 0).map((s) => `${s.weight}×${s.reps}`).join(' · ') || '—'}</li>
              ))}
            </ul>
            {(w.energy || w.sleepHours) && <p className="text-xs text-ink/60">{w.energy ? `Energía ${w.energy}/5` : ''}{w.energy && w.sleepHours ? ' · ' : ''}{w.sleepHours ? `Sueño ${w.sleepHours} h` : ''}</p>}
          </div>
        )
      })}

      {(day?.cardioMin ?? 0) > 0 && <p className="text-sm">🪜 Cardio: <b>{day!.cardioMin} min</b></p>}
      {day ? (
        <div className="space-y-1 text-sm">
          <p>🥗 Comidas del menú: <b>{Object.values(day.meals).filter((m) => m.done).length}/{mealCountFor(day, plan)}</b>
            {consumed.kcal > 0 && <> · {Math.round(consumed.kcal)} kcal · {Math.round(consumed.protein)} g proteína{target ? ` (meta ${target.protein} g)` : ''}</>}</p>
          {day.free.length > 0 && <p>Comida libre: {day.free.map((f) => `${f.name} (${f.kcal} kcal)`).join(', ')}</p>}
          <p>💧 Agua: {day.water} vasos ({(day.water * 0.25).toFixed(2)} L){extras.length ? ` · ${extras.join(', ')}` : ''}</p>
        </div>
      ) : date <= today && <p className="text-sm text-ink/60">Sin registros de comida ni extras.</p>}
      {date === today && <Link to="/" className="btn-ghost inline-block">Ir a Hoy</Link>}
    </section>
  )
}

function WeekView({ anchor, today, onPick }: { anchor: string; today: string; onPick: (d: string) => void }) {
  const settings = useSettings()
  const since = useSince()
  const metrics = useLiveQuery(() => db.metrics.toArray(), [])
  const [monday, setMonday] = useState(mondayOf(anchor))
  const days = weekDays(monday)
  const cur = useRange(days[0], days[6])
  const prev = useRange(addDays(monday, -7), addDays(monday, -1))
  const earlier = useLiveQuery(() => db.workouts.where('date').below(monday).toArray(), [monday])
  if (!cur || !prev || !earlier) return null

  const s = weekSummary({
    days, today, since, planOf: (d) => planFor(d, settings.week),
    workouts: cur.workouts, dayLogs: cur.days, prevWeekWorkouts: prev.workouts, earlier, metrics,
  })
  const weekIsOver = days[6] < today
  const isCurrent = days.includes(today)
  const fmt = (d: string) => `${Number(d.slice(8))} ${MONTHS[Number(d.slice(5, 7)) - 1].slice(0, 3)}`

  return (
    <>
      <section className="card space-y-3">
        <div className="flex items-center justify-between">
          <button className="btn-ghost" aria-label="Semana anterior" onClick={() => setMonday(addDays(monday, -7))}>‹</button>
          <h2 className="font-bold">{fmt(days[0])} – {fmt(days[6])}{isCurrent ? ' (esta semana)' : ''}</h2>
          <button className="btn-ghost" aria-label="Semana siguiente" disabled={isCurrent} onClick={() => setMonday(addDays(monday, 7))}>›</button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {days.map((d, i) => {
            const m = STATE[s.states[d]]
            return (
              <button key={d} onClick={() => onPick(d)} aria-label={`${prettyDate(d)}: ${m.label}`} className={`flex min-h-14 flex-col items-center justify-center rounded-lg text-xs ${m.cls}`}>
                <span>{DOW[i]}</span><span className="text-base" aria-hidden>{m.icon || '–'}</span>
              </button>
            )
          })}
        </div>
        <p className="rounded-lg bg-brand-soft p-3 text-sm">{readingFor(s, weekIsOver)}</p>
      </section>

      <section className="card grid grid-cols-2 gap-3 text-center">
        <Stat value={`${s.sessionsDone}/${s.sessionsPlanned}`} label="Sesiones de gym" />
        <Stat value={`${s.cardioMin} min`} label="Cardio" />
        <Stat value={`${Math.round(s.mealAdherence * 100)} %`} label="Comidas cumplidas" />
        <Stat value={s.proteinAvg ? `${s.proteinAvg} g` : '–'} label="Proteína promedio" />
        <Stat value={`${s.waterAvg}`} label="Vasos de agua/día" />
        <Stat value={`${Math.round(s.volume)} kg`} label={`Volumen${s.volumeDelta != null ? ` (${s.volumeDelta >= 0 ? '+' : ''}${s.volumeDelta}%)` : ''}`} />
        {s.weightChange != null && <Stat value={`${s.weightChange > 0 ? '+' : ''}${s.weightChange} kg`} label="Cambio de peso" />}
        <Stat value={`${s.streak}`} label="Racha de días cumplidos" />
      </section>

      {s.prs.length > 0 && (
        <section className="card">
          <h2 className="mb-1 font-bold">Récords personales 💪</h2>
          <ul className="text-sm">{s.prs.map((p) => <li key={p.exerciseId}><b>{exerciseById(p.exerciseId)?.name ?? p.exerciseId}</b>: 1RM estimado {p.previous} → {p.now} kg</li>)}</ul>
        </section>
      )}
    </>
  )
}

const Stat = ({ value, label }: { value: string; label: string }) => (
  <div><p className="text-xl font-bold">{value}</p><p className="label">{label}</p></div>
)
