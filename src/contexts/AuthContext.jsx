import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

// ─── Demo fallback user (used when Supabase is not configured) ─────────────────
const DEMO_PROFILES = {
  doctor: {
    id: 'demo-doctor-001',
    email: 'demo@dental.ai',
    full_name: 'Dr. Priya Sharma',
    role: 'doctor',
    institution: 'Sharma Dental Clinic, Mumbai',
    specialty: 'Conservative Dentistry & Endodontics',
    initials: 'PS',
  },
  student: {
    id: 'demo-student-001',
    email: 'student@dental.ai',
    full_name: 'Aryan Mehta',
    role: 'student',
    institution: 'Manipal College of Dental Sciences',
    specialty: 'BDS 3rd Year',
    initials: 'AM',
  },
  patient: {
    id: 'demo-patient-001',
    email: 'patient@dental.ai',
    full_name: 'Sunita Patel',
    role: 'patient',
    institution: '',
    specialty: '',
    initials: 'SP',
  },
}

// ─── Context ───────────────────────────────────────────────────────────────────
const AuthContext = createContext(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

// ─── Provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Helper to compute initials from full name
  const getInitials = (name = '') =>
    name
      .split(' ')
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()

  // ── Fetch profile from Supabase ──
  const fetchProfile = async (userId) => {
    if (!supabase) return null
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    return data
  }

  // ── Init ──
  useEffect(() => {
    if (!isSupabaseConfigured) {
      // Demo mode — check localStorage for selected demo role
      const demoRole = localStorage.getItem('dental-ai-demo-role') || 'doctor'
      const demoProfile = DEMO_PROFILES[demoRole] || DEMO_PROFILES.doctor
      setUser({ id: demoProfile.id, email: demoProfile.email })
      setProfile(demoProfile)
      setLoading(false)
      return
    }

    // Real Supabase auth
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        const p = await fetchProfile(session.user.id)
        if (p) setProfile({ ...p, initials: getInitials(p.full_name) })
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user)
          const p = await fetchProfile(session.user.id)
          if (p) setProfile({ ...p, initials: getInitials(p.full_name) })
        } else {
          setUser(null)
          setProfile(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // ── Sign In ──
  const signIn = async (email, password) => {
    if (!isSupabaseConfigured) {
      // Demo mode: pick role based on email keyword
      let role = 'doctor'
      if (email.includes('student')) role = 'student'
      if (email.includes('patient')) role = 'patient'
      localStorage.setItem('dental-ai-demo-role', role)
      const demoProfile = DEMO_PROFILES[role]
      setUser({ id: demoProfile.id, email })
      setProfile(demoProfile)
      return { error: null }
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error }

    const p = await fetchProfile(data.user.id)
    if (p) setProfile({ ...p, initials: getInitials(p.full_name) })
    return { error: null }
  }

  // ── Sign Up ──
  const signUp = async (email, password, meta) => {
    if (!isSupabaseConfigured) {
      // Demo mode signup
      const role = meta.role || 'doctor'
      localStorage.setItem('dental-ai-demo-role', role)
      const demoProfile = {
        id: `demo-${role}-${Date.now()}`,
        email,
        full_name: meta.full_name,
        role,
        institution: meta.institution || '',
        specialty: '',
        initials: getInitials(meta.full_name),
      }
      setUser({ id: demoProfile.id, email })
      setProfile(demoProfile)
      return { error: null }
    }

    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return { error }

    // Insert profile row
    const profileRow = {
      id: data.user.id,
      full_name: meta.full_name,
      role: meta.role,
      institution: meta.institution || '',
    }
    await supabase.from('profiles').insert(profileRow)
    setProfile({ ...profileRow, initials: getInitials(meta.full_name) })
    return { error: null }
  }

  // ── Sign In with Google ──
  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured) {
      // Demo mode
      const demoProfile = DEMO_PROFILES.doctor
      setUser({ id: demoProfile.id, email: demoProfile.email })
      setProfile(demoProfile)
      return { error: null }
    }
    return supabase.auth.signInWithOAuth({ provider: 'google' })
  }

  // ── Sign Out ──
  const signOut = async () => {
    if (!isSupabaseConfigured) {
      localStorage.removeItem('dental-ai-demo-role')
      setUser(null)
      setProfile(null)
      return
    }
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  // ── Reset Password ──
  const resetPassword = async (email) => {
    if (!isSupabaseConfigured) return { error: null }
    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })
  }

  const value = {
    user,
    profile,
    role: profile?.role || null,
    loading,
    isDemo: !isSupabaseConfigured,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
