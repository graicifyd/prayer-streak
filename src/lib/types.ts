export type PrayerSession = {
  id: string
  /** Epoch ms when the prayer started. */
  startedAt: number
  /** Epoch ms when the prayer ended. */
  endedAt: number
  /** Duration in seconds. */
  durationSec: number
  /** Average loudness in dBFS (0 = max, -100 = silence). Null if mic was unavailable. */
  avgDb: number | null
  /** Peak loudness in dBFS. Null if mic was unavailable. */
  peakDb: number | null
  /** Share of time (0..1) spent speaking above the silence threshold. */
  voicedRatio: number | null
  /** Whether an audio recording exists in IndexedDB under this session id. */
  hasRecording: boolean
  note: string
}

export type Settings = {
  recordByDefault: boolean
  /** Daily goal in minutes. */
  dailyGoalMin: number
  /** Loudness threshold (dBFS) above which we count sound as "voiced". */
  silenceThresholdDb: number
}

export const DEFAULT_SETTINGS: Settings = {
  recordByDefault: false,
  dailyGoalMin: 10,
  silenceThresholdDb: -50,
}
