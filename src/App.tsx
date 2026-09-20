import { useState } from 'react'
import { useAppData } from './hooks/useAppData'
import { HistoryPage } from './pages/HistoryPage'
import { PrayPage } from './pages/PrayPage'
import { SettingsPage } from './pages/SettingsPage'
import { StatsPage } from './pages/StatsPage'

type Tab = 'pray' | 'stats' | 'history' | 'settings'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'pray', label: 'Pray', icon: '🙏' },
  { id: 'stats', label: 'Insights', icon: '📈' },
  { id: 'history', label: 'History', icon: '🕯' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
]

export default function App() {
  const [tab, setTab] = useState<Tab>('pray')
  const data = useAppData()

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <main className="flex-1 px-4 pt-8 pb-28">
        {tab === 'pray' ? (
          <PrayPage
            sessions={data.sessions}
            settings={data.settings}
            addSession={data.addSession}
            updateNote={data.updateNote}
          />
        ) : tab === 'stats' ? (
          <StatsPage sessions={data.sessions} settings={data.settings} />
        ) : tab === 'history' ? (
          <HistoryPage
            sessions={data.sessions}
            removeSession={data.removeSession}
            updateNote={data.updateNote}
          />
        ) : (
          <SettingsPage
            sessions={data.sessions}
            settings={data.settings}
            updateSettings={data.updateSettings}
            importSessions={data.importSessions}
            clearAll={data.clearAll}
          />
        )}
      </main>

      <nav className="fixed inset-x-0 bottom-0 border-t border-white/10 bg-ink/80 backdrop-blur">
        <div className="mx-auto grid w-full max-w-md grid-cols-4 px-2 pt-2 pb-[max(env(safe-area-inset-bottom),0.5rem)]">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              aria-current={tab === t.id ? 'page' : undefined}
              className={`flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-xs transition ${
                tab === t.id ? 'text-gold' : 'text-white/50 hover:text-white'
              }`}
            >
              <span className="text-lg leading-none">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
