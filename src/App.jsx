import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'

// Auth pages
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'

// App pages
import Dashboard from './pages/Dashboard'
import Chatbot from './pages/Chatbot'
import XrayAnalysis from './pages/XrayAnalysis'
import DrugReference from './pages/DrugReference'
import DentalTV from './pages/DentalTV'
import DiscoverDental from './pages/DiscoverDental'
import ReferralBuilder from './pages/ReferralBuilder'
import TreatmentPlan from './pages/TreatmentPlan'
import AuditTrail from './pages/AuditTrail'
import PeerReview from './pages/PeerReview'
import PatientCases from './pages/PatientCases'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Redirect root */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Protected routes */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

        {/* Chat — unified chatbot (hero feature) — replaces /workspace & /specialty-ais */}
        <Route path="/chat" element={<ProtectedRoute><Chatbot /></ProtectedRoute>} />

        {/* Tools */}
        <Route path="/tools" element={<ProtectedRoute><XrayAnalysis /></ProtectedRoute>} />
        <Route path="/tools/xray" element={<ProtectedRoute><XrayAnalysis /></ProtectedRoute>} />
        <Route path="/tools/drugs" element={<ProtectedRoute><DrugReference /></ProtectedRoute>} />
        <Route path="/tools/referral" element={<ProtectedRoute><ReferralBuilder /></ProtectedRoute>} />
        <Route path="/tools/treatment-plan" element={<ProtectedRoute><TreatmentPlan /></ProtectedRoute>} />
        <Route path="/tools/audit" element={<ProtectedRoute><AuditTrail /></ProtectedRoute>} />

        {/* Other sections */}
        <Route path="/dental-tv" element={<ProtectedRoute><DentalTV /></ProtectedRoute>} />
        <Route path="/discover" element={<ProtectedRoute><DiscoverDental /></ProtectedRoute>} />
        <Route path="/patients" element={<ProtectedRoute allowedRoles={['doctor']}><PatientCases /></ProtectedRoute>} />
        <Route path="/exam" element={<ProtectedRoute allowedRoles={['student']}><PeerReview /></ProtectedRoute>} />
        <Route path="/peer-review" element={<ProtectedRoute><PeerReview /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

        {/* Legacy redirects */}
        <Route path="/workspace" element={<Navigate to="/chat" replace />} />
        <Route path="/specialty-ais" element={<Navigate to="/chat" replace />} />
        <Route path="/xray" element={<Navigate to="/tools/xray" replace />} />
        <Route path="/drugs" element={<Navigate to="/tools/drugs" replace />} />
        <Route path="/referral" element={<Navigate to="/tools/referral" replace />} />
        <Route path="/treatment-plan" element={<Navigate to="/tools/treatment-plan" replace />} />
        <Route path="/audit" element={<Navigate to="/tools/audit" replace />} />
        <Route path="/cases" element={<Navigate to="/patients" replace />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
