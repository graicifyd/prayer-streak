import { DEFAULT_SETTINGS, type PrayerSession, type Settings } from './types'

const SESSIONS_KEY = 'prayer-streak:sessions'
const SETTINGS_KEY = 'prayer-streak:settings'

export function loadSessions(): PrayerSession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as PrayerSession[]) : []
  } catch {
    return []
  }
}

export function saveSessions(sessions: PrayerSession[]) {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions))
}

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return DEFAULT_SETTINGS
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(settings: Settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

// --- Recordings (IndexedDB, blobs are too large for localStorage) ---

const DB_NAME = 'prayer-streak'
const STORE = 'recordings'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function tx<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE, mode)
        const req = run(t.objectStore(STORE))
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
        t.oncomplete = () => db.close()
      }),
  )
}

export function saveRecording(id: string, blob: Blob) {
  return tx('readwrite', (s) => s.put(blob, id))
}

export function getRecording(id: string): Promise<Blob | undefined> {
  return tx<Blob | undefined>('readonly', (s) => s.get(id) as IDBRequest<Blob | undefined>)
}

export function deleteRecording(id: string) {
  return tx('readwrite', (s) => s.delete(id))
}

export function clearRecordings() {
  return tx('readwrite', (s) => s.clear())
}
