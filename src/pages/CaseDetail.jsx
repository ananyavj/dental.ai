import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import {
  getCaseById,
  updateCaseDoctorAction,
  updateCaseStatus,
} from "../lib/cases";
import {
  ArrowLeft,
  AlertTriangle,
  Clock,
  ClipboardList,
  FileText,
  Info,
  User,
  CheckCircle,
  Edit3,
  XCircle,
} from "lucide-react";

const SEVERITY_STYLES = {
  EMERGENCY: "severity-emergency",
  URGENT: "severity-urgent",
  ROUTINE: "severity-routine",
};

export default function CaseDetail() {
  const navigate = useNavigate();
  const { caseId } = useParams();
  const [loading, setLoading] = useState(true);
  const [caseRecord, setCaseRecord] = useState(null);

  useEffect(() => {
    const loadCase = async () => {
      setLoading(true);
      const result = await getCaseById(caseId);
      setCaseRecord(result);
      setLoading(false);
    };

    loadCase();
  }, [caseId]);

  const pathway = useMemo(() => caseRecord?.pathway || null, [caseRecord]);

  const handleDoctorAction = async (action) => {
    if (!caseRecord?.id) return;
    const nextStatus = action === "accepted" ? "completed" : "review";
    await updateCaseDoctorAction(caseRecord.id, action);
    await updateCaseStatus(caseRecord.id, nextStatus);
    setCaseRecord((prev) =>
      prev ? { ...prev, doctorAction: action, status: nextStatus } : prev,
    );
  };

  const handleStatusChange = async (status) => {
    if (!caseRecord?.id) return;
    await updateCaseStatus(caseRecord.id, status);
    setCaseRecord((prev) => (prev ? { ...prev, status } : prev));
  };

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/cases")}
            className="btn-ghost text-xs py-1.5"
          >
            <ArrowLeft size={13} /> Back to Cases
          </button>
        </div>

        {loading && (
          <div className="card p-5">
            <p className="text-xs text-dental-text-secondary">
              Loading case details...
            </p>
          </div>
        )}

        {!loading && !caseRecord && (
          <div className="card p-5">
            <p className="text-sm font-semibold text-dental-text">
              Case not found
            </p>
            <p className="text-xs text-dental-text-secondary mt-1">
              This case may have been deleted or is not available in the current
              storage.
            </p>
          </div>
        )}

        {!loading && caseRecord && (
          <>
            <div className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-lg font-bold text-dental-text flex items-center gap-2">
                    <User size={16} className="text-dental-blue" />{" "}
                    {caseRecord.patientName}
                  </h1>
                  <p className="text-xs text-dental-text-secondary mt-1">
                    {caseRecord.age || "—"}y · {caseRecord.sex || "—"}
                  </p>
                </div>
                <span
                  className={
                    SEVERITY_STYLES[caseRecord.severity] || "severity-routine"
                  }
                >
                  {caseRecord.severity || "ROUTINE"}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="bg-dental-surface rounded-lg p-3">
                  <p className="text-[10px] text-dental-text-secondary uppercase tracking-wide">
                    Status
                  </p>
                  <p className="text-xs font-semibold text-dental-text mt-1">
                    {caseRecord.status || "active"}
                  </p>
                </div>
                <div className="bg-dental-surface rounded-lg p-3">
                  <p className="text-[10px] text-dental-text-secondary uppercase tracking-wide">
                    Doctor Action
                  </p>
                  <p className="text-xs font-semibold text-dental-text mt-1">
                    {caseRecord.doctorAction || "pending"}
                  </p>
                </div>
                <div className="bg-dental-surface rounded-lg p-3">
                  <p className="text-[10px] text-dental-text-secondary uppercase tracking-wide">
                    Created
                  </p>
                  <p className="text-xs font-semibold text-dental-text mt-1 flex items-center gap-1">
                    <Clock size={10} />
                    {new Date(caseRecord.timestamp).toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <p className="text-[10px] text-dental-text-secondary uppercase tracking-wide">
                    Chief Complaint
                  </p>
                  <p className="text-xs text-dental-text mt-1">
                    {caseRecord.chiefComplaint || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-dental-text-secondary uppercase tracking-wide">
                    Medical History
                  </p>
                  <p className="text-xs text-dental-text mt-1">
                    {caseRecord.medicalHistory || "Not provided"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-dental-text-secondary uppercase tracking-wide">
                    Clinical Findings
                  </p>
                  <p className="text-xs text-dental-text mt-1">
                    {caseRecord.clinicalFindings || "Not provided"}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-dental-border">
                <p className="text-[10px] text-dental-text-secondary uppercase tracking-wide mb-2">
                  Doctor Decision
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDoctorAction("accepted")}
                    className="btn-primary text-xs py-1.5"
                  >
                    <CheckCircle size={12} /> Accept
                  </button>
                  <button
                    onClick={() => handleDoctorAction("modified")}
                    className="btn-secondary text-xs py-1.5"
                  >
                    <Edit3 size={12} /> Modified
                  </button>
                  <button
                    onClick={() => handleDoctorAction("rejected")}
                    className="bg-red-50 text-red-700 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors flex items-center gap-1.5"
                  >
                    <XCircle size={12} /> Reject
                  </button>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-[10px] text-dental-text-secondary uppercase tracking-wide mb-2">
                  Case Status
                </p>
                <div className="flex gap-2">
                  {["active", "review", "completed"].map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(status)}
                      className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                        caseRecord.status === status
                          ? "bg-dental-blue text-white border-dental-blue"
                          : "text-dental-text-secondary border-dental-border hover:border-dental-blue"
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="card p-5">
              <h2 className="text-sm font-semibold text-dental-text flex items-center gap-2">
                <ClipboardList size={14} className="text-dental-blue" /> Pathway
                Summary
              </h2>

              {!pathway && (
                <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                  <Info size={13} className="text-amber-600 mt-0.5" />
                  <p className="text-xs text-amber-700">
                    No saved pathway payload found for this case yet.
                  </p>
                </div>
              )}

              {pathway && (
                <div className="mt-3 space-y-3">
                  <div>
                    <p className="text-[10px] text-dental-text-secondary uppercase tracking-wide">
                      Triage Reason
                    </p>
                    <p className="text-xs text-dental-text mt-1">
                      {pathway.triageReason || "Not available"}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] text-dental-text-secondary uppercase tracking-wide">
                      Red Flags
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {pathway.redFlags?.length ? (
                        pathway.redFlags.map((flag, i) => (
                          <span
                            key={i}
                            className="bg-red-50 text-red-700 border border-red-200 text-[10px] px-2 py-0.5 rounded-full"
                          >
                            {flag}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-dental-text-secondary">
                          No red flags.
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-dental-surface rounded-lg p-3">
                      <p className="text-[10px] text-dental-text-secondary uppercase tracking-wide">
                        Differentials
                      </p>
                      <p className="text-xs font-semibold text-dental-text mt-1">
                        {pathway.differentials?.length || 0}
                      </p>
                    </div>
                    <div className="bg-dental-surface rounded-lg p-3">
                      <p className="text-[10px] text-dental-text-secondary uppercase tracking-wide">
                        Investigations
                      </p>
                      <p className="text-xs font-semibold text-dental-text mt-1">
                        {pathway.investigations?.length || 0}
                      </p>
                    </div>
                    <div className="bg-dental-surface rounded-lg p-3">
                      <p className="text-[10px] text-dental-text-secondary uppercase tracking-wide">
                        Management Steps
                      </p>
                      <p className="text-xs font-semibold text-dental-text mt-1">
                        {pathway.management?.length || 0}
                      </p>
                    </div>
                    <div className="bg-dental-surface rounded-lg p-3">
                      <p className="text-[10px] text-dental-text-secondary uppercase tracking-wide">
                        Evidence Sources
                      </p>
                      <p className="text-xs font-semibold text-dental-text mt-1">
                        {pathway.evidence?.length || 0}
                      </p>
                    </div>
                  </div>

                  {pathway.differentials?.length > 0 && (
                    <div>
                      <p className="text-[10px] text-dental-text-secondary uppercase tracking-wide">
                        Differential Diagnoses
                      </p>
                      <div className="mt-1 space-y-1.5">
                        {pathway.differentials.map((item, idx) => (
                          <div
                            key={idx}
                            className="bg-dental-surface rounded-lg p-2.5"
                          >
                            <p className="text-xs font-semibold text-dental-text">
                              {item.diagnosis}
                            </p>
                            <p className="text-[10px] text-dental-text-secondary mt-0.5">
                              {item.probability} · {item.specialty}
                              {item.icd10 ? ` · ${item.icd10}` : ""}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {pathway.investigations?.length > 0 && (
                    <div>
                      <p className="text-[10px] text-dental-text-secondary uppercase tracking-wide">
                        Investigations
                      </p>
                      <div className="mt-1 space-y-1.5">
                        {pathway.investigations.map((item, idx) => (
                          <div
                            key={idx}
                            className="bg-dental-surface rounded-lg p-2.5"
                          >
                            <p className="text-xs font-semibold text-dental-text">
                              {item.name}
                            </p>
                            <p className="text-[10px] text-dental-text-secondary mt-0.5">
                              {item.priority} · {item.rationale}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {pathway.management?.length > 0 && (
                    <div>
                      <p className="text-[10px] text-dental-text-secondary uppercase tracking-wide">
                        Management Plan
                      </p>
                      <div className="mt-1 space-y-1.5">
                        {pathway.management.map((item, idx) => (
                          <div
                            key={idx}
                            className="bg-dental-surface rounded-lg p-2.5"
                          >
                            <p className="text-xs font-semibold text-dental-text">
                              {item.phase}: {item.action}
                            </p>
                            {item.detail && (
                              <p className="text-[10px] text-dental-text-secondary mt-0.5">
                                {item.detail}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {pathway.referral?.required && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                      <AlertTriangle
                        size={13}
                        className="text-amber-700 mt-0.5"
                      />
                      <p className="text-xs text-amber-800">
                        Referral required:{" "}
                        {pathway.referral.specialty || "Specialist"} (
                        {pathway.referral.urgency || "As advised"})
                      </p>
                    </div>
                  )}

                  {pathway.disclaimer && (
                    <div className="bg-dental-blue-light border border-dental-blue rounded-lg p-3 flex items-start gap-2">
                      <FileText size={13} className="text-dental-blue mt-0.5" />
                      <p className="text-xs text-dental-blue">
                        {pathway.disclaimer}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
