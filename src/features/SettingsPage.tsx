import { useRef, useState } from 'react'
import { SESSIONS } from '../data/routine.seed'
import { clearAll, exportAll, exportCsv, importAll } from '../db/backup'
import { ensureSeed, saveSettings } from '../db/db'
import { useSettings } from '../hooks'
import type { DayPlan, Settings } from '../domain/types'

const DAY_NAMES: [number, string][] = [[1, 'Lunes'], [2, 'Martes'], [3, 'Miércoles'], [4, 'Jueves'], [5, 'Viernes'], [6, 'Sábado'], [0, 'Domingo']]
const OPTIONS: DayPlan[] = ['A', 'B', 'C', 'E', 'F', 'CARDIO', 'REST']

function download(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const a = Object.assign(document.createElement('a'), { href: url, download: name })
  a.click()
  URL.revokeObjectURL(url)
}

export default function SettingsPage() {
  const s = useSettings()
  const file = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')
  const upd = (patch: Partial<Settings>) => saveSettings({ ...s, ...patch })
  const num = (k: keyof Settings) => (e: React.ChangeEvent<HTMLInputElement>) => upd({ [k]: Number(e.target.value) || 0 } as Partial<Settings>)

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Ajustes</h1>

      <section className="card space-y-2">
        <h2 className="font-bold">Semana de entrenamiento</h2>
        {DAY_NAMES.map(([d, name]) => (
          <label key={d} className="flex items-center justify-between gap-3">
            <span>{name}</span>
            <select className="field max-w-48" value={s.week[d]} onChange={(e) => upd({ week: { ...s.week, [d]: e.target.value as DayPlan } })}>
              {OPTIONS.map((o) => <option key={o} value={o}>{o === 'CARDIO' ? 'Cardio' : o === 'REST' ? 'Descanso' : `${o} · ${SESSIONS[o].focus}`}</option>)}
            </select>
          </label>
        ))}
        <label className="flex min-h-11 items-center gap-3">
          <input type="checkbox" className="h-6 w-6 accent-violet-600" checked={s.adjustedRoutine} onChange={(e) => upd({ adjustedRoutine: e.target.checked })} />
          <span>Rutina ajustada (cardio en escalera, descargas, reservas de seguridad)</span>
        </label>
        <label><span className="label">Descanso entre series (segundos, coach: 120–180)</span><input className="field" inputMode="numeric" value={s.restSeconds} onChange={num('restSeconds')} /></label>
        <label><span className="label">Inicio del plan</span><input type="date" className="field" value={s.planStart} onChange={(e) => upd({ planStart: e.target.value })} /></label>
      </section>

      <section className="card space-y-2">
        <h2 className="font-bold">Metas de nutrición</h2>
        <div className="grid grid-cols-2 gap-2">
          <label><span className="label">Factor de actividad</span><input className="field" inputMode="decimal" value={s.activityFactor} onChange={num('activityFactor')} /></label>
          <label><span className="label">Déficit (kcal)</span><input className="field" inputMode="numeric" value={s.deficitKcal} onChange={num('deficitKcal')} /></label>
          <label><span className="label">Proteína (g/kg)</span><input className="field" inputMode="decimal" value={s.proteinPerKg} onChange={num('proteinPerKg')} /></label>
          <label><span className="label">Grasa (g)</span><input className="field" inputMode="numeric" value={s.fatG} onChange={num('fatG')} /></label>
          <label><span className="label">Carbos extra día pierna (g)</span><input className="field" inputMode="numeric" value={s.legCarbBonusG} onChange={num('legCarbBonusG')} /></label>
          <label><span className="label">Refeed cada (días)</span><input className="field" inputMode="numeric" value={s.refeedEveryDays} onChange={num('refeedEveryDays')} /></label>
          <label><span className="label">Meta % grasa</span><input className="field" inputMode="decimal" value={s.goalBodyFatPct} onChange={num('goalBodyFatPct')} /></label>
          <label><span className="label">Último refeed</span><input type="date" className="field" value={s.lastRefeed ?? ''} onChange={(e) => upd({ lastRefeed: e.target.value || undefined })} /></label>
        </div>
      </section>

      <section className="card space-y-2">
        <h2 className="font-bold">Respaldo de datos</h2>
        <p className="text-sm text-ink/70">Tus datos viven solo en este teléfono. Exporta un respaldo cada semana.</p>
        <button className="btn w-full" onClick={async () => download(`mi-plan-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(await exportAll()), 'application/json')}>Exportar respaldo (JSON)</button>
        <button className="btn-ghost w-full" onClick={async () => download('entrenamientos.csv', await exportCsv(), 'text/csv')}>Exportar entrenamientos (CSV)</button>
        <button className="btn-ghost w-full" onClick={() => file.current?.click()}>Importar respaldo</button>
        <input ref={file} type="file" accept="application/json" hidden onChange={async (e) => {
          const f = e.target.files?.[0]
          if (!f) return
          try { await importAll(JSON.parse(await f.text())); setMsg('Respaldo importado ✓') } catch (err) { setMsg(String((err as Error).message)) }
          e.target.value = ''
        }} />
        <button className="w-full rounded-xl border border-red-300 py-2 text-red-600" onClick={async () => { if (confirm('¿Borrar TODOS tus datos?')) { await clearAll(); await ensureSeed(); setMsg('Datos borrados') } }}>Borrar todos los datos</button>
        {msg && <p role="status" className="text-sm font-semibold">{msg}</p>}
      </section>

      <p className="text-xs text-ink/50">Imágenes de ejercicios: free-exercise-db (dominio público). Las sugerencias de entrenamiento son generales, no consejo médico.</p>
    </div>
  )
}
