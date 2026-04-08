import { useState, useRef, useEffect } from "react";
import AppLayout from "../components/AppLayout";
import { runClinicalPathway, followUpChat } from "../lib/gemini";
import { MOCK_CASES, logAuditEntry } from "../lib/data";
import {
  listCases,
  createCaseRecord,
  updateCaseDoctorAction,
  updateCaseStatus,
} from "../lib/cases";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Send,
  Mic,
  MicOff,
  User,
  ExternalLink,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Download,
  Flag,
  Users,
  Loader2,
  X,
  Info,
  BookOpen,
  Stethoscope,
} from "lucide-react";

// ── Severity Badge ─────────────────────────────────────────────────────────────
function SeverityBadge({ severity }) {
  const map = {
    EMERGENCY: "severity-emergency",
    URGENT: "severity-urgent",
    ROUTINE: "severity-routine",
  };
  return (
    <span className={map[severity] || "severity-routine"}>{severity}</span>
  );
}

// ── Patient Header ─────────────────────────────────────────────────────────────
function PatientHeader({ patient, severity }) {
  if (!patient) return null;
  return (
    <div className="bg-white border-b border-dental-border px-5 py-3 flex items-center gap-4">
      <div className="w-10 h-10 bg-dental-blue rounded-full flex items-center justify-center shrink-0">
        <span className="text-white text-sm font-bold">
          {patient.patientName
            ?.split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-dental-text">
            {patient.patientName}
          </h2>
          <span className="text-xs text-dental-text-secondary">
            {patient.age}y · {patient.sex}
          </span>
          {severity && <SeverityBadge severity={severity} />}
        </div>
        <p className="text-xs text-dental-text-secondary truncate mt-0.5">
          {patient.chiefComplaint}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button className="btn-ghost text-xs py-1.5">
          <Plus size={13} /> New Case
        </button>
      </div>
    </div>
  );
}

// ── Agent Progress ─────────────────────────────────────────────────────────────
function AgentProgress({ agents }) {
  const labels = {
    triage: {
      label: "Triage Agent",
      desc: "Severity scoring & red flag detection",
    },
    differentials: {
      label: "Differential Agent",
      desc: "DDx generation & ranking",
    },
    evidence: { label: "Evidence Agent", desc: "PubMed & guideline retrieval" },
    pathway: { label: "Pathway Builder", desc: "Assembling clinical pathway" },
  };
  return (
    <div className="bg-white border border-dental-border rounded-xl p-4 space-y-3 animate-fade-in">
      <p className="text-xs font-semibold text-dental-text-secondary uppercase tracking-wide">
        Multi-Agent Pipeline Running
      </p>
      {Object.entries(labels).map(([key, { label, desc }]) => {
        const status = agents[key];
        return (
          <div key={key} className="flex items-center gap-3">
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                status === "done"
                  ? "bg-green-100"
                  : status === "running"
                    ? "bg-blue-100"
                    : "bg-gray-100"
              }`}
            >
              {status === "done" ? (
                <CheckCircle size={12} className="text-green-600" />
              ) : status === "running" ? (
                <Loader2 size={12} className="text-dental-blue animate-spin" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-gray-300" />
              )}
            </div>
            <div>
              <p
                className={`text-xs font-medium ${status === "running" ? "text-dental-blue" : status === "done" ? "text-green-600" : "text-dental-text-secondary"}`}
              >
                {label}
              </p>
              <p className="text-[10px] text-dental-text-secondary">{desc}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Clinical Pathway Result ────────────────────────────────────────────────────
function PathwayResult({ pathway, onAction }) {
  if (!pathway) return null;

  return (
    <div className="space-y-3 animate-slide-in">
      {/* Emergency Banner */}
      {pathway.severity === "EMERGENCY" && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-700">
              EMERGENCY — Immediate Referral Required
            </p>
            <p className="text-xs text-red-600 mt-1">{pathway.triageReason}</p>
          </div>
        </div>
      )}

      {/* Step 1: Red Flags */}
      <div className="bg-white border border-dental-border rounded-xl p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="step-circle-red">1</div>
          <div>
            <h3 className="text-sm font-semibold text-dental-text">
              Red Flags Detected
            </h3>
            <p className="text-xs text-dental-text-secondary">
              Triage Agent · {pathway.severity}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {pathway.redFlags?.length > 0 ? (
            pathway.redFlags.map((flag, i) => (
              <span
                key={i}
                className="bg-red-50 text-red-600 border border-red-100 text-xs px-2.5 py-1 rounded-full font-medium"
              >
                {flag}
              </span>
            ))
          ) : (
            <span className="text-xs text-dental-text-secondary italic">
              No red flags identified for this presentation
            </span>
          )}
        </div>
        {pathway.triageReason && (
          <p className="text-xs text-dental-text-secondary mt-2 bg-dental-surface rounded-lg p-2">
            {pathway.triageReason}
          </p>
        )}
      </div>

      {/* Step 2: Differentials */}
      {pathway.differentials?.length > 0 && (
        <div className="bg-white border border-dental-border rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="step-circle-blue">2</div>
            <div>
              <h3 className="text-sm font-semibold text-dental-text">
                Differential Diagnoses
              </h3>
              <p className="text-xs text-dental-text-secondary">
                Differential Agent · Ranked by probability
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {pathway.differentials.map((d, i) => (
              <div
                key={i}
                className="flex items-start gap-3 py-2 border-b border-dental-border last:border-0"
              >
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${
                    d.probability === "likely"
                      ? "bg-blue-100 text-dental-blue"
                      : d.probability === "possible"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {d.probability?.toUpperCase()}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-dental-text">
                    {d.diagnosis}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="tag-pill">{d.specialty}</span>
                    {d.icd10 && (
                      <span className="text-[10px] text-dental-text-secondary font-mono">
                        {d.icd10}
                      </span>
                    )}
                  </div>
                  {d.keyFeatures?.length > 0 && (
                    <p className="text-[10px] text-dental-text-secondary mt-1">
                      {d.keyFeatures.join(" · ")}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Investigations */}
      {pathway.investigations?.length > 0 && (
        <div className="bg-white border border-dental-border rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="step-circle-blue">3</div>
            <div>
              <h3 className="text-sm font-semibold text-dental-text">
                Investigations
              </h3>
              <p className="text-xs text-dental-text-secondary">
                Pathway Builder
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {pathway.investigations.map((inv, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 mt-0.5 ${
                    inv.priority === "Essential"
                      ? "bg-dental-blue text-white"
                      : inv.priority === "Recommended"
                        ? "bg-dental-blue-light text-dental-blue"
                        : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {inv.priority}
                </span>
                <div>
                  <p className="text-xs font-medium text-dental-text">
                    {inv.name}
                  </p>
                  <p className="text-[10px] text-dental-text-secondary">
                    {inv.rationale}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 4: Management */}
      {pathway.management?.length > 0 && (
        <div className="bg-white border border-dental-border rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="step-circle-green">4</div>
            <div>
              <h3 className="text-sm font-semibold text-dental-text">
                Management Protocol
              </h3>
              <p className="text-xs text-dental-text-secondary">
                Pathway Builder
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {["Immediate", "Short-term", "Long-term"].map((phase) => {
              const items = pathway.management.filter((m) => m.phase === phase);
              if (!items.length) return null;
              return (
                <div key={phase}>
                  <p
                    className={`text-[10px] font-bold uppercase tracking-wide mb-1.5 ${
                      phase === "Immediate"
                        ? "text-red-500"
                        : phase === "Short-term"
                          ? "text-amber-600"
                          : "text-green-600"
                    }`}
                  >
                    {phase}
                  </p>
                  <div className="space-y-1.5 pl-2 border-l-2 border-dental-border">
                    {items.map((m, j) => (
                      <div key={j}>
                        <p className="text-xs font-medium text-dental-text">
                          {m.action}
                        </p>
                        {m.detail && (
                          <p className="text-[10px] text-dental-text-secondary">
                            {m.detail}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Evidence Row */}
      {pathway.evidence?.length > 0 && (
        <div className="bg-white border border-dental-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={14} className="text-dental-blue" />
            <h3 className="text-sm font-semibold text-dental-text">
              Evidence Sources
            </h3>
          </div>
          <div className="space-y-2">
            {pathway.evidence.map((src, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <span className="text-dental-blue font-bold shrink-0">
                  [{i + 1}]
                </span>
                <div>
                  <p className="font-medium text-dental-text">{src.title}</p>
                  <p className="text-dental-text-secondary">
                    {src.journal} · {src.year} · {src.level}
                  </p>
                  <p className="text-dental-text-secondary italic mt-0.5">
                    {src.relevance}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      {pathway.disclaimer && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg p-3">
          <Info size={13} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-[10px] text-amber-700">{pathway.disclaimer}</p>
        </div>
      )}

      {/* Doctor Action */}
      <div className="bg-white border border-dental-border rounded-xl p-4">
        <p className="text-xs font-medium text-dental-text mb-2">
          Your action (logged to audit trail):
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => onAction("accepted")}
            className="btn-primary text-xs py-1.5 flex-1"
          >
            <CheckCircle size={13} /> Accepted pathway
          </button>
          <button
            onClick={() => onAction("modified")}
            className="btn-secondary text-xs py-1.5 flex-1"
          >
            <FileText size={13} /> Modified
          </button>
          <button
            onClick={() => onAction("rejected")}
            className="bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors flex items-center gap-1.5 flex-1 justify-center"
          >
            <X size={13} /> Rejected
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Right Panel ────────────────────────────────────────────────────────────────
function RightPanel({ pathway, cases, onQuickAction }) {
  return (
    <div className="w-64 shrink-0 overflow-y-auto p-3 space-y-3 border-l border-dental-border bg-dental-surface">
      {/* Evidence Sources */}
      {pathway?.evidence?.length > 0 && (
        <div className="card p-3">
          <h3 className="text-xs font-semibold text-dental-text mb-2 flex items-center gap-1.5">
            <BookOpen size={12} className="text-dental-blue" /> Evidence Sources
          </h3>
          <div className="space-y-2">
            {pathway.evidence.slice(0, 3).map((src, i) => (
              <div
                key={i}
                className="border-b border-dental-border last:border-0 pb-2 last:pb-0"
              >
                <p className="text-[10px] font-medium text-dental-text leading-snug">
                  {src.title?.slice(0, 60)}...
                </p>
                <p className="text-[10px] text-dental-text-secondary mt-0.5">
                  {src.journal} · {src.year}
                </p>
                <span
                  className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                    src.level?.includes("Systematic")
                      ? "bg-green-100 text-green-700"
                      : src.level?.includes("RCT")
                        ? "bg-blue-100 text-dental-blue"
                        : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {src.level}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Cases */}
      <div className="card p-3">
        <h3 className="text-xs font-semibold text-dental-text mb-2 flex items-center gap-1.5">
          <Users size={12} className="text-dental-blue" /> Recent Cases
        </h3>
        <div className="space-y-2">
          {cases.map((c) => (
            <div key={c.id} className="flex items-start gap-2">
              <div
                className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                  c.severity === "EMERGENCY"
                    ? "bg-red-500"
                    : c.severity === "URGENT"
                      ? "bg-amber-500"
                      : "bg-green-500"
                }`}
              />
              <div className="min-w-0">
                <p className="text-[10px] font-medium text-dental-text truncate">
                  {c.patientName}
                </p>
                <p className="text-[10px] text-dental-text-secondary truncate">
                  {c.chiefComplaint?.slice(0, 35)}...
                </p>
                <p className="text-[9px] text-dental-text-secondary">
                  {new Date(c.timestamp).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card p-3">
        <h3 className="text-xs font-semibold text-dental-text mb-2">
          Quick Actions
        </h3>
        <div className="space-y-1.5">
          {[
            {
              label: "Generate referral letter",
              icon: FileText,
              action: "referral",
            },
            {
              label: "Export to patient record",
              icon: Download,
              action: "export",
            },
            { label: "Add procedure note", icon: Plus, action: "note" },
            {
              label: "Flag for peer review",
              icon: Flag,
              action: "peer-review",
            },
          ].map(({ label, icon, action }) => {
            const QuickActionIcon = icon;
            return (
            <button
              key={action}
              onClick={() => onQuickAction(action)}
              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[11px] text-dental-text-secondary hover:bg-dental-surface hover:text-dental-blue transition-colors text-left"
            >
              <QuickActionIcon size={12} className="shrink-0" />
              {label}
            </button>
            );
          })}
        </div>
      </div>

      {/* Referral Notice */}
      {pathway?.referral?.required && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <p className="text-xs font-semibold text-amber-800">
            Referral Recommended
          </p>
          <p className="text-[10px] text-amber-700 mt-1">
            <strong>Specialty:</strong> {pathway.referral.specialty}
            <br />
            <strong>Urgency:</strong> {pathway.referral.urgency}
          </p>
        </div>
      )}
    </div>
  );
}

// ── New Case Form ──────────────────────────────────────────────────────────────
function NewCaseForm({ onSubmit, loading }) {
  const [form, setForm] = useState({
    patientName: "",
    age: "",
    sex: "Male",
    chiefComplaint: "",
    medicalHistory: "",
    clinicalFindings: "",
  });
  const [validationError, setValidationError] = useState("");

  const handleChange = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = () => {
    const chiefComplaint = form.chiefComplaint.trim();
    const clinicalFindings = form.clinicalFindings.trim();

    if (!chiefComplaint) {
      setValidationError("Chief complaint is required.");
      return;
    }

    if (!clinicalFindings) {
      setValidationError("Clinical findings are required for a valid pathway.");
      return;
    }

    setValidationError("");
    onSubmit({ ...form, chiefComplaint, clinicalFindings });
  };

  return (
    <div className="bg-white border border-dental-border rounded-xl p-5 max-w-xl">
      <h3 className="text-sm font-semibold text-dental-text mb-4 flex items-center gap-2">
        <Stethoscope size={16} className="text-dental-blue" />
        New Clinical Query
      </h3>
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="text-xs font-medium text-dental-text-secondary block mb-1">
              Patient Name
            </label>
            <input
              className="input-field"
              placeholder="Patient name"
              value={form.patientName}
              onChange={(e) => handleChange("patientName", e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-dental-text-secondary block mb-1">
              Age
            </label>
            <input
              className="input-field"
              type="number"
              placeholder="Age"
              value={form.age}
              onChange={(e) => handleChange("age", e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-dental-text-secondary block mb-1">
            Sex
          </label>
          <select
            className="input-field"
            value={form.sex}
            onChange={(e) => handleChange("sex", e.target.value)}
          >
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-dental-text-secondary block mb-1">
            Chief Complaint *
          </label>
          <textarea
            className="input-field resize-none"
            rows={2}
            placeholder="Describe the patient's main complaint..."
            value={form.chiefComplaint}
            onChange={(e) => handleChange("chiefComplaint", e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-dental-text-secondary block mb-1">
            Medical History
          </label>
          <input
            className="input-field"
            placeholder="Diabetes, hypertension, medications..."
            value={form.medicalHistory}
            onChange={(e) => handleChange("medicalHistory", e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-dental-text-secondary block mb-1">
            Clinical Findings
          </label>
          <textarea
            className="input-field resize-none"
            rows={2}
            placeholder="Examination findings, vitals, intraoral findings..."
            value={form.clinicalFindings}
            onChange={(e) => handleChange("clinicalFindings", e.target.value)}
          />
        </div>
        {validationError && (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 text-xs rounded-lg px-3 py-2">
            {validationError}
          </div>
        )}
        <button
          onClick={handleSubmit}
          disabled={
            !form.chiefComplaint.trim() ||
            !form.clinicalFindings.trim() ||
            loading
          }
          className="btn-primary w-full justify-center"
        >
          {loading ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Running pipeline...
            </>
          ) : (
            "Generate Clinical Pathway"
          )}
        </button>
      </div>
    </div>
  );
}

// ── Follow-up Chat ─────────────────────────────────────────────────────────────
function FollowUpChat({ messages, onSend, loading }) {
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const CHIPS = [
    "What if patient is diabetic?",
    "What are the referral criteria?",
    "Alternative if allergic to penicillin?",
    "Dose adjustment for elderly?",
    "Any contraindications I should flag?",
  ];

  const handleSend = () => {
    if (!input.trim() || loading) return;
    onSend(input.trim());
    setInput("");
  };

  const toggleVoice = () => {
    if (
      !("webkitSpeechRecognition" in window || "SpeechRecognition" in window)
    ) {
      alert("Voice input not supported in this browser. Try Chrome.");
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = "en-IN";
    rec.onresult = (e) => {
      const transcript = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join("");
      setInput(transcript);
    };
    rec.onend = () => setListening(false);
    rec.start();
    recognitionRef.current = rec;
    setListening(true);
  };

  return (
    <div className="border-t border-dental-border bg-white px-4 py-3">
      {/* Chip Suggestions */}
      <div className="flex gap-2 mb-2 flex-wrap">
        {CHIPS.map((chip) => (
          <button
            key={chip}
            onClick={() => setInput(chip)}
            className="text-[10px] bg-dental-surface border border-dental-border text-dental-text-secondary px-2.5 py-1 rounded-full hover:bg-dental-blue-light hover:text-dental-blue hover:border-dental-blue transition-colors"
          >
            {chip}
          </button>
        ))}
      </div>
      {/* Message History */}
      {messages.length > 0 && (
        <div className="mb-3 space-y-2 max-h-40 overflow-y-auto">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-xl px-3 py-2 text-xs ${
                  m.role === "user"
                    ? "bg-dental-blue text-white"
                    : "bg-dental-surface text-dental-text border border-dental-border"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-dental-surface border border-dental-border rounded-xl px-3 py-2">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            </div>
          )}
        </div>
      )}
      {/* Input Row */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask a follow-up — what if patient is diabetic? or referral criteria?"
          className="input-field flex-1 text-xs"
        />
        <button
          onClick={toggleVoice}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
            listening
              ? "bg-red-100 text-red-600"
              : "bg-dental-surface text-dental-text-secondary hover:bg-dental-blue-light hover:text-dental-blue"
          }`}
        >
          {listening ? <MicOff size={14} /> : <Mic size={14} />}
        </button>
        <button
          onClick={handleSend}
          disabled={!input.trim() || loading}
          className="btn-primary w-8 h-8 p-0 justify-center"
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [currentCase, setCurrentCase] = useState(null);
  const [recentCases, setRecentCases] = useState(MOCK_CASES.slice(0, 4));
  const [pathway, setPathway] = useState(null);
  const [agentStatus, setAgentStatus] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const centerRef = useRef(null);

  useEffect(() => {
    const loadCases = async () => {
      const cases = await listCases();
      if (cases.length > 0) {
        setRecentCases(cases.slice(0, 4));
      }
    };

    loadCases();
  }, []);

  const handleNewCase = async (form) => {
    setLoading(true);
    setError(null);
    setPathway(null);
    setAgentStatus({});
    setChatMessages([]);

    const caseObj = {
      ...form,
      id: `case-${Date.now()}`,
      timestamp: new Date().toISOString(),
      status: "active",
    };
    setCurrentCase(caseObj);

    const onProgress = (agent, status) => {
      setAgentStatus((prev) => ({ ...prev, [agent]: status }));
    };

    try {
      const result = await runClinicalPathway(
        {
          chiefComplaint: form.chiefComplaint,
          patientAge: form.age,
          patientSex: form.sex,
          medicalHistory: form.medicalHistory,
          clinicalFindings: form.clinicalFindings,
        },
        onProgress,
      );
      setPathway(result);

      const savedCase = await createCaseRecord({
        ...form,
        severity: result.severity,
        pathway: result,
        status: "active",
      });

      setCurrentCase(savedCase);
      const latestCases = await listCases();
      if (latestCases.length > 0) {
        setRecentCases(latestCases.slice(0, 4));
      }

      logAuditEntry({
        caseId: savedCase.id,
        input: form,
        output: result,
        severity: result.severity,
      });
      setTimeout(
        () => centerRef.current?.scrollTo({ top: 0, behavior: "smooth" }),
        100,
      );
    } catch (err) {
      if (err.message === "GEMINI_KEY_MISSING") {
        setError(
          "Gemini API key not configured. Add your VITE_GEMINI_API_KEY to the .env file to enable live AI responses.",
        );
      } else {
        setError(`Pipeline error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChatSend = async (message) => {
    setChatMessages((prev) => [...prev, { role: "user", content: message }]);
    setChatLoading(true);
    try {
      const response = await followUpChat(pathway, chatMessages, message);
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: response },
      ]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Error: ${err.message}` },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleAction = async (action) => {
    const nextStatus = action === "accepted" ? "completed" : "review";
    await updateCaseDoctorAction(currentCase?.id, action);
    await updateCaseStatus(currentCase?.id, nextStatus);

    setCurrentCase((prev) =>
      prev ? { ...prev, doctorAction: action, status: nextStatus } : prev,
    );
    setRecentCases((prev) =>
      prev.map((c) =>
        c.id === currentCase?.id
          ? { ...c, doctorAction: action, status: nextStatus }
          : c,
      ),
    );

    logAuditEntry({
      caseId: currentCase?.id,
      doctorAction: action,
      severity: pathway?.severity,
    });
    alert(`Action logged: ${action}. Saved to audit trail.`);
  };

  const handleQuickAction = (action) => {
    const routes = {
      referral: "/referral",
      note: "/cases",
      export: "#",
      "peer-review": "/peer-review",
    };
    if (routes[action] && routes[action] !== "#") {
      window.location.href = routes[action];
    } else {
      alert("Export functionality — PDF generation coming in next build.");
    }
  };

  const hasApiKey =
    import.meta.env.VITE_GEMINI_API_KEY &&
    import.meta.env.VITE_GEMINI_API_KEY !== "your_gemini_api_key_here";

  return (
    <AppLayout>
      <div className="flex flex-1 overflow-hidden">
        {/* Center Panel */}
        <div ref={centerRef} className="flex-1 overflow-y-auto flex flex-col">
          {currentCase && (
            <PatientHeader patient={currentCase} severity={pathway?.severity} />
          )}

          <div className="flex-1 p-4 space-y-4">
            {!hasApiKey && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle
                  size={16}
                  className="text-amber-600 shrink-0 mt-0.5"
                />
                <div>
                  <p className="text-sm font-semibold text-amber-800">
                    Gemini API Key Required
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    Add your free Gemini API key to{" "}
                    <code className="bg-amber-100 px-1 rounded">.env</code> as{" "}
                    <code className="bg-amber-100 px-1 rounded">
                      VITE_GEMINI_API_KEY
                    </code>
                    . Get a free key at{" "}
                    <a
                      href="https://aistudio.google.com"
                      target="_blank"
                      className="underline font-medium"
                      rel="noreferrer"
                    >
                      aistudio.google.com
                    </a>
                  </p>
                </div>
              </div>
            )}

            {/* New Case Form */}
            {!loading && !pathway && (
              <NewCaseForm onSubmit={handleNewCase} loading={loading} />
            )}

            {/* Agent Progress */}
            {loading && Object.keys(agentStatus).length > 0 && (
              <AgentProgress agents={agentStatus} />
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle
                  size={16}
                  className="text-red-600 shrink-0 mt-0.5"
                />
                <div>
                  <p className="text-sm font-semibold text-red-700">
                    Pipeline Error
                  </p>
                  <p className="text-xs text-red-600 mt-1">{error}</p>
                  <button
                    onClick={() => {
                      setError(null);
                      setCurrentCase(null);
                    }}
                    className="text-xs text-red-600 underline mt-2"
                  >
                    Start new case
                  </button>
                </div>
              </div>
            )}

            {/* Pathway Result */}
            {pathway && !loading && (
              <PathwayResult pathway={pathway} onAction={handleAction} />
            )}

            {/* New Case Button after completing */}
            {pathway && (
              <button
                onClick={() => {
                  setPathway(null);
                  setCurrentCase(null);
                  setAgentStatus({});
                  setChatMessages([]);
                }}
                className="btn-secondary w-full justify-center text-xs"
              >
                <Plus size={13} /> Start New Case
              </button>
            )}
          </div>

          {/* Follow-up Chat */}
          {pathway && (
            <FollowUpChat
              pathway={pathway}
              messages={chatMessages}
              onSend={handleChatSend}
              loading={chatLoading}
            />
          )}
        </div>

        {/* Right Panel */}
        <RightPanel
          pathway={pathway}
          cases={recentCases}
          onQuickAction={handleQuickAction}
        />
      </div>
    </AppLayout>
  );
}
