# Prayer Streak

A small, local-first web app you open when you pray. It measures how long you pray, how loud you pray, keeps your streak, and shows when you pray most.

## Features

- **Prayer timer** – tap *Start praying*, tap *Finish prayer*. A ring shows progress toward your daily goal.
- **Loudness meter** – live microphone level (dBFS) while praying, plus average, peak and "% spoken aloud" per prayer. Nothing is uploaded; the audio is analysed in the browser.
- **Streaks** – current and longest streak of consecutive days with at least one prayer.
- **Insights** – days of the week you pray most, time of day (morning/afternoon/evening/night), 4-week calendar, totals, averages and records.
- **History** – every prayer with its stats and an optional note.
- **Optional recording** – toggle *Record this prayer* to keep the audio (stored in IndexedDB on your device only) and play it back from History. Off by default; can be enabled by default in Settings.
- **Backup** – export/import prayers as JSON.

## Stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · Web Audio API · MediaRecorder · localStorage + IndexedDB

## Development

```sh
npm install
npm run dev      # http://localhost:5173
npm run lint     # oxlint
npm run build    # tsc -b && vite build
```

Microphone access requires HTTPS or `localhost`.

## Data

All data lives in the browser:

| Key / store                   | Contents                          |
| ----------------------------- | --------------------------------- |
| `localStorage` `prayer-streak:sessions` | Prayer sessions (JSON)   |
| `localStorage` `prayer-streak:settings` | Settings (JSON)          |
| IndexedDB `prayer-streak/recordings`     | Audio blobs keyed by session id |
