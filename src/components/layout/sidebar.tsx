import { BookOpen, ClipboardList, LayoutDashboard, MessageSquare, MonitorPlay, Settings, ShieldCheck, Stethoscope, Users, Wrench } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { Badge } from '../ui/badge'
import { cn, initials } from '../../lib/utils'
import type { Role } from '../../types'
import type { Profile } from '../../types'

const navByRole: Record<Role, Array<{ to: string; label: string; icon: React.ComponentType<{ className?: string }> }>> = {
  doctor: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/chat', label: 'Chatbot', icon: MessageSquare },
    { to: '/patients', label: 'Patient Directory', icon: Users },
    { to: '/discover', label: 'Discover', icon: BookOpen },
    { to: '/tools', label: 'Tools', icon: Wrench },
    { to: '/dental-tv', label: 'Dental TV', icon: MonitorPlay },
    { to: '/settings', label: 'Settings', icon: Settings },
  ],
  student: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/chat', label: 'Chatbot', icon: MessageSquare },
    { to: '/patients', label: 'Patient Directory', icon: Users },
    { to: '/discover', label: 'Discover', icon: BookOpen },
    { to: '/exam', label: 'Exam Mode', icon: ClipboardList },
    { to: '/dental-tv', label: 'Dental TV', icon: MonitorPlay },
    { to: '/settings', label: 'Settings', icon: Settings },
  ],
  patient: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/chat', label: 'AI Guide', icon: MessageSquare },
    { to: '/discover', label: 'Discover', icon: BookOpen },
    { to: '/dental-tv', label: 'Dental TV', icon: MonitorPlay },
    { to: '/settings', label: 'Settings', icon: Settings },
  ],
  admin: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/discover', label: 'Discover', icon: BookOpen },
    { to: '/tools/audit', label: 'Audit Trail', icon: ShieldCheck },
    { to: '/settings', label: 'Settings', icon: Settings },
  ],
}

export function Sidebar({ profile, role }: { profile: Profile | null; role: Role }) {
  const navItems = navByRole[role]
  return (
    <aside className="hidden h-screen w-60 shrink-0 border-r border-sidebar-border bg-sidebar px-4 py-5 text-sidebar-foreground lg:flex lg:flex-col">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Stethoscope className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-sidebar-foreground/60">Dental.ai</p>
          <p className="text-sm font-semibold">Clinical Workspace</p>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-sidebar-border bg-sidebar-accent p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
            {initials(profile?.full_name)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{profile?.full_name ?? 'Workspace user'}</p>
            <p className="truncate text-xs text-sidebar-foreground/60">{profile?.institution || profile?.specialty || 'Dental.ai'}</p>
          </div>
        </div>
        <Badge className="mt-3 w-fit capitalize" variant="info">
          {role}
        </Badge>
      </div>

      <nav className="space-y-1">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-150',
                isActive ? 'bg-primary text-primary-foreground' : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground'
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
