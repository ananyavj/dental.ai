import { useNavigate, useLocation } from 'react-router-dom'
import {
  Activity, Users, Image, Pill, BookOpen, FileText,
  Send, ClipboardList, AlertTriangle, Calendar,
  Tv, Shield, MessageSquare, ChevronLeft, ChevronRight,
  ShieldCheck, LogOut, FlaskConical
} from 'lucide-react'
import { fetchUserProfile } from '../lib/data'
import { useState, useEffect } from 'react'
import { useAuth } from '../App'
import { supabase } from '../supabase'

const NAV_ITEMS = [
  { label: 'Clinical Pathway', icon: Activity, path: '/workspace', badge: null },
  { label: 'Patient Cases', icon: Users, path: '/cases', badge: null },
  { label: 'Specialty AIs', icon: MessageSquare, path: '/specialty-ais', badge: null },
  { label: 'X-ray Analysis', icon: Image, path: '/xray', badge: null },
  { label: 'Drug Reference', icon: Pill, path: '/drugs', badge: null },
  { label: 'Evidence Search', icon: BookOpen, path: '/discover', badge: null },
  { label: 'Research Hub', icon: FlaskConical, path: '/research', badge: null },
  { label: 'Protocol Library', icon: FileText, path: '/discover', badge: null },
  { label: 'Referral Builder', icon: Send, path: '/referral', badge: null },
  { label: 'Treatment Plan', icon: ClipboardList, path: '/treatment-plan', badge: null },
  { label: 'Urgent Cases', icon: AlertTriangle, path: '/cases', badge: '2', badgeColor: 'bg-red-500' },
  { label: "Today's Schedule", icon: Calendar, path: '/cases', badge: null },
]

const BOTTOM_NAV = [
  { label: 'Dental TV', icon: Tv, path: '/dental-tv' },
  { label: 'Peer Review', icon: MessageSquare, path: '/peer-review' },
  { label: 'Audit Trail', icon: Shield, path: '/audit' },
]

export default function Sidebar({ collapsed, onToggle }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    if (user) {
      fetchUserProfile(user.id)
        .then(setProfile)
        .catch(err => console.error('Error fetching profile:', err))
    }
  }, [user])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/auth')
  }

  const initials = profile?.name 
    ? profile.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() || '??'

  return (
    <aside
      className={`
        flex flex-col bg-white border-r border-dental-border h-screen sticky top-0 flex-shrink-0
        transition-all duration-200 ease-in-out
        ${collapsed ? 'w-14' : 'w-52'}
      `}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-3 py-4 border-b border-dental-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-dental-blue rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">D</span>
            </div>
            <span className="font-bold text-dental-text text-sm tracking-tight">Dental<span className="text-dental-blue">.ai</span></span>
          </div>
        )}
        {collapsed && (
          <div className="w-7 h-7 bg-dental-blue rounded-lg flex items-center justify-center mx-auto">
            <span className="text-white text-xs font-bold">D</span>
          </div>
        )}
        {!collapsed && (
          <button
            onClick={onToggle}
            className="w-5 h-5 text-dental-text-secondary hover:text-dental-text transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {collapsed && (
        <button
          onClick={onToggle}
          className="flex justify-center py-2 text-dental-text-secondary hover:text-dental-text transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      )}

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {NAV_ITEMS.map(({ label, icon: Icon, path, badge, badgeColor }) => {
          const isActive = location.pathname === path ||
            (path === '/workspace' && location.pathname === '/')
          
          return (
            <button
              key={label}
              onClick={() => navigate(path)}
              title={collapsed ? label : undefined}
              className={`
                w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-xs transition-colors duration-150
                ${isActive
                  ? 'bg-dental-blue-light text-dental-blue font-medium'
                  : 'text-dental-text-secondary hover:bg-dental-surface hover:text-dental-text'
                }
                ${collapsed ? 'justify-center' : ''}
              `}
            >
              <Icon size={15} className="flex-shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left">{label}</span>
                  {badge && (
                    <span className={`${badgeColor || 'bg-dental-blue'} text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none`}>
                      {badge}
                    </span>
                  )}
                </>
              )}
            </button>
          )
        })}
      </nav>

      {/* Bottom Nav */}
      <div className="border-t border-dental-border px-2 py-2 space-y-0.5">
        {BOTTOM_NAV.map(({ label, icon: Icon, path }) => (
          <button
            key={label}
            onClick={() => navigate(path)}
            title={collapsed ? label : undefined}
            className={`
              w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-xs transition-colors duration-150
              ${location.pathname === path
                ? 'bg-dental-blue-light text-dental-blue font-medium'
                : 'text-dental-text-secondary hover:bg-dental-surface hover:text-dental-text'
              }
              ${collapsed ? 'justify-center' : ''}
            `}
          >
            <Icon size={15} className="flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </button>
        ))}
      </div>

      {/* User Avatar & Info */}
      <div className={`mt-auto border-t border-dental-border p-3 ${collapsed ? 'flex flex-col items-center gap-3' : 'space-y-3'}`}>
        <div className={`flex items-center gap-2 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 bg-[#1a5fa8] rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border border-blue-100">
            <span className="text-white text-xs font-bold">{initials}</span>
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <p className="text-xs font-semibold text-slate-900 truncate">
                  {profile?.name || 'Dr. Practitioner'}
                </p>
                {profile?.is_verified && (
                  <ShieldCheck size={12} className="text-amber-500 fill-amber-50 flex-shrink-0" title="Verified Practitioner" />
                )}
              </div>
              <p className="text-[10px] text-slate-500 truncate leading-tight">
                {profile?.specialty || 'Dental Specialist'}
              </p>
            </div>
          )}
        </div>

        {!collapsed && (
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[10px] font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 border border-transparent hover:border-red-100 transition-all group"
          >
            <LogOut size={12} className="group-hover:translate-x-0.5 transition-transform" />
            Sign Out
          </button>
        )}
        {collapsed && (
          <button 
            onClick={handleLogout}
            title="Sign Out"
            className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut size={14} />
          </button>
        )}
      </div>
    </aside>
  )
}
