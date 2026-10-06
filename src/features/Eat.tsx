import { useState } from 'react'
import { Bar, Check } from '../components/ui'
import { MENUS, REMINDERS, SLOT_LABEL, TRANSITION } from '../data/meals.seed'
import { toISODate } from '../domain/dates'
import { sumMacros } from '../domain/nutrition'
import { isLegDay } from '../domain/schedule'
import { useDay, useToday } from '../hooks'
import { saveSettings, updateDay } from '../db/db'

const TYPE_LABEL = { leg: 'Día de pierna', other: 'Otros días (tren superior / cardio)', refeed: 'Día de refeed' }

export default function Eat() {
  const date = toISODate()
  const { settings, plan, dayType, target, targets, refeedDue } = useToday(date)
  const [day] = useDay(date)
  const [free, setFree] = useState({ name: '', kcal: '', protein: '', carbs: '', fat: '' })
  const menu = MENUS[dayType]
  const done = menu.filter((m) => day.meals[m.slot]?.done)
  const consumed = sumMacros([...done.map((m) => m.macros), ...day.free])
  const menuTotal = sumMacros(menu.map((m) => m.macros))
  const set = (patch: Parameters<typeof updateDay>[1]) => updateDay(date, patch)

  const toggleRefeed = async (on: boolean) => {
    await set({ refeed: on })
    if (on) await saveSettings({ ...settings, lastRefeed: date })
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Comer</h1>
      <section className="card space-y-3">
        <h2 className="font-bold">{TYPE_LABEL[dayType]}</h2>
        {target ? (
          <>
            <p className="text-sm text-ink/70">Meta: {target.kcal} kcal · P {target.protein} g · C {target.carbs} g · G {target.fat} g</p>
            <Bar label="Calorías" value={consumed.kcal} target={target.kcal} unit="kcal" />
            <Bar label="Proteína" value={consumed.protein} target={target.protein} />
            <Bar label="Carbohidratos" value={consumed.carbs} target={target.carbs} />
            <Bar label="Grasas" value={consumed.fat} target={target.fat} />
          </>
        ) : <p className="text-sm">Registra un InBody en Progreso para calcular tus metas.</p>}
        {target && Math.abs(menuTotal.kcal - target.kcal) > 150 && (
          <p className="rounded-lg bg-amber-50 p-2 text-sm text-amber-900">
            ⚠️ El menú de este tipo de día suma {menuTotal.kcal} kcal y tu meta calculada es {target.kcal} kcal. Ajusta porciones o revisa el plan con tu nutricionista.
          </p>
        )}
        {isLegDay(plan) && (refeedDue || day.refeed) && (
          <Check label="Hoy es día de refeed" checked={day.refeed} onChange={toggleRefeed} />
        )}
        {targets && <p className="text-xs text-ink/60">Referencia: TDEE {targets.tdee} kcal · promedio semanal {targets.averageKcal} kcal.</p>}
      </section>

      {menu.map((m) => {
        const state = day.meals[m.slot]
        return (
          <section key={m.slot} className="card space-y-2">
            <Check label={`${SLOT_LABEL[m.slot]} · ${m.macros.kcal} kcal`} checked={!!state?.done} onChange={(v) => set({ meals: { ...day.meals, [m.slot]: { ...state, done: v } } })} />
            <ul className="list-disc space-y-0.5 pl-9 text-sm">{m.items.map((i) => <li key={i}>{i}</li>)}</ul>
            <p className="pl-9 text-xs text-ink/60">
              {m.macros.protein != null && `P ${m.macros.protein} g · `}{m.macros.carbs != null && `C ${m.macros.carbs} g · `}{m.macros.fat != null && `G ${m.macros.fat} g`}{m.approx && ' (macros estimados)'}
            </p>
            {m.alternatives && (
              <details className="pl-9">
                <summary className="min-h-11 cursor-pointer py-2 text-sm font-semibold text-brand">{m.alternatives.label}</summary>
                <ul className="space-y-1">
                  {m.alternatives.options.map((o) => (
                    <li key={o}><label className="flex min-h-11 items-center gap-2 text-sm">
                      <input type="radio" name={`alt-${m.slot}`} checked={state?.choice === o} onChange={() => set({ meals: { ...day.meals, [m.slot]: { done: !!state?.done, choice: o } } })} />{o}
                    </label></li>
                  ))}
                </ul>
              </details>
            )}
            {state?.choice && <p className="pl-9 text-sm font-semibold text-violet-700">Elegiste: {state.choice}</p>}
          </section>
        )
      })}

      <section className="card space-y-2">
        <h2 className="font-bold">Comida libre</h2>
        {day.free.map((f) => (
          <div key={f.id} className="flex items-center justify-between text-sm">
            <span>{f.name} · {f.kcal} kcal</span>
            <button className="text-red-600" onClick={() => set({ free: day.free.filter((x) => x.id !== f.id) })}>Quitar</button>
          </div>
        ))}
        <input className="field" placeholder="¿Qué comiste?" value={free.name} onChange={(e) => setFree({ ...free, name: e.target.value })} />
        <div className="grid grid-cols-4 gap-2">
          {(['kcal', 'protein', 'carbs', 'fat'] as const).map((k) => (
            <label key={k}><span className="label">{{ kcal: 'kcal', protein: 'Prot', carbs: 'Carb', fat: 'Gras' }[k]}</span>
              <input inputMode="numeric" className="field" value={free[k]} onChange={(e) => setFree({ ...free, [k]: e.target.value })} /></label>
          ))}
        </div>
        <button className="btn w-full" disabled={!free.name || !free.kcal} onClick={() => {
          set({ free: [...day.free, { id: crypto.randomUUID(), name: free.name, kcal: +free.kcal || 0, protein: +free.protein || 0, carbs: +free.carbs || 0, fat: +free.fat || 0 }] })
          setFree({ name: '', kcal: '', protein: '', carbs: '', fat: '' })
        }}>Agregar</button>
      </section>

      <details className="card"><summary className="min-h-11 cursor-pointer py-2 font-bold">Recordatorios del plan</summary>
        <ul className="list-disc space-y-1 pl-5 text-sm">{REMINDERS.map((r) => <li key={r}>{r}</li>)}</ul></details>
      <details className="card"><summary className="min-h-11 cursor-pointer py-2 font-bold">Transición post-vacaciones (5 días)</summary>
        <ul className="space-y-1 text-sm">{TRANSITION.map((t) => <li key={t.days}><b>{t.days} · {t.title}:</b> {t.body}</li>)}</ul>
        <p className="mt-1 text-xs">No es detox ni purga: solo normalización gradual.</p></details>
    </div>
  )
}
