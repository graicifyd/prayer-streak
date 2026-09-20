import { BarChart, Card, SectionTitle, Stat } from '../components/ui'
import {
  byDayOfWeek,
  byTimeOfDay,
  computeStreaks,
  computeTotals,
  formatDuration,
  loudnessLabel,
  recentDays,
  topBucket,
} from '../lib/stats'
import type { PrayerSession, Settings } from '../lib/types'

export function StatsPage({ sessions, settings }: { sessions: PrayerSession[]; settings: Settings }) {
  const streaks = computeStreaks(sessions)
  const totals = computeTotals(sessions)
  const dow = byDayOfWeek(sessions)
  const tod = byTimeOfDay(sessions)
  const topDay = topBucket(dow)
  const topTime = topBucket(tod)
  const days = recentDays(sessions, 28)
  const goalSec = settings.dailyGoalMin * 60
  const goalDays = days.filter((d) => d.totalSec >= goalSec).length

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-semibold">Insights</h1>
        <Card className="text-center text-white/60">
          No prayers yet. Your streaks, patterns and loudness trends will appear here.
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-3xl font-semibold">Insights</h1>

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Current streak" value={`${streaks.current}d`} hint={`Longest ${streaks.longest}d`} />
        <Stat label="Days prayed" value={totals.daysPrayed} hint={`${totals.count} prayers`} />
        <Stat label="Total time" value={formatDuration(totals.totalSec)} hint={`avg ${formatDuration(totals.avgSec)}`} />
        <Stat
          label="Typical loudness"
          value={loudnessLabel(totals.avgDb)}
          hint={totals.avgDb !== null ? `${totals.avgDb.toFixed(0)} dB avg` : 'no mic data'}
        />
      </div>

      <section>
        <SectionTitle>Last 4 weeks</SectionTitle>
        <Card>
          <div className="grid grid-cols-7 gap-1.5">
            {days.map((d) => {
              const intensity =
                d.count === 0 ? 'bg-white/10' : d.totalSec >= goalSec ? 'bg-gold' : 'bg-gold/45'
              return (
                <div
                  key={d.key}
                  title={`${d.key}: ${d.count} prayer${d.count === 1 ? '' : 's'}, ${formatDuration(d.totalSec)}`}
                  className={`aspect-square rounded-md ${intensity}`}
                />
              )
            })}
          </div>
          <div className="mt-3 flex justify-between text-xs text-white/60">
            <span>{days.filter((d) => d.count > 0).length}/28 days prayed</span>
            <span>{goalDays} days hit the {settings.dailyGoalMin}m goal</span>
          </div>
        </Card>
      </section>

      <section>
        <SectionTitle>Days you pray most</SectionTitle>
        <Card>
          <BarChart data={dow} />
          {topDay ? (
            <p className="mt-3 text-sm text-white/70">
              You pray most on <span className="font-medium text-gold">{longDay(topDay.key)}s</span>{' '}
              ({topDay.count} prayer{topDay.count === 1 ? '' : 's'}, {formatDuration(topDay.totalSec)}).
            </p>
          ) : null}
        </Card>
      </section>

      <section>
        <SectionTitle>Time of day</SectionTitle>
        <Card>
          <BarChart data={tod} />
          {topTime ? (
            <p className="mt-3 text-sm text-white/70">
              Most of your prayers happen in the{' '}
              <span className="font-medium text-gold">{topTime.key.toLowerCase()}</span>.
            </p>
          ) : null}
        </Card>
      </section>

      <section>
        <SectionTitle>Records</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Longest prayer" value={formatDuration(totals.longestSec)} />
          <Stat
            label="Loudest prayer"
            value={(() => {
              const peak = sessions.reduce<number | null>(
                (a, s) => (s.peakDb !== null && (a === null || s.peakDb > a) ? s.peakDb : a),
                null,
              )
              return peak !== null ? `${peak.toFixed(0)} dB` : '—'
            })()}
          />
        </div>
      </section>
    </div>
  )
}

function longDay(short: string) {
  return (
    { Sun: 'Sunday', Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday' }[
      short
    ] ?? short
  )
}
