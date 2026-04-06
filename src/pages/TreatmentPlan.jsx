import { useState } from 'react'
import AppLayout from '../components/AppLayout'
import { buildTreatmentPlan } from '../lib/gemini'
import { Loader2, ChevronRight, User, AlertTriangle, CheckCircle, ClipboardList } from 'lucide-react'

export default function TreatmentPlan() {
  const [form, setForm] = useState({
    chiefComplaint: '',
    diagnoses: '',
    medicalHistory: '',
    age: '',
    urgency: 'Routine',
    patientName: '',
  })
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showPatientVersion, setShowPatientVersion] = useState(false)
  const PHASE_COLORS = ['border-red-400', 'border-amber-400', 'border-blue-400', 'border-green-400', 'border-purple-400']
  const PHASE_ICONS = ['🚨', '🦷', '🔧', '✅', '🔄']

  const handleBuild = async () => {
    setLoading(true)
    setError(null)
    setPlan(null)
    try {
      const result = await buildTreatmentPlan(form)
      setPlan(result)
    } catch (err) {
      setError(err.message === 'GEMINI_KEY_MISSING' ? 'Gemini API key required.' : `Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppLayout>
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="bg-white border-b border-dental-border px-5 py-3">
          <h1 className="text-sm font-bold text-dental-text">Treatment Plan Builder</h1>
          <p className="text-xs text-dental-text-secondary">AI-generated phased treatment plan with correct sequencing logic</p>
        </div>

        <div className="flex-1 overflow-hidden flex">
          {/* Input Form */}
          <div className="w-72 border-r border-dental-border overflow-y-auto p-4 space-y-3 bg-white">
            <h3 className="text-xs font-semibold text-dental-text uppercase tracking-wide">Patient Information</h3>
            
            {[
              { key: 'patientName', label: 'Patient Name', type: 'input', placeholder: 'Name' },
              { key: 'age', label: 'Age', type: 'input', placeholder: 'Age', inputType: 'number' },
            ].map(({ key, label, placeholder, inputType }) => (
              <div key={key}>
                <label className="text-[10px] font-medium text-dental-text-secondary block mb-1">{label}</label>
                <input type={inputType || 'text'} className="input-field text-xs" placeholder={placeholder}
                  value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
              </div>
            ))}

            <div>
              <label className="text-[10px] font-medium text-dental-text-secondary block mb-1">Urgency</label>
              <select className="input-field text-xs" value={form.urgency} onChange={e => setForm(f => ({ ...f, urgency: e.target.value }))}>
                <option>Emergency</option><option>Urgent</option><option>Routine</option>
              </select>
            </div>

            {[
              { key: 'chiefComplaint', label: 'Chief Complaint *', rows: 2, placeholder: 'Main complaint' },
              { key: 'diagnoses', label: 'Confirmed Diagnoses *', rows: 3, placeholder: 'e.g., Chronic periodontitis stage III, Caries tooth 26, Missing teeth 36, 46' },
              { key: 'medicalHistory', label: 'Medical History & Flags', rows: 2, placeholder: 'Diabetes, hypertension, medications...' },
            ].map(({ key, label, rows, placeholder }) => (
              <div key={key}>
                <label className="text-[10px] font-medium text-dental-text-secondary block mb-1">{label}</label>
                <textarea className="input-field text-xs resize-none" rows={rows} placeholder={placeholder}
                  value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
              </div>
            ))}

            <button onClick={handleBuild} disabled={loading || !form.chiefComplaint || !form.diagnoses} className="btn-primary w-full justify-center">
              {loading ? <><Loader2 size={14} className="animate-spin" /> Building plan...</> : <><ClipboardList size={14} /> Build Treatment Plan</>}
            </button>
            {error && <p className="text-xs text-red-600">{error}</p>}
          </div>

          {/* Plan Output */}
          <div className="flex-1 overflow-y-auto p-5">
            {!plan && !loading && (
              <div className="flex items-center justify-center h-full text-dental-text-secondary">
                <div className="text-center">
                  <ClipboardList size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Fill the form to generate a phased treatment plan</p>
                  <p className="text-xs mt-1">Phase 1: Emergency → Phase 2: Perio → Phase 3: Restorative → Phase 4: Maintenance</p>
                </div>
              </div>
            )}
            {loading && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Loader2 size={32} className="animate-spin text-dental-blue mx-auto mb-3" />
                  <p className="text-sm text-dental-text-secondary">Building your treatment plan...</p>
                </div>
              </div>
            )}
            {plan && (
              <div className="max-w-2xl mx-auto space-y-4 animate-slide-in">
                {/* Toggle */}
                <div className="flex items-center gap-3">
                  <h2 className="text-sm font-bold text-dental-text flex-1">
                    {form.patientName ? `Treatment Plan — ${form.patientName}` : 'Treatment Plan'}
                  </h2>
                  <span className="text-xs text-dental-text-secondary">
                    Estimated {plan.totalVisitsEstimate} visits total
                  </span>
                  <button
                    onClick={() => setShowPatientVersion(v => !v)}
                    className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${showPatientVersion ? 'bg-dental-blue text-white border-dental-blue' : 'border-dental-border text-dental-text-secondary'}`}
                  >
                    {showPatientVersion ? 'Clinical View' : 'Patient View'}
                  </button>
                </div>

                {showPatientVersion ? (
                  <div className="card p-5">
                    <h3 className="text-xs font-semibold text-dental-text mb-3 flex items-center gap-2">
                      <User size={14} className="text-dental-blue" /> Patient-Friendly Explanation
                    </h3>
                    <p className="text-xs text-dental-text leading-relaxed whitespace-pre-wrap">
                      {plan.patientFriendlyPlan}
                    </p>
                  </div>
                ) : (
                  <>
                    {plan.phases?.map((phase, i) => (
                      <div key={i} className={`card p-4 border-l-4 ${PHASE_COLORS[i % PHASE_COLORS.length]}`}>
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-xl">{PHASE_ICONS[i % PHASE_ICONS.length]}</span>
                          <div>
                            <h3 className="text-sm font-bold text-dental-text">Phase {phase.phase}: {phase.name}</h3>
                            <p className="text-[10px] text-dental-text-secondary">{phase.visits} visit{phase.visits !== 1 ? 's' : ''} estimated</p>
                          </div>
                        </div>
                        <div className="space-y-2 mb-3">
                          {phase.procedures?.map((proc, j) => (
                            <div key={j} className="flex items-start gap-2">
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5 ${
                                proc.priority === 'Critical' ? 'bg-red-100 text-red-700' :
                                proc.priority === 'High' ? 'bg-amber-100 text-amber-700' :
                                'bg-gray-100 text-gray-600'
                              }`}>{proc.priority}</span>
                              <div>
                                <p className="text-xs font-medium text-dental-text">{proc.procedure}</p>
                                {proc.detail && <p className="text-[10px] text-dental-text-secondary">{proc.detail}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="bg-dental-surface rounded-lg p-2.5">
                          <p className="text-[10px] text-dental-text-secondary italic">{phase.rationale}</p>
                        </div>
                      </div>
                    ))}

                    {plan.maintenanceProtocol && (
                      <div className="card p-4 border-l-4 border-dental-blue">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle size={14} className="text-dental-blue" />
                          <h3 className="text-xs font-semibold text-dental-text">Maintenance Protocol</h3>
                        </div>
                        <p className="text-xs text-dental-text">{plan.maintenanceProtocol}</p>
                      </div>
                    )}
                  </>
                )}

                {/* Cost Template */}
                <div className="card p-4">
                  <h3 className="text-xs font-semibold text-dental-text mb-3">Cost Estimate Template</h3>
                  <div className="space-y-2">
                    {plan.phases?.map((phase, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-xs text-dental-text flex-1">Phase {phase.phase}: {phase.name}</span>
                        <input
                          type="text"
                          placeholder="₹ —"
                          className="w-24 border border-dental-border rounded-lg px-2 py-1 text-xs text-right focus:outline-none focus:ring-1 focus:ring-dental-blue"
                        />
                      </div>
                    ))}
                    <div className="flex items-center gap-3 pt-2 border-t border-dental-border">
                      <span className="text-xs font-bold text-dental-text flex-1">Total Estimate</span>
                      <input
                        type="text"
                        placeholder="₹ —"
                        className="w-24 border border-dental-blue rounded-lg px-2 py-1 text-xs text-right font-bold focus:outline-none focus:ring-1 focus:ring-dental-blue"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
