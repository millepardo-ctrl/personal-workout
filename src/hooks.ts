import { useLiveQuery } from 'dexie-react-hooks'
import { db, emptyDay, updateDay } from './db/db'
import { defaultSettings } from './data/defaults'
import { computeTargets, targetFor } from './domain/nutrition'
import { dayTypeFor, isRefeedDue, planFor } from './domain/schedule'
import type { DayLog, Settings } from './domain/types'

export function useSettings(): Settings {
  return useLiveQuery(() => db.settings.get('main'), []) ?? defaultSettings()
}

export function useDay(date: string): [DayLog, (patch: Partial<DayLog>) => Promise<void>] {
  const day = useLiveQuery(() => db.days.get(date), [date]) ?? emptyDay(date)
  return [day, (patch) => updateDay(date, patch)]
}

export function useLatestMetric() {
  return useLiveQuery(async () => (await db.metrics.orderBy('date').toArray()).at(-1), [])
}

/** Plan del día, tipo de día nutricional y metas calculadas desde el último InBody. */
export function useToday(date: string) {
  const settings = useSettings()
  const metric = useLatestMetric()
  const [day] = useDay(date)
  const plan = planFor(date, settings.week)
  const dayType = dayTypeFor(plan, day.refeed)
  const targets = metric?.bmr
    ? computeTargets({
        bmr: metric.bmr,
        weightKg: metric.weightKg,
        activityFactor: settings.activityFactor,
        deficitKcal: settings.deficitKcal,
        proteinPerKg: settings.proteinPerKg,
        fatG: settings.fatG,
        legCarbBonusG: settings.legCarbBonusG,
      })
    : undefined
  return {
    settings,
    metric,
    day,
    plan,
    dayType,
    targets,
    target: targets ? targetFor(targets, dayType) : undefined,
    refeedDue: isRefeedDue(settings.lastRefeed, date, settings.refeedEveryDays),
  }
}
