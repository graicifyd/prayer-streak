import { dbToPercent, loudnessLabel } from '../lib/stats'

export function LoudnessMeter({ db, thresholdDb }: { db: number | null; thresholdDb: number }) {
  const pct = dbToPercent(db)
  const thresholdPct = dbToPercent(thresholdDb)
  const label = loudnessLabel(db)
  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between text-xs text-white/60">
        <span>Loudness</span>
        <span className="font-medium text-white">
          {label}
          {db !== null ? <span className="ml-1 text-white/50">{db.toFixed(0)} dB</span> : null}
        </span>
      </div>
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-gold to-rose-400 transition-[width] duration-100"
          style={{ width: `${pct}%` }}
        />
        <div
          className="absolute top-0 h-full w-px bg-white/60"
          style={{ left: `${thresholdPct}%` }}
          title="Speaking threshold"
        />
      </div>
    </div>
  )
}
