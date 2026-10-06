import { NavLink, Route, Routes } from 'react-router-dom'
import Today from './features/Today'
import Train from './features/Train'
import Session from './features/Session'
import Eat from './features/Eat'
import Progress from './features/Progress'
import SettingsPage from './features/SettingsPage'

const tabs = [
  { to: '/', label: 'Hoy', icon: '🏠' },
  { to: '/entrenar', label: 'Entrenar', icon: '🏋️' },
  { to: '/comer', label: 'Comer', icon: '🥗' },
  { to: '/progreso', label: 'Progreso', icon: '📈' },
  { to: '/ajustes', label: 'Ajustes', icon: '⚙️' },
]

export default function App() {
  return (
    <div className="mx-auto min-h-screen max-w-xl pb-28">
      <main className="px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <Routes>
          <Route path="/" element={<Today />} />
          <Route path="/entrenar" element={<Train />} />
          <Route path="/entrenar/:code" element={<Session />} />
          <Route path="/comer" element={<Eat />} />
          <Route path="/progreso" element={<Progress />} />
          <Route path="/ajustes" element={<SettingsPage />} />
        </Routes>
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-violet-100 bg-white pb-[env(safe-area-inset-bottom)]" aria-label="Principal">
        <ul className="mx-auto flex max-w-xl">
          {tabs.map((t) => (
            <li key={t.to} className="flex-1">
              <NavLink to={t.to} end={t.to === '/'} className={({ isActive }) => `flex min-h-14 flex-col items-center justify-center text-xs ${isActive ? 'font-bold text-brand' : 'text-ink/60'}`}>
                <span className="text-lg" aria-hidden>{t.icon}</span>
                {t.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
