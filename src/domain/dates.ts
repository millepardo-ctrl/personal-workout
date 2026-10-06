/** Fecha local en formato YYYY-MM-DD (sin desfase por zona horaria). */
export function toISODate(d: Date = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export function fromISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function daysBetween(a: string, b: string): number {
  const ms = fromISODate(b).getTime() - fromISODate(a).getTime()
  return Math.round(ms / 86_400_000)
}

export function addDays(s: string, n: number): string {
  const d = fromISODate(s)
  d.setDate(d.getDate() + n)
  return toISODate(d)
}
