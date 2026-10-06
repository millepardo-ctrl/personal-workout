import { useEffect, useRef, useState } from 'react'
import { allExercises } from '../data/routine.seed'

export const exerciseById = (id: string) => allExercises().find((e) => e.id === id)

const imgUrl = (id: string, n: 0 | 1) => `${import.meta.env.BASE_URL}exercises/${id}/${n}.jpg`

/** Foto del ejercicio (2 posiciones); toca para alternar. */
export function ExerciseImage({ imageId, alt }: { imageId?: string; alt: string }) {
  const [n, setN] = useState<0 | 1>(0)
  const [broken, setBroken] = useState(false)
  if (!imageId || broken) return <div className="h-24 w-24 shrink-0 rounded-xl bg-brand-soft" aria-hidden />
  return (
    <button type="button" onClick={() => setN(n === 0 ? 1 : 0)} className="shrink-0" aria-label={`Ver otra posición: ${alt}`}>
      <img src={imgUrl(imageId, n)} alt={alt} loading="lazy" onError={() => setBroken(true)} className="h-24 w-24 rounded-xl object-cover" />
    </button>
  )
}

export function Bar({ label, value, target, unit = 'g' }: { label: string; value: number; target: number; unit?: string }) {
  const pct = Math.min(100, target ? (value / target) * 100 : 0)
  const over = value > target * 1.05
  return (
    <div>
      <div className="flex justify-between text-xs">
        <span className="font-semibold">{label}</span>
        <span className={over ? 'text-red-600' : 'text-ink/70'}>
          {Math.round(value)} / {Math.round(target)} {unit}
        </span>
      </div>
      <div className="mt-1 h-2 rounded-full bg-brand-soft">
        <div className={`h-2 rounded-full ${over ? 'bg-red-500' : 'bg-brand'}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export function Check({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex min-h-11 items-center gap-3">
      <input type="checkbox" className="h-6 w-6 accent-violet-600" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className={checked ? 'line-through opacity-60' : ''}>{label}</span>
    </label>
  )
}

/** Cronómetro de descanso (120–180 s según el coach). */
export function RestTimer({ seconds, runId }: { seconds: number; runId: number }) {
  const [left, setLeft] = useState(0)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => {
    if (!runId) return
    setLeft(seconds)
    window.clearInterval(timer.current)
    timer.current = window.setInterval(() => setLeft((l) => (l <= 1 ? (window.clearInterval(timer.current), 0) : l - 1)), 1000)
    return () => window.clearInterval(timer.current)
  }, [runId, seconds])
  useEffect(() => {
    if (runId && left === 0) navigator.vibrate?.(300)
  }, [left, runId])
  if (!runId || left === 0) return null
  const m = Math.floor(left / 60)
  const s = String(left % 60).padStart(2, '0')
  return (
    <div className="fixed inset-x-0 bottom-20 z-20 mx-auto flex w-fit items-center gap-3 rounded-full bg-ink px-5 py-3 text-white shadow-lg" role="timer" aria-live="off">
      <span className="text-sm">Descanso</span>
      <span className="text-2xl font-bold tabular-nums">{m}:{s}</span>
      <button className="text-sm underline" onClick={() => setLeft(0)}>Saltar</button>
    </div>
  )
}
