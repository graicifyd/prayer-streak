---
name: prayer-streak-runtime-testing
description: Local runtime testing of Prayer Streak, including microphone fallback, seeded history, and GitHub Pages prefix validation.
---

# Prayer Streak runtime testing

## Environment
- Local-first React/Vite app; no backend or login.
- Install with `npm install`, run `npm run dev -- --port 5173`.
- Use an isolated Chrome profile so data-clearing tests do not affect personal sessions.
- On macOS, if the browser accessibility provider cannot reach Chrome, launch a separate Chrome instance with `open -na "Google Chrome" --args --remote-debugging-port=9222 --user-data-dir=<isolated-profile> --no-first-run --no-default-browser-check http://localhost:5173`, then use the browser target with `cdp_port: 9222`.

## GitHub Pages preview
- Build with `GITHUB_ACTIONS=1 npm run build`, then run `npx vite preview --base /prayer-streak/ --port 4173`.
- Test `http://localhost:4173/prayer-streak/`; check generated asset paths, resolved manifest start URL/scope, and icon requests.
- A normal build shares `dist` and can overwrite the prefixed build. Coordinate with other agents; if preview is blank with `/assets/...` 404s, inspect `dist/index.html` and rebuild with the Pages environment variable before diagnosing a source defect.
- Chrome Application > Manifest reports parsing/installability issues. Missing richer-install screenshot warnings are advisory and distinct from manifest parsing failures.

## Runtime data
- Sessions key: `prayer-streak:sessions`. Settings key: `prayer-streak:settings`.
- Only seed data when authorized; use local calendar dates, unique IDs, and fields `{id, startedAt, endedAt, durationSec, avgDb, peakDb, voicedRatio, hasRecording, note}`.
- Existing ID imports should not increase session count. JSON export excludes recordings.
- A microphone-less VM should show “Microphone unavailable. Loudness and recording are disabled.” and still save a nonzero-duration session with null loudness data. Do not infer recording/playback coverage from this fallback.
- Use a 390px viewport and check both visual layout and `document.documentElement.scrollWidth === innerWidth`.

## Devin Secrets Needed
None for local runtime testing.
