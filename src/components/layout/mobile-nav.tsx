import { BookOpen, LayoutDashboard, MessageSquare, Settings, Users } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import type { Role } from '../../types'
import { cn } from '../../lib/utils'

const itemsByRole: Record<Role, Array<{ to: string; label: string; icon: React.ComponentType<{ className?: string }> }>> = {
  doctor: [
    { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { to: '/chat', label: 'Chat', icon: MessageSquare },
    { to: '/patients', label: 'Patients', icon: Users },
    { to: '/discover', label: 'Discover', icon: BookOpen },
    { to: '/settings', label: 'Settings', icon: Settings },
  ],
  student: [
    { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { to: '/chat', label: 'Chat', icon: MessageSquare },
    { to: '/discover', label: 'Discover', icon: BookOpen },
    { to: '/exam', label: 'Exam', icon: Users },
    { to: '/settings', label: 'Settings', icon: Settings },
  ],
  patient: [
    { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { to: '/chat', label: 'Guide', icon: MessageSquare },
    { to: '/discover', label: 'Discover', icon: BookOpen },
    { to: '/settings', label: 'Settings', icon: Settings },
    { to: '/dental-tv', label: 'TV', icon: Users },
  ],
  admin: [
    { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { to: '/discover', label: 'Discover', icon: BookOpen },
    { to: '/tools/audit', label: 'Audit', icon: Users },
    { to: '/settings', label: 'Settings', icon: Settings },
    { to: '/chat', label: 'AI', icon: MessageSquare },
  ],
}

export function MobileNav({ role }: { role: Role }) {
  const items = itemsByRole[role]
  return (
    <nav className="fixed bottom-4 left-4 right-4 z-30 rounded-2xl border border-border bg-background/95 p-2 shadow-panel backdrop-blur lg:hidden">
      <div className="grid grid-cols-5 gap-1">
        {items.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center rounded-xl px-1 py-2 text-[11px] font-medium transition-all duration-150',
                isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              )
            }
          >
            <item.icon className="h-4 w-4" />
            <span className="mt-1">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
