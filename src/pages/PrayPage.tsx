import { useState } from 'react'
import { LoudnessMeter } from '../components/LoudnessMeter'
import { Button, Card, Toggle } from '../components/ui'
import type { NewSession } from '../hooks/useAppData'
import { usePrayerSession, type SessionResult } from '../hooks/usePrayerSession'
import {
  computeStreaks,
  formatClock,
  formatDuration,
  loudnessLabel,
  todaySeconds,
} from '../lib/stats'
import type { PrayerSession, Settings } from '../lib/types'

type Props = {
  sessions: PrayerSession[]
  settings: Settings
  addSession: (s: NewSession) => Promise<PrayerSession>
  updateNote: (id: string, note: string) => void
}

export function PrayPage({ sessions, settings, addSession, updateNote }: Props) {
  const session = usePrayerSession()
  const [recordOverride, setRecordOverride] = useState<boolean | null>(null)
  const record = recordOverride ?? settings.recordByDefault
  const [saved, setSaved] = useState<{ result: SessionResult; saved: PrayerSession } | null>(null)
  const [note, setNote] = useState('')

  const streaks = computeStreaks(sessions)
  const todaySec = todaySeconds(sessions)
  const goalSec = settings.dailyGoalMin * 60
  const liveTodaySec = todaySec + (session.status === 'running' ? session.elapsedSec : 0)
  const goalPct = Math.min(100, (liveTodaySec / goalSec) * 100)

  async function handleStop() {
    const result = await session.stop()
    if (!result) return
    const savedSession = await addSession({
      startedAt: result.startedAt,
      endedAt: result.endedAt,
      durationSec: result.durationSec,
      avgDb: result.avgDb,
      peakDb: result.peakDb,
      voicedRatio: result.voicedRatio,
      note: '',
      recording: result.recording,
    })
    setNote('')
    setRecordOverride(null)
    setSaved({ result, saved: savedSession })
  }

  if (saved) {
    const { result, saved: s } = saved
    return (
      <div className="flex flex-col gap-4">
        <div className="text-center">
          <div className="text-sm uppercase tracking-wider text-gold">Amen</div>
          <h1 className="mt-1 text-3xl font-semibold">Prayer saved</h1>
          <p className="mt-1 text-white/60">
            {streaks.current} day streak · {formatDuration(todaySec)} today
          </p>
        </div>
        <Card>
          <div className="grid grid-cols-2 gap-4">
            <Summary label="Duration" value={formatDuration(result.durationSec)} />
            <Summary
              label="Loudness"
              value={loudnessLabel(result.avgDb)}
              hint={result.avgDb !== null ? `avg ${result.avgDb.toFixed(0)} dB` : 'no mic'}
            />
            <Summary
              label="Peak"
              value={result.peakDb !== null ? `${result.peakDb.toFixed(0)} dB` : '—'}
            />
            <Summary
              label="Spoken aloud"
              value={result.voicedRatio !== null ? `${Math.round(result.voicedRatio * 100)}%` : '—'}
              hint="time above the speaking threshold"
            />
          </div>
          {s.hasRecording ? (
            <p className="mt-3 text-xs text-white/60">Recording saved. Listen back in History.</p>
          ) : null}
        </Card>
        <Card>
          <label className="block text-sm font-medium">Add a note (optional)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What did you pray about?"
            rows={3}
            className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-black/30 p-3 text-sm outline-none focus:border-gold"
          />
        </Card>
        <Button
          onClick={() => {
            if (note.trim()) updateNote(s.id, note.trim())
            setSaved(null)
          }}
          className="py-3"
        >
          Done
        </Button>
      </div>
    )
  }

  const running = session.status === 'running'

  return (
    <div className="flex flex-col gap-5">
      <header className="text-center">
        <h1 className="text-3xl font-semibold">{running ? 'Praying…' : 'Prayer Streak'}</h1>
        <p className="mt-1 text-white/60">
          {streaks.current > 0
            ? `${streaks.current} day streak · best ${streaks.longest}`
            : 'Start your streak today'}
        </p>
      </header>

      <div className="relative mx-auto flex h-64 w-64 items-center justify-center">
        <div
          className={`absolute inset-0 rounded-full bg-plum/60 blur-2xl ${running ? 'breathe' : 'opacity-40'}`}
        />
        <div
          className="absolute inset-3 rounded-full border-4 border-white/10"
          style={{
            background: `conic-gradient(var(--color-gold) ${goalPct}%, transparent 0)`,
            WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 6px), #000 0)',
            mask: 'radial-gradient(farthest-side, transparent calc(100% - 6px), #000 0)',
          }}
        />
        <div className="relative text-center">
          <div className="font-mono text-5xl font-semibold tabular-nums">
            {formatClock(running ? session.elapsedSec : 0)}
          </div>
          <div className="mt-1 text-xs text-white/60">
            {formatDuration(liveTodaySec)} / {settings.dailyGoalMin}m goal
          </div>
        </div>
      </div>

      {running ? (
        <Card>
          <LoudnessMeter db={session.liveDb} thresholdDb={settings.silenceThresholdDb} />
          <div className="mt-3 flex items-center justify-between text-xs text-white/60">
            <span>
              {session.micError
                ? session.micError
                : session.isRecording
                  ? 'Recording audio'
                  : 'Measuring loudness only'}
            </span>
            {session.isRecording ? (
              <span className="flex items-center gap-1 text-rose-300">
                <span className="h-2 w-2 animate-pulse rounded-full bg-rose-400" /> REC
              </span>
            ) : null}
          </div>
        </Card>
      ) : (
        <Card>
          <Toggle
            checked={record}
            onChange={setRecordOverride}
            label="Record this prayer"
            description="Saves audio on this device only. Off by default."
          />
        </Card>
      )}

      {running ? (
        <Button onClick={handleStop} variant="ghost" className="py-4 text-lg">
          Finish prayer
        </Button>
      ) : (
        <Button
          onClick={() => session.start({ record, silenceThresholdDb: settings.silenceThresholdDb })}
          disabled={session.status !== 'idle'}
          className="py-4 text-lg"
        >
          {session.status === 'starting' ? 'Starting…' : 'Start praying'}
        </Button>
      )}

      {!running && session.micError ? (
        <p className="text-center text-xs text-amber-200/80">{session.micError}</p>
      ) : null}
    </div>
  )
}

function Summary({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-white/50">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
      {hint ? <div className="text-xs text-white/50">{hint}</div> : null}
    </div>
  )
}
