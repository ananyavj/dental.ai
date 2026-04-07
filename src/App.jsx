import { useState, useEffect, createContext, useContext } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from './supabase'
import Dashboard from './pages/Dashboard'
import SpecialtyAIs from './pages/SpecialtyAIs'
import XrayAnalysis from './pages/XrayAnalysis'
import DrugReference from './pages/DrugReference'
import DentalTV from './pages/DentalTV'
import DiscoverDental from './pages/DiscoverDental'
import ReferralBuilder from './pages/ReferralBuilder'
import TreatmentPlan from './pages/TreatmentPlan'
import AuditTrail from './pages/AuditTrail'
import PeerReview from './pages/PeerReview'
import PatientCases from './pages/PatientCases'
import ResearchHub from './pages/ResearchHub'
import Auth from './pages/Auth'

// ── Auth Context ──────────────────────────────────────────────────────────────
const AuthContext = createContext({ session: null, user: null, loading: true })

export const useAuth = () => useContext(AuthContext)

function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (!isSupabaseConfigured) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#f8fafc] p-10 text-center animate-fade-in">
        <div className="w-16 h-16 bg-dental-blue-light rounded-full flex items-center justify-center mb-6">
          <div className="w-8 h-8 border-2 border-dental-blue animate-pulse rounded-lg"></div>
        </div>
        <h1 className="text-xl font-bold text-dental-text tracking-tight mb-2">Supabase Migration Required</h1>
        <p className="text-sm text-dental-text-secondary max-w-sm border-b border-dental-border pb-6 mb-6">
          Phase 2 integration is active, but your Supabase environment variables are missing or use default placeholders.
        </p>
        <div className="bg-white border border-dental-border rounded-2xl p-6 text-left max-w-md shadow-panel">
          <p className="text-[10px] font-bold text-dental-blue uppercase tracking-widest mb-3">Quick Setup Guide</p>
          <ol className="text-xs text-dental-text-secondary space-y-3 pl-4 list-decimal">
            <li>Open the <strong>.env</strong> file in the project root.</li>
            <li>Replace <strong>VITE_SUPABASE_URL</strong> and <strong>VITE_SUPABASE_ANON_KEY</strong> with your project keys.</li>
            <li>Restar the dev server if changes don't take effect immediately.</li>
          </ol>
          <div className="mt-6 flex items-start gap-2 bg-dental-blue-light/50 p-3 rounded-xl border border-dental-blue/10">
            <div className="text-dental-blue mt-0.5">⚠️</div>
            <p className="text-[10px] text-dental-blue font-medium leading-relaxed italic">
              "Dental.ai requires verified auth for clinical data privacy. No guest mode is allowed in Phase 2."
            </p>
          </div>
        </div>
        <p className="text-[10px] text-slate-400 mt-8 font-mono">Status: WAITING_FOR_CREDENTIALS</p>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ session, user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

// ── Protected Route ───────────────────────────────────────────────────────────
function ProtectedRoute({ children }) {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-dental-surface">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dental-blue"></div>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/auth" state={{ from: location }} replace />
  }

  return children
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Route */}
          <Route path="/auth" element={<Auth />} />

          {/* Protected Routes */}
          <Route path="/" element={<ProtectedRoute><Navigate to="/workspace" replace /></ProtectedRoute>} />
          <Route path="/workspace" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/specialty-ais" element={<ProtectedRoute><SpecialtyAIs /></ProtectedRoute>} />
          <Route path="/xray" element={<ProtectedRoute><XrayAnalysis /></ProtectedRoute>} />
          <Route path="/drugs" element={<ProtectedRoute><DrugReference /></ProtectedRoute>} />
          <Route path="/dental-tv" element={<ProtectedRoute><DentalTV /></ProtectedRoute>} />
          <Route path="/discover" element={<ProtectedRoute><DiscoverDental /></ProtectedRoute>} />
          <Route path="/research" element={<ProtectedRoute><ResearchHub /></ProtectedRoute>} />
          <Route path="/referral" element={<ProtectedRoute><ReferralBuilder /></ProtectedRoute>} />
          <Route path="/treatment-plan" element={<ProtectedRoute><TreatmentPlan /></ProtectedRoute>} />
          <Route path="/audit" element={<ProtectedRoute><AuditTrail /></ProtectedRoute>} />
          <Route path="/peer-review" element={<ProtectedRoute><PeerReview /></ProtectedRoute>} />
          <Route path="/cases" element={<ProtectedRoute><PatientCases /></ProtectedRoute>} />
          
          <Route path="*" element={<Navigate to="/workspace" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
