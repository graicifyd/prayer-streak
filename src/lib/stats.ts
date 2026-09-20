import type { PrayerSession } from './types'

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

export type TimeOfDay = 'Morning' | 'Afternoon' | 'Evening' | 'Night'
export const TIME_OF_DAY: TimeOfDay[] = ['Morning', 'Afternoon', 'Evening', 'Night']

/** Local calendar day key, e.g. "2026-09-20". */
export function dayKey(ts: number): string {
  const d = new Date(ts)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export function startOfDay(ts: number): number {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export function addDays(ts: number, days: number): number {
  const d = new Date(ts)
  d.setDate(d.getDate() + days)
  return d.getTime()
}

export function timeOfDay(ts: number): TimeOfDay {
  const h = new Date(ts).getHours()
  if (h >= 5 && h < 12) return 'Morning'
  if (h >= 12 && h < 17) return 'Afternoon'
  if (h >= 17 && h < 21) return 'Evening'
  return 'Night'
}

export function formatDuration(totalSec: number): string {
  const s = Math.max(0, Math.round(totalSec))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${sec}s`
  return `${sec}s`
}

export function formatClock(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(sec).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

export type LoudnessLabel = 'Silent' | 'Whisper' | 'Quiet' | 'Normal' | 'Loud' | 'Very loud'

/** Map dBFS (-100..0) to a human label. */
export function loudnessLabel(db: number | null): LoudnessLabel {
  if (db === null || db < -60) return 'Silent'
  if (db < -45) return 'Whisper'
  if (db < -35) return 'Quiet'
  if (db < -22) return 'Normal'
  if (db < -12) return 'Loud'
  return 'Very loud'
}

/** Map dBFS to 0..100 for meters. */
export function dbToPercent(db: number | null): number {
  if (db === null) return 0
  return Math.max(0, Math.min(100, ((db + 70) / 70) * 100))
}

export type Streaks = { current: number; longest: number }

/**
 * A streak is consecutive local calendar days with at least one prayer.
 * The current streak still counts if today has no prayer yet but yesterday did.
 */
export function computeStreaks(sessions: PrayerSession[], now = Date.now()): Streaks {
  const days = new Set(sessions.map((s) => dayKey(s.startedAt)))
  if (days.size === 0) return { current: 0, longest: 0 }

  let current = 0
  let cursor = startOfDay(now)
  if (!days.has(dayKey(cursor))) cursor = addDays(cursor, -1)
  while (days.has(dayKey(cursor))) {
    current++
    cursor = addDays(cursor, -1)
  }

  const sorted = [...days].sort()
  let longest = 1
  let run = 1
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1] + 'T00:00:00').getTime()
    const cur = new Date(sorted[i] + 'T00:00:00').getTime()
    if (dayKey(addDays(prev, 1)) === dayKey(cur)) {
      run++
    } else {
      run = 1
    }
    longest = Math.max(longest, run)
  }
  return { current, longest }
}

export type Totals = {
  count: number
  totalSec: number
  avgSec: number
  longestSec: number
  avgDb: number | null
  daysPrayed: number
}

export function computeTotals(sessions: PrayerSession[]): Totals {
  const count = sessions.length
  const totalSec = sessions.reduce((a, s) => a + s.durationSec, 0)
  const withDb = sessions.filter((s) => s.avgDb !== null)
  const avgDb =
    withDb.length > 0
      ? withDb.reduce((a, s) => a + (s.avgDb ?? 0), 0) / withDb.length
      : null
  return {
    count,
    totalSec,
    avgSec: count ? totalSec / count : 0,
    longestSec: sessions.reduce((a, s) => Math.max(a, s.durationSec), 0),
    avgDb,
    daysPrayed: new Set(sessions.map((s) => dayKey(s.startedAt))).size,
  }
}

export type Bucket<K extends string> = { key: K; count: number; totalSec: number }

export function byDayOfWeek(sessions: PrayerSession[]): Bucket<(typeof DAY_NAMES)[number]>[] {
  const buckets = DAY_NAMES.map((key) => ({ key, count: 0, totalSec: 0 }))
  for (const s of sessions) {
    const b = buckets[new Date(s.startedAt).getDay()]
    b.count++
    b.totalSec += s.durationSec
  }
  return buckets
}

export function byTimeOfDay(sessions: PrayerSession[]): Bucket<TimeOfDay>[] {
  const buckets = TIME_OF_DAY.map((key) => ({ key, count: 0, totalSec: 0 }))
  for (const s of sessions) {
    const b = buckets[TIME_OF_DAY.indexOf(timeOfDay(s.startedAt))]
    b.count++
    b.totalSec += s.durationSec
  }
  return buckets
}

export function topBucket<K extends string>(buckets: Bucket<K>[]): Bucket<K> | null {
  const best = buckets.reduce<Bucket<K> | null>(
    (acc, b) => (b.count > 0 && (!acc || b.count > acc.count) ? b : acc),
    null,
  )
  return best
}

export type DayCell = { key: string; ts: number; totalSec: number; count: number }

/** Last `days` calendar days ending today, oldest first. */
export function recentDays(sessions: PrayerSession[], days: number, now = Date.now()): DayCell[] {
  const map = new Map<string, DayCell>()
  const today = startOfDay(now)
  for (let i = days - 1; i >= 0; i--) {
    const ts = addDays(today, -i)
    const key = dayKey(ts)
    map.set(key, { key, ts, totalSec: 0, count: 0 })
  }
  for (const s of sessions) {
    const cell = map.get(dayKey(s.startedAt))
    if (cell) {
      cell.totalSec += s.durationSec
      cell.count++
    }
  }
  return [...map.values()]
}

export function todaySeconds(sessions: PrayerSession[], now = Date.now()): number {
  const key = dayKey(now)
  return sessions
    .filter((s) => dayKey(s.startedAt) === key)
    .reduce((a, s) => a + s.durationSec, 0)
}
