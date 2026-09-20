import { useEffect, useState } from 'react'
import { Button, Card } from '../components/ui'
import { formatDuration, loudnessLabel, timeOfDay } from '../lib/stats'
import { getRecording } from '../lib/storage'
import type { PrayerSession } from '../lib/types'

type Props = {
  sessions: PrayerSession[]
  removeSession: (id: string) => Promise<void>
  updateNote: (id: string, note: string) => void
}

export function HistoryPage({ sessions, removeSession, updateNote }: Props) {
  if (sessions.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-semibold">History</h1>
        <Card className="text-center text-white/60">No prayers yet.</Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-semibold">History</h1>
      <ul className="flex flex-col gap-3">
        {sessions.map((s) => (
          <li key={s.id}>
            <SessionItem session={s} onDelete={() => removeSession(s.id)} onNote={(n) => updateNote(s.id, n)} />
          </li>
        ))}
      </ul>
    </div>
  )
}

function SessionItem({
  session: s,
  onDelete,
  onNote,
}: {
  session: PrayerSession
  onDelete: () => void
  onNote: (note: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const started = new Date(s.startedAt)

  useEffect(() => {
    if (!open || !s.hasRecording) return
    let url: string | null = null
    void getRecording(s.id).then((blob) => {
      if (blob) {
        url = URL.createObjectURL(blob)
        setAudioUrl(url)
      }
    })
    return () => {
      if (url) URL.revokeObjectURL(url)
      setAudioUrl(null)
    }
  }, [open, s.id, s.hasRecording])

  return (
    <Card>
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-start justify-between gap-3 text-left">
        <div>
          <div className="font-medium">
            {started.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            <span className="ml-2 text-sm text-white/50">
              {started.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })} · {timeOfDay(s.startedAt)}
            </span>
          </div>
          <div className="mt-1 text-sm text-white/70">
            {formatDuration(s.durationSec)} · {loudnessLabel(s.avgDb)}
            {s.hasRecording ? ' · 🎙' : ''}
          </div>
          {s.note ? <div className="mt-1 text-sm text-white/60 italic">“{s.note}”</div> : null}
        </div>
        <span className="text-white/40">{open ? '▴' : '▾'}</span>
      </button>

      {open ? (
        <div className="mt-4 flex flex-col gap-3 border-t border-white/10 pt-4">
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <Detail label="Avg" value={s.avgDb !== null ? `${s.avgDb.toFixed(0)} dB` : '—'} />
            <Detail label="Peak" value={s.peakDb !== null ? `${s.peakDb.toFixed(0)} dB` : '—'} />
            <Detail label="Aloud" value={s.voicedRatio !== null ? `${Math.round(s.voicedRatio * 100)}%` : '—'} />
          </div>

          {s.hasRecording ? (
            audioUrl ? (
              <audio controls src={audioUrl} className="w-full" />
            ) : (
              <div className="text-xs text-white/50">Loading recording…</div>
            )
          ) : null}

          <textarea
            defaultValue={s.note}
            onBlur={(e) => {
              if (e.target.value !== s.note) onNote(e.target.value.trim())
            }}
            placeholder="Add a note"
            rows={2}
            className="w-full resize-none rounded-xl border border-white/10 bg-black/30 p-2 text-sm outline-none focus:border-gold"
          />

          <div className="flex justify-end gap-2">
            {confirmDelete ? (
              <>
                <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
                  Cancel
                </Button>
                <Button variant="danger" onClick={onDelete}>
                  Delete forever
                </Button>
              </>
            ) : (
              <Button variant="danger" onClick={() => setConfirmDelete(true)}>
                Delete
              </Button>
            )}
          </div>
        </div>
      ) : null}
    </Card>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-black/20 p-2">
      <div className="text-[10px] uppercase tracking-wider text-white/50">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  )
}
