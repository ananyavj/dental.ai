import { useLocation, useNavigate } from 'react-router-dom'
import { Compass, LayoutDashboard, MessageSquare, Play, Settings, Users } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const MOBILE_NAV = {
  doctor: [
    { icon: LayoutDashboard, path: '/dashboard', label: 'Home' },
    { icon: MessageSquare, path: '/chat', label: 'Chat' },
    { icon: Users, path: '/patients', label: 'Patients' },
    { icon: Compass, path: '/discover', label: 'Discover' },
    { icon: Settings, path: '/settings', label: 'Settings' },
  ],
  student: [
    { icon: LayoutDashboard, path: '/dashboard', label: 'Home' },
    { icon: MessageSquare, path: '/chat', label: 'Chat' },
    { icon: Compass, path: '/discover', label: 'Discover' },
    { icon: Play, path: '/dental-tv', label: 'TV' },
    { icon: Settings, path: '/settings', label: 'Settings' },
  ],
  patient: [
    { icon: LayoutDashboard, path: '/dashboard', label: 'Home' },
    { icon: MessageSquare, path: '/chat', label: 'Chat' },
    { icon: Compass, path: '/discover', label: 'Discover' },
    { icon: Play, path: '/dental-tv', label: 'TV' },
    { icon: Settings, path: '/settings', label: 'Settings' },
  ],
}

export default function MobileNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { role } = useAuth()
  const items = MOBILE_NAV[role] || MOBILE_NAV.doctor

  return (
    <nav className="fixed bottom-4 left-4 right-4 z-50 rounded-[24px] border border-white/12 bg-[#081226]/92 p-2 text-white shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl md:hidden">
      <div className="grid grid-cols-5 gap-1">
        {items.map(({ icon, path, label }) => {
          const active = location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path))
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center justify-center rounded-[18px] px-1 py-2 text-[11px] font-medium transition ${
                active ? 'bg-[#ff7a59] text-white' : 'text-white/68 hover:bg-white/8 hover:text-white'
              }`}
            >
              {icon({ size: 18 })}
              <span className="mt-1">{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
