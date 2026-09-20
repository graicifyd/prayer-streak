import { useCallback, useEffect, useState } from 'react'
import {
  clearRecordings,
  deleteRecording,
  loadSessions,
  loadSettings,
  saveRecording,
  saveSessions,
  saveSettings,
} from '../lib/storage'
import type { PrayerSession, Settings } from '../lib/types'

export type NewSession = Omit<PrayerSession, 'id' | 'hasRecording'> & { recording: Blob | null }

export function useAppData() {
  const [sessions, setSessions] = useState<PrayerSession[]>(loadSessions)
  const [settings, setSettings] = useState<Settings>(loadSettings)

  useEffect(() => saveSessions(sessions), [sessions])
  useEffect(() => saveSettings(settings), [settings])

  const addSession = useCallback(async (input: NewSession): Promise<PrayerSession> => {
    const { recording, ...rest } = input
    const id = crypto.randomUUID()
    let hasRecording = false
    if (recording && recording.size > 0) {
      try {
        await saveRecording(id, recording)
        hasRecording = true
      } catch {
        hasRecording = false
      }
    }
    const session: PrayerSession = { ...rest, id, hasRecording }
    setSessions((prev) => [session, ...prev])
    return session
  }, [])

  const updateNote = useCallback((id: string, note: string) => {
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, note } : s)))
  }, [])

  const removeSession = useCallback(async (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id))
    await deleteRecording(id).catch(() => undefined)
  }, [])

  const importSessions = useCallback((incoming: PrayerSession[]) => {
    setSessions((prev) => {
      const seen = new Set(prev.map((s) => s.id))
      const fresh = incoming
        .filter((s) => !seen.has(s.id))
        .map((s) => ({ ...s, hasRecording: false }))
      return [...prev, ...fresh].sort((a, b) => b.startedAt - a.startedAt)
    })
  }, [])

  const clearAll = useCallback(async () => {
    setSessions([])
    await clearRecordings().catch(() => undefined)
  }, [])

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...patch }))
  }, [])

  return {
    sessions,
    settings,
    addSession,
    updateNote,
    removeSession,
    importSessions,
    clearAll,
    updateSettings,
  }
}
