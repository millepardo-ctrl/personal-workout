import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { db } from '../db/db'
import { toISODate, daysBetween } from '../domain/dates'
import { rateWarning } from '../domain/nutrition'
import { useSettings } from '../hooks'
import type { BodyMetric } from '../domain/types'

const FIELDS: { k: keyof BodyMetric; label: string; step?: string }[] = [
  { k: 'weightKg', label: 'Peso (kg)' },
  { k: 'bodyFatPct', label: 'Grasa corporal %' },
  { k: 'bodyFatKg', label: 'Grasa (kg)' },
  { k: 'skeletalMuscleKg', label: 'Músculo esquelético (kg)' },
  { k: 'leanMassKg', label: 'Masa libre de grasa (kg)' },
  { k: 'bmr', label: 'Índice metabólico basal (kcal)' },
  { k: 'bmi', label: 'IMC' },
  { k: 'visceralFat', label: 'Grasa visceral' },
  { k: 'waterL', label: 'Agua corporal (L)' },
  { k: 'phaseAngle', label: 'Ángulo de fase (°)' },
  { k: 'waistCm', label: 'Cintura (cm)' },
  { k: 'hipCm', label: 'Cadera (cm)' },
]

function Chart({ data, k, title, color = '#7c3aed' }: { data: BodyMetric[]; k: keyof BodyMetric; title: string; color?: string }) {
  const pts = data.filter((d) => d[k] != null).map((d) => ({ date: d.date.slice(5), v: d[k] as number }))
  if (pts.length === 0) return null
  return (
    <div className="card">
      <h3 className="mb-1 font-bold">{title}</h3>
      {pts.length < 2 && <p className="text-sm text-ink/60">Actual: {pts[0].v}. Agrega otra medición para ver la tendencia.</p>}
      <div style={{ width: '100%', height: 150 }}>
        <ResponsiveContainer>
          <LineChart data={pts}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="date" fontSize={11} />
            <YAxis domain={['auto', 'auto']} fontSize={11} width={34} />
            <Tooltip />
            <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default function Progress() {
  const settings = useSettings()
  const metrics = useLiveQuery(() => db.metrics.orderBy('date').toArray(), []) ?? []
  const workouts = useLiveQuery(() => db.workouts.toArray(), []) ?? []
  const [form, setForm] = useState<Record<string, string>>({ date: toISODate() })
  const last = metrics.at(-1)
  const prev = metrics.at(-2)

  const weekAgo = toISODate(new Date(Date.now() - 7 * 86_400_000))
  const sessionsDone = workouts.filter((w) => w.done && w.date > weekAgo).length

  let ratePerWeek: number | undefined
  if (last && prev && daysBetween(prev.date, last.date) > 0) ratePerWeek = ((last.weightKg - prev.weightKg) / daysBetween(prev.date, last.date)) * 7
  const warn = ratePerWeek != null ? rateWarning(ratePerWeek) : null

  const save = async () => {
    const m: BodyMetric = { date: form.date, weightKg: Number(form.weightKg), source: form.bmr ? 'inbody' : 'manual' }
    if (!m.weightKg) return
    for (const f of FIELDS) if (f.k !== 'weightKg' && form[f.k]) (m as unknown as Record<string, unknown>)[f.k] = Number(form[f.k])
    await db.metrics.add(m)
    setForm({ date: toISODate() })
  }

  const goalGap = last?.bodyFatPct != null ? last.bodyFatPct - settings.goalBodyFatPct : undefined

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Progreso</h1>
      <section className="card grid grid-cols-2 gap-3 text-center">
        <div><p className="text-2xl font-bold">{last?.weightKg ?? '–'} kg</p><p className="label">Peso ({last?.date})</p></div>
        <div><p className="text-2xl font-bold">{last?.bodyFatPct ?? '–'} %</p><p className="label">Grasa corporal</p></div>
        <div><p className="text-2xl font-bold">{last?.skeletalMuscleKg ?? '–'} kg</p><p className="label">Músculo esquelético</p></div>
        <div><p className="text-2xl font-bold">{sessionsDone}/5</p><p className="label">Sesiones últimos 7 días</p></div>
        {goalGap != null && <p className="col-span-2 text-sm">Meta {settings.goalBodyFatPct} % de grasa: te faltan {Math.max(0, goalGap).toFixed(1)} puntos.</p>}
      </section>
      {warn && <p className="card border border-amber-300 bg-amber-50 text-sm">{warn}</p>}

      <Chart data={metrics} k="weightKg" title="Peso (kg)" />
      <Chart data={metrics} k="bodyFatPct" title="Grasa corporal (%)" color="#db2777" />
      <Chart data={metrics} k="skeletalMuscleKg" title="Músculo esquelético (kg)" color="#059669" />
      <Chart data={metrics} k="waistCm" title="Cintura (cm)" color="#d97706" />
      <Chart data={metrics} k="bmr" title="Metabolismo basal (kcal)" color="#2563eb" />

      <section className="card space-y-2">
        <h2 className="font-bold">Nueva medición / InBody</h2>
        <p className="text-xs text-ink/60">Solo el peso es obligatorio. Con el TMB se recalculan tus metas.</p>
        <label><span className="label">Fecha</span><input type="date" className="field" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></label>
        <div className="grid grid-cols-2 gap-2">
          {FIELDS.map((f) => (
            <label key={f.k}><span className="label">{f.label}</span>
              <input inputMode="decimal" className="field" value={form[f.k] ?? ''} onChange={(e) => setForm({ ...form, [f.k]: e.target.value.replace(',', '.') })} /></label>
          ))}
        </div>
        <button className="btn w-full" onClick={save}>Guardar medición</button>
      </section>

      <section className="card">
        <h2 className="mb-1 font-bold">Historial</h2>
        <ul className="divide-y text-sm">
          {[...metrics].reverse().map((m) => (
            <li key={m.id} className="flex min-h-11 items-center justify-between">
              <span>{m.date} · {m.weightKg} kg{m.bodyFatPct ? ` · ${m.bodyFatPct} %` : ''}</span>
              <button className="text-red-600" onClick={() => confirm('¿Borrar esta medición?') && db.metrics.delete(m.id!)}>Borrar</button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
