import { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/auth-context'
import { DisclaimerBanner } from '../common/disclaimer-banner'
import { PageSkeleton } from '../common/page-skeleton'
import { MobileNav } from './mobile-nav'
import { Sidebar } from './sidebar'
import { Topbar } from './topbar'

export function AppShell() {
  const navigate = useNavigate()
  const { loading, profile, role, signOut } = useAuth()
  const [dark, setDark] = useState<boolean>(() => localStorage.getItem('dental-ai-theme') === 'dark')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('dental-ai-theme', dark ? 'dark' : 'light')
  }, [dark])

  if (loading) {
    return (
      <div className="min-h-screen px-6 py-8">
        <PageSkeleton />
      </div>
    )
  }

  if (!role) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-panel">
          <p className="text-lg font-semibold">Profile still syncing</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Your auth session loaded, but the workspace profile is not ready yet. Try signing out and signing in again if this does not resolve in a few seconds.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <Sidebar profile={profile} role={role} />
        <div className="flex min-w-0 flex-1 flex-col">
          <DisclaimerBanner />
          <Topbar
            dark={dark}
            onToggleTheme={() => setDark(current => !current)}
            onSignOut={async () => {
              await signOut()
              navigate('/login', { replace: true })
            }}
          />
          <main className="flex-1 px-4 py-5 pb-24 lg:px-6 lg:pb-6">
            <Outlet />
          </main>
        </div>
      </div>
      <MobileNav role={role} />
    </div>
  )
}
