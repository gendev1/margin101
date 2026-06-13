// Shared localStorage-backed study state: last-visited module, day streak,
// drill stats per family. Single home so App, the study desk, and the drills
// all read the same numbers.

const K = {
  done: 'margin101.done',
  visit: 'margin101.lastvisit',
  days: 'margin101.activedays',
  drills: 'margin101.drills.v2',
} as const

export type DoneMap = Record<string, boolean>

export interface Visit {
  id: string
  at: number
}

export interface Tally {
  right: number
  total: number
}

export type DrillKind = 'compute' | 'verdict'

export interface DrillStats {
  byFamily: Record<string, Tally>
  byKind: Partial<Record<DrillKind, Tally>>
  bestRun: number
  today: { date: string; n: number }
  sessions?: number
}

const load = <T>(key: string, fallback: T): T => {
  try { return (JSON.parse(localStorage.getItem(key) ?? 'null') as T | null) ?? fallback } catch { return fallback }
}
const save = (key: string, value: unknown) => localStorage.setItem(key, JSON.stringify(value))

export const loadDone = (): DoneMap => load(K.done, {})
export const saveDone = (done: DoneMap) => save(K.done, done)

const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ---- visits / continue ----
export function recordVisit(moduleId: string) {
  if (moduleId) save(K.visit, { id: moduleId, at: Date.now() } satisfies Visit)
  markActiveToday()
}
export const lastVisit = (): Visit | null => load<Visit | null>(K.visit, null)

// ---- day streak ----
export function markActiveToday() {
  const days = load<string[]>(K.days, [])
  const t = today()
  if (!days.includes(t)) {
    days.push(t)
    save(K.days, days.slice(-90))
  }
}

export function dayStreak(): number {
  const days = new Set(load<string[]>(K.days, []))
  let streak = 0
  const d = new Date()
  for (;;) {
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    if (days.has(key)) { streak++; d.setDate(d.getDate() - 1) }
    else if (streak === 0 && key === today()) { d.setDate(d.getDate() - 1) } // today not yet active: look at yesterday
    else break
    if (streak > 365) break
  }
  return streak
}

// ---- drill stats ----
export const loadDrills = (): DrillStats =>
  load(K.drills, { byFamily: {}, byKind: {}, bestRun: 0, today: { date: today(), n: 0 } })

export interface DrillRecord {
  kind: DrillKind
  family?: string
  right: boolean
  run: number
}

export function recordDrill({ kind, family, right, run }: DrillRecord): DrillStats {
  const s = loadDrills()
  const bump = (obj: Record<string, Tally>, key: string) => {
    obj[key] = obj[key] ?? { right: 0, total: 0 }
    obj[key].total++
    if (right) obj[key].right++
  }
  bump(s.byKind as Record<string, Tally>, kind)
  if (family) bump(s.byFamily, family)
  if (run > (s.bestRun ?? 0)) s.bestRun = run
  if (s.today?.date !== today()) s.today = { date: today(), n: 0 }
  s.today.n++
  save(K.drills, s)
  markActiveToday()
  return s
}

export const DAILY_GOAL = 20

export function weakestFamilies(s: DrillStats, min = 4) {
  return Object.entries(s.byFamily ?? {})
    .filter(([, v]) => v.total >= min)
    .map(([fam, v]) => ({ fam, pct: Math.round(v.right / v.total * 100), total: v.total }))
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 3)
}

export const accuracy = (v?: Tally): number | null =>
  v && v.total ? Math.round(v.right / v.total * 100) : null
