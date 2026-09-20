import { useRef, useState } from 'react'
import { Button, Card, SectionTitle, Toggle } from '../components/ui'
import type { PrayerSession, Settings } from '../lib/types'

type Props = {
  sessions: PrayerSession[]
  settings: Settings
  updateSettings: (patch: Partial<Settings>) => void
  importSessions: (s: PrayerSession[]) => void
  clearAll: () => Promise<void>
}

export function SettingsPage({ sessions, settings, updateSettings, importSessions, clearAll }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  function exportData() {
    const blob = new Blob([JSON.stringify({ version: 1, sessions }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `prayer-streak-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function importData(file: File) {
    try {
      const parsed: unknown = JSON.parse(await file.text())
      const list =
        parsed && typeof parsed === 'object' && Array.isArray((parsed as { sessions?: unknown }).sessions)
          ? ((parsed as { sessions: unknown[] }).sessions as PrayerSession[])
          : null
      if (!list) throw new Error('bad format')
      const valid = list.filter(
        (s) => typeof s.id === 'string' && typeof s.startedAt === 'number' && typeof s.durationSec === 'number',
      )
      importSessions(valid)
      setMessage(`Imported ${valid.length} prayer${valid.length === 1 ? '' : 's'}.`)
    } catch {
      setMessage('Could not read that file.')
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-3xl font-semibold">Settings</h1>

      <section>
        <SectionTitle>Prayer</SectionTitle>
        <Card className="flex flex-col gap-4">
          <Toggle
            checked={settings.recordByDefault}
            onChange={(v) => updateSettings({ recordByDefault: v })}
            label="Record prayers by default"
            description="You can still toggle recording before each prayer."
          />
          <label className="flex items-center justify-between gap-4">
            <span>
              <span className="block text-sm font-medium">Daily goal</span>
              <span className="block text-xs text-white/50">Minutes of prayer per day</span>
            </span>
            <input
              type="number"
              min={1}
              max={600}
              value={settings.dailyGoalMin}
              onChange={(e) => updateSettings({ dailyGoalMin: Math.max(1, Number(e.target.value) || 1) })}
              className="w-20 rounded-lg border border-white/10 bg-black/30 p-2 text-right text-sm outline-none focus:border-gold"
            />
          </label>
          <label className="block">
            <span className="flex items-center justify-between text-sm font-medium">
              Speaking threshold <span className="text-white/60">{settings.silenceThresholdDb} dB</span>
            </span>
            <span className="block text-xs text-white/50">
              Sound above this counts as praying aloud. Lower it if you whisper.
            </span>
            <input
              type="range"
              min={-80}
              max={-20}
              step={1}
              value={settings.silenceThresholdDb}
              onChange={(e) => updateSettings({ silenceThresholdDb: Number(e.target.value) })}
              className="mt-2 w-full accent-gold"
            />
          </label>
        </Card>
      </section>

      <section>
        <SectionTitle>Data</SectionTitle>
        <Card className="flex flex-col gap-3">
          <p className="text-xs text-white/50">
            Everything stays on this device. Export a JSON backup any time (recordings are not included).
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={exportData} disabled={sessions.length === 0}>
              Export JSON
            </Button>
            <Button variant="ghost" onClick={() => fileRef.current?.click()}>
              Import JSON
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void importData(f)
                e.target.value = ''
              }}
            />
          </div>
          {message ? <p className="text-xs text-gold">{message}</p> : null}
          <div className="flex justify-end gap-2 border-t border-white/10 pt-3">
            {confirmClear ? (
              <>
                <Button variant="ghost" onClick={() => setConfirmClear(false)}>
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={async () => {
                    await clearAll()
                    setConfirmClear(false)
                    setMessage('All prayers deleted.')
                  }}
                >
                  Delete everything
                </Button>
              </>
            ) : (
              <Button variant="danger" onClick={() => setConfirmClear(true)} disabled={sessions.length === 0}>
                Clear all data
              </Button>
            )}
          </div>
        </Card>
      </section>
    </div>
  )
}
