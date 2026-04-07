import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import MobileNav from './MobileNav'
import Sidebar from './Sidebar'

function useDarkMode() {
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem('dental-ai-theme')
    if (stored) return stored === 'dark'
    return false
  })

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', dark)
    localStorage.setItem('dental-ai-theme', dark ? 'dark' : 'light')
  }, [dark])

  return [dark, setDark]
}

function Topbar({ dark, setDark, sidebarCollapsed }) {
  return (
    <header className={`fixed left-0 right-0 top-0 z-40 hidden h-[72px] items-center justify-between border-b border-white/10 bg-[#081226]/92 px-6 text-white backdrop-blur-xl md:flex ${sidebarCollapsed ? 'md:left-[92px]' : 'md:left-[280px]'}`}>
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-white/45">Dental.ai</p>
        <p className="mt-1 text-sm text-white/75">Cloud-connected dental operating workspace</p>
      </div>
      <button
        onClick={() => setDark(value => !value)}
        className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
        title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {dark ? <Sun size={18} /> : <Moon size={18} />}
      </button>
    </header>
  )
}

export default function AppLayout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [dark, setDark] = useDarkMode()

  return (
    <div className="flex min-h-screen bg-[#081226] text-text-primary-light dark:bg-[#020814] dark:text-text-primary-dark">
      <div className="hidden md:flex">
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(value => !value)} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar dark={dark} setDark={setDark} sidebarCollapsed={sidebarCollapsed} />
        <main className="flex-1 pb-20 md:pb-0 md:pt-[72px]">
          {children}
        </main>
      </div>

      <MobileNav />
    </div>
  )
}
