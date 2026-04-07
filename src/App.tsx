import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/common/protected-route'
import { PageSkeleton } from './components/common/page-skeleton'
import { AppShell } from './components/layout/app-shell'
import { useAuth } from './contexts/auth-context'
import { AuditPage } from './pages/audit-page'
import { DashboardPage } from './pages/dashboard-page'
import { DentalTVPage } from './pages/dental-tv-page'
import { DrugsPage } from './pages/drugs-page'
import { ExamPage } from './pages/exam-page'
import { ForgotPasswordPage } from './pages/forgot-password-page'
import { LoginPage } from './pages/login-page'
import { PatientsPage } from './pages/patients-page'
import { ReferralPage } from './pages/referral-page'
import { SettingsPage } from './pages/settings-page'
import { SignupPage } from './pages/signup-page'
import { ToolsPage } from './pages/tools-page'
import { TreatmentPlanPage } from './pages/treatment-plan-page'
import { XrayPage } from './pages/xray-page'

const ChatbotPage = lazy(() => import('./pages/chatbot-page'))
const DiscoverPage = lazy(() => import('./pages/discover-page'))
const CaseStudyEditorPage = lazy(() => import('./pages/case-study-editor-page'))
const CaseStudyDetailPage = lazy(() => import('./pages/case-study-detail-page'))

function LazyPage({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageSkeleton />}>{children}</Suspense>
}

function HomeRedirect() {
  const { user, loading } = useAuth()
  if (loading) return <PageSkeleton />
  return <Navigate to={user ? '/dashboard' : '/login'} replace />
}

function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 text-center">
      <div className="max-w-md space-y-4">
        <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Dental.ai</p>
        <h1 className="text-3xl font-semibold">Page not found</h1>
        <p className="text-sm text-muted-foreground">This route does not exist in the lightweight Vite rebuild.</p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/chat" element={<LazyPage><ChatbotPage /></LazyPage>} />
        <Route path="/patients" element={<ProtectedRoute allowedRoles={['doctor']}><PatientsPage /></ProtectedRoute>} />
        <Route path="/discover" element={<LazyPage><DiscoverPage /></LazyPage>} />
        <Route path="/discover/case-studies/new" element={<ProtectedRoute allowedRoles={['doctor']}><LazyPage><CaseStudyEditorPage /></LazyPage></ProtectedRoute>} />
        <Route path="/discover/case-studies/:caseStudyId" element={<LazyPage><CaseStudyDetailPage /></LazyPage>} />
        <Route path="/tools" element={<ToolsPage />} />
        <Route path="/tools/drugs" element={<DrugsPage />} />
        <Route path="/tools/referral" element={<ProtectedRoute allowedRoles={['doctor']}><ReferralPage /></ProtectedRoute>} />
        <Route path="/tools/treatment-plan" element={<ProtectedRoute allowedRoles={['doctor']}><TreatmentPlanPage /></ProtectedRoute>} />
        <Route path="/tools/xray" element={<ProtectedRoute allowedRoles={['doctor']}><XrayPage /></ProtectedRoute>} />
        <Route path="/tools/audit" element={<AuditPage />} />
        <Route path="/exam" element={<ProtectedRoute allowedRoles={['student']}><ExamPage /></ProtectedRoute>} />
        <Route path="/dental-tv" element={<DentalTVPage />} />
        <Route path="/settings" element={<SettingsPage />} />

        <Route path="/workspace" element={<Navigate to="/chat" replace />} />
        <Route path="/cases" element={<Navigate to="/patients" replace />} />
        <Route path="/specialty-ais" element={<Navigate to="/chat" replace />} />
        <Route path="/xray" element={<Navigate to="/tools/xray" replace />} />
        <Route path="/drugs" element={<Navigate to="/tools/drugs" replace />} />
        <Route path="/referral" element={<Navigate to="/tools/referral" replace />} />
        <Route path="/treatment-plan" element={<Navigate to="/tools/treatment-plan" replace />} />
        <Route path="/audit" element={<Navigate to="/tools/audit" replace />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
