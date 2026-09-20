import { useCallback, useEffect, useRef, useState } from 'react'

export type LoudnessSummary = {
  avgDb: number | null
  peakDb: number | null
  voicedRatio: number | null
}

export type SessionResult = LoudnessSummary & {
  startedAt: number
  endedAt: number
  durationSec: number
  recording: Blob | null
}

export type SessionStatus = 'idle' | 'starting' | 'running' | 'stopping'

type Options = {
  record: boolean
  silenceThresholdDb: number
}

const SAMPLE_MS = 100

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg']
  return candidates.find((t) => MediaRecorder.isTypeSupported(t))
}

/**
 * Drives one prayer session: elapsed timer, live microphone loudness (dBFS),
 * running loudness statistics, and an optional MediaRecorder capture.
 */
export function usePrayerSession() {
  const [status, setStatus] = useState<SessionStatus>('idle')
  const [elapsedSec, setElapsedSec] = useState(0)
  const [liveDb, setLiveDb] = useState<number | null>(null)
  const [micError, setMicError] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)

  const startedAtRef = useRef(0)
  const streamRef = useRef<MediaStream | null>(null)
  const ctxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const meterTimerRef = useRef<number | null>(null)
  const clockTimerRef = useRef<number | null>(null)
  const statsRef = useRef({ sumDb: 0, samples: 0, peakDb: -Infinity, voiced: 0 })
  const thresholdRef = useRef(-50)

  const cleanupAudio = useCallback(() => {
    if (meterTimerRef.current !== null) window.clearInterval(meterTimerRef.current)
    if (clockTimerRef.current !== null) window.clearInterval(clockTimerRef.current)
    meterTimerRef.current = null
    clockTimerRef.current = null
    analyserRef.current = null
    void ctxRef.current?.close().catch(() => undefined)
    ctxRef.current = null
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  useEffect(() => cleanupAudio, [cleanupAudio])

  const sampleLoudness = useCallback(() => {
    const analyser = analyserRef.current
    if (!analyser) return
    const buf = new Float32Array(analyser.fftSize)
    analyser.getFloatTimeDomainData(buf)
    let sum = 0
    for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i]
    const rms = Math.sqrt(sum / buf.length)
    const db = rms > 0 ? Math.max(-100, 20 * Math.log10(rms)) : -100

    const s = statsRef.current
    s.sumDb += db
    s.samples++
    s.peakDb = Math.max(s.peakDb, db)
    if (db > thresholdRef.current) s.voiced++
    setLiveDb(db)
  }, [])

  const start = useCallback(
    async ({ record, silenceThresholdDb }: Options) => {
      if (status !== 'idle') return
      setStatus('starting')
      setMicError(null)
      setElapsedSec(0)
      setLiveDb(null)
      setIsRecording(false)
      thresholdRef.current = silenceThresholdDb
      statsRef.current = { sumDb: 0, samples: 0, peakDb: -Infinity, voiced: 0 }
      chunksRef.current = []

      let stream: MediaStream | null = null
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
        })
      } catch (err) {
        setMicError(
          err instanceof Error && err.name === 'NotAllowedError'
            ? 'Microphone access was denied. Loudness and recording are disabled.'
            : 'Microphone unavailable. Loudness and recording are disabled.',
        )
      }

      if (stream) {
        streamRef.current = stream
        const ctx = new AudioContext()
        ctxRef.current = ctx
        const source = ctx.createMediaStreamSource(stream)
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 2048
        analyser.smoothingTimeConstant = 0.6
        source.connect(analyser)
        analyserRef.current = analyser
        meterTimerRef.current = window.setInterval(sampleLoudness, SAMPLE_MS)

        if (record && typeof MediaRecorder !== 'undefined') {
          try {
            const mimeType = pickMimeType()
            const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
            rec.ondataavailable = (e) => {
              if (e.data.size > 0) chunksRef.current.push(e.data)
            }
            rec.start(1000)
            recorderRef.current = rec
            setIsRecording(true)
          } catch {
            recorderRef.current = null
          }
        }
      }

      startedAtRef.current = Date.now()
      clockTimerRef.current = window.setInterval(() => {
        setElapsedSec((Date.now() - startedAtRef.current) / 1000)
      }, 250)
      setStatus('running')
    },
    [sampleLoudness, status],
  )

  const stop = useCallback(async (): Promise<SessionResult | null> => {
    if (status !== 'running') return null
    setStatus('stopping')
    const endedAt = Date.now()

    let recording: Blob | null = null
    const rec = recorderRef.current
    if (rec && rec.state !== 'inactive') {
      recording = await new Promise<Blob>((resolve) => {
        rec.onstop = () => resolve(new Blob(chunksRef.current, { type: rec.mimeType }))
        rec.stop()
      })
    }
    recorderRef.current = null
    setIsRecording(false)

    const s = statsRef.current
    const hadMic = s.samples > 0
    cleanupAudio()
    setStatus('idle')
    setLiveDb(null)

    return {
      startedAt: startedAtRef.current,
      endedAt,
      durationSec: Math.max(1, Math.round((endedAt - startedAtRef.current) / 1000)),
      avgDb: hadMic ? s.sumDb / s.samples : null,
      peakDb: hadMic ? s.peakDb : null,
      voicedRatio: hadMic ? s.voiced / s.samples : null,
      recording,
    }
  }, [cleanupAudio, status])

  return { status, elapsedSec, liveDb, micError, isRecording, start, stop }
}
