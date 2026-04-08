import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import SpecialtyAIs from "./pages/SpecialtyAIs";
import XrayAnalysis from "./pages/XrayAnalysis";
import DrugReference from "./pages/DrugReference";
import DentalTV from "./pages/DentalTV";
import DiscoverDental from "./pages/DiscoverDental";
import ReferralBuilder from "./pages/ReferralBuilder";
import TreatmentPlan from "./pages/TreatmentPlan";
import AuditTrail from "./pages/AuditTrail";
import PeerReview from "./pages/PeerReview";
import PatientCases from "./pages/PatientCases";
import CaseDetail from "./pages/CaseDetail";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/workspace" replace />} />
        <Route path="/workspace" element={<Dashboard />} />
        <Route path="/specialty-ais" element={<SpecialtyAIs />} />
        <Route path="/xray" element={<XrayAnalysis />} />
        <Route path="/drugs" element={<DrugReference />} />
        <Route path="/dental-tv" element={<DentalTV />} />
        <Route path="/discover" element={<DiscoverDental />} />
        <Route path="/referral" element={<ReferralBuilder />} />
        <Route path="/treatment-plan" element={<TreatmentPlan />} />
        <Route path="/audit" element={<AuditTrail />} />
        <Route path="/peer-review" element={<PeerReview />} />
        <Route path="/cases" element={<PatientCases />} />
        <Route path="/cases/:caseId" element={<CaseDetail />} />
        <Route path="*" element={<Navigate to="/workspace" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
