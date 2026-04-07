import { AnimatePresence, motion as Motion } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  Compass,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Play,
  Settings,
  User,
  Users,
  Wrench,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'

const NAV = {
  doctor: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'AI Chat', icon: MessageSquare, path: '/chat', accent: true },
    { label: 'Patients', icon: Users, path: '/patients' },
    { label: 'Discover', icon: Compass, path: '/discover' },
    { label: 'Dental TV', icon: Play, path: '/dental-tv' },
    { label: 'Tools', icon: Wrench, path: '/tools' },
    { label: 'Settings', icon: Settings, path: '/settings' },
  ],
  student: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'AI Chat', icon: MessageSquare, path: '/chat', accent: true },
    { label: 'Exam Mode', icon: GraduationCap, path: '/exam' },
    { label: 'Discover', icon: Compass, path: '/discover' },
    { label: 'Dental TV', icon: Play, path: '/dental-tv' },
    { label: 'Tools', icon: Wrench, path: '/tools' },
    { label: 'Settings', icon: Settings, path: '/settings' },
  ],
  patient: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'AI Chat', icon: MessageSquare, path: '/chat', accent: true },
    { label: 'Discover', icon: Compass, path: '/discover' },
    { label: 'Dental TV', icon: Play, path: '/dental-tv' },
    { label: 'Settings', icon: Settings, path: '/settings' },
  ],
}

function NavItem({ item, collapsed, pathname, navigate }) {
  const active = pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path))
  const Icon = item.icon
  return (
    <button
      onClick={() => navigate(item.path)}
      className={`flex w-full items-center gap-3 rounded-[20px] px-3 py-3 text-left transition ${
        active
          ? 'bg-white text-[#081226] shadow-[0_14px_30px_rgba(255,255,255,0.12)]'
          : item.accent
            ? 'bg-[#ff7a59] text-white hover:brightness-105'
            : 'text-white/72 hover:bg-white/8 hover:text-white'
      } ${collapsed ? 'justify-center' : ''}`}
    >
      <Icon size={18} className="shrink-0" />
      {!collapsed ? <span className="text-sm font-medium">{item.label}</span> : null}
    </button>
  )
}

export default function Sidebar({ collapsed, onToggle }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { profile, role, signOut } = useAuth()

  async function handleSignOut() {
    await signOut()
    toast.success('Signed out')
    navigate('/login', { replace: true })
  }

  const navItems = NAV[role] || NAV.doctor

  return (
    <aside className={`fixed left-0 top-0 z-50 hidden h-screen border-r border-white/8 bg-[linear-gradient(180deg,#081226_0%,#0d1c35_60%,#101b35_100%)] px-3 py-4 text-white shadow-[18px_0_60px_rgba(0,0,0,0.22)] transition-all duration-300 md:flex md:flex-col ${collapsed ? 'w-[92px]' : 'w-[280px]'}`}>
      <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-2`}>
        <AnimatePresence mode="wait">
          {!collapsed ? (
            <Motion.div
              key="expanded"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
            >
              <p className="text-xs uppercase tracking-[0.32em] text-white/45">Dental.ai</p>
              <h1 className="mt-2 text-xl font-semibold">Clinic OS</h1>
            </Motion.div>
          ) : null}
        </AnimatePresence>
        <button onClick={onToggle} className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 transition hover:bg-white/10">
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <div className="mt-6 rounded-[24px] border border-white/10 bg-white/6 p-4">
        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ff7a59] text-sm font-semibold text-white">
            {profile?.initials || <User size={16} />}
          </div>
          {!collapsed ? (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{profile?.full_name || 'Dental user'}</p>
              <p className="truncate text-xs text-white/60">{profile?.institution || profile?.specialty || 'Workspace ready'}</p>
            </div>
          ) : null}
        </div>
      </div>

      <nav className="mt-6 flex-1 space-y-2 overflow-y-auto">
        {navItems.map(item => (
          <NavItem key={item.path} item={item} collapsed={collapsed} pathname={location.pathname} navigate={navigate} />
        ))}
      </nav>

      <button onClick={handleSignOut} className={`mt-4 flex items-center gap-3 rounded-[20px] border border-white/10 px-3 py-3 text-white/72 transition hover:bg-white/8 hover:text-white ${collapsed ? 'justify-center' : ''}`}>
        <LogOut size={18} />
        {!collapsed ? <span className="text-sm font-medium">Sign out</span> : null}
      </button>
    </aside>
  )
}
