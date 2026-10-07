import { Link } from 'react-router-dom'
import { Bar, Check } from '../components/ui'
import { SESSIONS } from '../data/routine.seed'
import { MENUS } from '../data/meals.seed'
import { addDays, toISODate } from '../domain/dates'
import { consumedFor } from '../domain/history'
import { planFor } from '../domain/schedule'
import { volume } from '../domain/training'
import { extrasFor, isDeloadWeek, isLegDay, stairCardioForDate, weekNumber } from '../domain/schedule'
import { sumMacros } from '../domain/nutrition'
import { useDay, useRange, useToday } from '../hooks'
import { updateDay } from '../db/db'

const DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const TYPE_LABEL = { leg: 'Día de pierna', other: 'Otros días', refeed: 'Día de refeed' }

export default function Today() {
  const date = toISODate()
  const { settings, metric, plan, dayType, target, refeedDue } = useToday(date)
  const [day] = useDay(date)
  const extras = extrasFor(date)
  const stairs = settings.adjustedRoutine ? stairCardioForDate(date, plan) : null
  const consumed = sumMacros([
    ...MENUS[dayType].filter((m) => day.meals[m.slot]?.done).map((m) => m.macros),
    ...day.free,
  ])
  const session = plan === 'CARDIO' || plan === 'REST' ? undefined : SESSIONS[plan]
  const set = (patch: Parameters<typeof updateDay>[1]) => updateDay(date, patch)
  const week = weekNumber(settings.planStart, date)
  const yesterday = addDays(date, -1)
  const yData = useRange(yesterday, yesterday)
  const yPlan = planFor(yesterday, settings.week)
  const yWorkout = yData?.workouts.find((w) => w.done) ?? yData?.workouts[0]
  const yDay = yData?.days[0]
  const yMacros = consumedFor(yDay, yPlan)

  return (
    <div className="space-y-4">
      <header>
        <p className="text-sm text-ink/60">Semana {week} · {DAYS[new Date().getDay()]}</p>
        <h1 className="text-2xl font-bold">Hola, Milena 👋</h1>
      </header>

      {isDeloadWeek(settings.planStart, date) && (
        <p className="card border border-amber-300 bg-amber-50 text-sm">Semana de descarga: haz ~60 % de las series y deja más reps en reserva.</p>
      )}
      {metric && metric.date < toISODate(new Date(Date.now() - 45 * 86_400_000)) && (
        <Link to="/progreso" className="card block border border-violet-300 text-sm">
          Tu último InBody es del {metric.date}. Sube uno nuevo para recalcular tus metas →
        </Link>
      )}


      <section className="card space-y-1">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">Ayer</h2>
          <Link to={`/historial?d=${yesterday}`} className="text-sm font-semibold text-brand">Ver detalle</Link>
        </div>
        {yData && (
          <p className="text-sm">
            {yWorkout
              ? `${SESSIONS[yWorkout.code].title} ${yWorkout.done ? 'terminada ✅' : 'sin terminar 🟡'} · ${Math.round(volume(yWorkout.sets))} kg de volumen`
              : yPlan === 'CARDIO' || yPlan === 'REST' ? (yDay?.cardioMin ? `Cardio ${yDay.cardioMin} min 🪜` : yPlan === 'REST' ? 'Día de descanso' : 'No registraste cardio') : 'No registraste la sesión de ayer'}
            {yMacros.kcal > 0 && ` · ${Math.round(yMacros.kcal)} kcal, ${Math.round(yMacros.protein)} g de proteína`}
          </p>
        )}
      </section>

      <section className="card space-y-2">
        <h2 className="font-bold">Entrenamiento de hoy</h2>
        {session ? (
          <>
            <p>{session.title} · {session.focus}</p>
            <Link to={`/entrenar/${plan}`} className="btn inline-block">Empezar sesión</Link>
          </>
        ) : (
          <p>{plan === 'CARDIO' ? 'Día de cardio' : 'Día de descanso'}</p>
        )}
        {stairs && <p className="text-sm text-violet-700">🪜 {stairs}</p>}
      </section>

      <section className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">Alimentación · {TYPE_LABEL[dayType]}</h2>
          <Link to="/comer" className="text-sm font-semibold text-brand">Ver menú</Link>
        </div>
        {target ? (
          <>
            <Bar label="Calorías" value={consumed.kcal} target={target.kcal} unit="kcal" />
            <Bar label="Proteína" value={consumed.protein} target={target.protein} />
            <Bar label="Carbohidratos" value={consumed.carbs} target={target.carbs} />
            <Bar label="Grasas" value={consumed.fat} target={target.fat} />
          </>
        ) : (
          <p className="text-sm">Registra un InBody en Progreso para calcular tus metas.</p>
        )}
        {refeedDue && isLegDay(plan) && dayType !== 'refeed' && (
          <button className="btn-ghost w-full" onClick={() => set({ refeed: true })}>Toca refeed hoy (día de pierna) – activar</button>
        )}
      </section>

      <section className="card">
        <h2 className="mb-1 font-bold">Checklist</h2>
        <Check label="Movilidad (todos los días)" checked={day.mobility} onChange={(v) => set({ mobility: v })} />
        {extras.abs && <Check label="Abdominales (crunch + plancha)" checked={day.abs} onChange={(v) => set({ abs: v })} />}
        {extras.calves && <Check label="Pantorrilla (2 ejercicios × 4 series)" checked={day.calves} onChange={(v) => set({ calves: v })} />}
        <Check label="Creatina 5 g" checked={day.creatine} onChange={(v) => set({ creatine: v })} />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <span>🪜 Cardio: <b>{day.cardioMin}</b> min</span>
          <span className="flex gap-2">
            <button className="btn-ghost" onClick={() => set({ cardioMin: day.cardioMin + 15 })}>+15</button>
            <button className="btn-ghost" onClick={() => set({ cardioMin: day.cardioMin + 30 })}>+30</button>
            <button className="btn-ghost" aria-label="Reiniciar cardio" onClick={() => set({ cardioMin: 0 })}>0</button>
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span>💧 Agua: {day.water} vasos ({(day.water * 0.25).toFixed(2)} L)</span>
          <span className="flex gap-2">
            <button className="btn-ghost" aria-label="Quitar vaso" onClick={() => set({ water: Math.max(0, day.water - 1) })}>−</button>
            <button className="btn-ghost" aria-label="Agregar vaso" onClick={() => set({ water: day.water + 1 })}>+</button>
          </span>
        </div>
      </section>
    </div>
  )
}
