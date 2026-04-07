import { useState } from 'react'
import { CheckCircle, ClipboardList, Loader2, Save } from 'lucide-react'
import AppLayout from '../components/AppLayout'
import PageTransition from '../components/PageTransition'
import { saveTreatmentPlan } from '../lib/appData'
import { buildTreatmentPlan } from '../lib/gemini'

export default function TreatmentPlan() {
  const [form, setForm] = useState({
    patientName: '',
    age: '',
    urgency: 'Routine',
    chiefComplaint: '',
    diagnoses: '',
    medicalHistory: '',
  })
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')

  function updateField(key, value) {
    setForm(current => ({ ...current, [key]: value }))
  }

  async function handleBuild() {
    setLoading(true)
    setStatus('')
    try {
      const result = await buildTreatmentPlan(form)
      setPlan(result)
      setStatus('Treatment plan generated.')
    } catch (error) {
      setPlan({
        phases: [
          { phase: 1, name: 'Stabilization', visits: 1, rationale: 'Control pain and active disease burden.', procedures: [{ procedure: 'Emergency pain relief and diagnostics', priority: 'Critical', detail: form.chiefComplaint }] },
          { phase: 2, name: 'Disease control', visits: 2, rationale: 'Treat underlying pathology before definitive work.', procedures: [{ procedure: 'Address primary diagnosis', priority: 'High', detail: form.diagnoses }] },
          { phase: 3, name: 'Definitive restoration', visits: 2, rationale: 'Restore function and aesthetics after disease control.', procedures: [{ procedure: 'Definitive restorative planning', priority: 'Routine', detail: 'Sequence according to risk, occlusion, and patient preference.' }] },
        ],
        maintenanceProtocol: 'Review at 1 week, 6 weeks, and 3 months. Reinforce oral hygiene and compliance with recall schedule.',
      })
      setStatus(`Used deterministic fallback plan because live generation failed: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  function handleSave() {
    if (!plan) return
    saveTreatmentPlan({ ...form, ...plan, patientName: form.patientName, chiefComplaint: form.chiefComplaint })
    setStatus('Treatment plan saved to workspace and audit log.')
  }

  return (
    <AppLayout>
      <PageTransition>
        <div className="min-h-full bg-[#f6f3ec] px-4 py-5 md:px-8">
          <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
            <section className="rounded-[30px] border border-black/6 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Treatment planning</p>
              <h1 className="mt-2 text-2xl font-semibold text-slate-900">Sequence care with clinical rationale</h1>
              <div className="mt-5 space-y-3">
                {[
                  ['patientName', 'Patient name'],
                  ['age', 'Age'],
                  ['chiefComplaint', 'Chief complaint'],
                  ['diagnoses', 'Diagnoses'],
                  ['medicalHistory', 'Medical history'],
                ].map(([key, label]) => (
                  <div key={key}>
                    <label className="mb-1 block text-xs font-medium text-slate-500">{label}</label>
                    {key === 'chiefComplaint' || key === 'diagnoses' || key === 'medicalHistory' ? (
                      <textarea value={form[key]} onChange={event => updateField(key, event.target.value)} rows={3} className="w-full rounded-[18px] border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-[#ff7a59]" />
                    ) : (
                      <input value={form[key]} onChange={event => updateField(key, event.target.value)} className="w-full rounded-[18px] border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-[#ff7a59]" />
                    )}
                  </div>
                ))}
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Urgency</label>
                  <select value={form.urgency} onChange={event => updateField('urgency', event.target.value)} className="w-full rounded-[18px] border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-[#ff7a59]">
                    <option>Emergency</option>
                    <option>Urgent</option>
                    <option>Routine</option>
                  </select>
                </div>
                <button onClick={handleBuild} disabled={loading} className="btn-primary w-full justify-center">
                  {loading ? <><Loader2 size={14} className="animate-spin" /> Building</> : <><ClipboardList size={14} /> Build plan</>}
                </button>
              </div>
            </section>

            <section className="rounded-[30px] border border-black/6 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Plan output</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">Phased treatment roadmap</h2>
                </div>
                <button onClick={handleSave} disabled={!plan} className="btn-secondary text-xs"><Save size={13} /> Save plan</button>
              </div>

              {plan ? (
                <div className="mt-6 space-y-4">
                  {plan.phases?.map(phase => (
                    <div key={phase.phase} className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Phase {phase.phase}</p>
                          <h3 className="mt-1 text-xl font-semibold text-slate-900">{phase.name}</h3>
                        </div>
                        <span className="rounded-full bg-[#101b35] px-3 py-1 text-xs font-medium text-white">{phase.visits} visit{phase.visits !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="mt-4 space-y-3">
                        {phase.procedures?.map((item, index) => (
                          <div key={index} className="rounded-[18px] bg-white px-4 py-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-medium text-slate-900">{item.procedure}</p>
                              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-amber-700">{item.priority}</span>
                            </div>
                            <p className="mt-2 text-sm text-slate-600">{item.detail}</p>
                          </div>
                        ))}
                      </div>
                      <p className="mt-4 text-sm leading-6 text-slate-600">{phase.rationale}</p>
                    </div>
                  ))}

                  {plan.maintenanceProtocol ? (
                    <div className="rounded-[24px] bg-[#101b35] p-5 text-white">
                      <p className="text-xs uppercase tracking-[0.2em] text-white/60">Maintenance protocol</p>
                      <p className="mt-3 text-sm leading-6 text-white/80">{plan.maintenanceProtocol}</p>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="mt-6 flex min-h-[420px] items-center justify-center rounded-[26px] bg-slate-50 text-center text-slate-500">
                  Build a plan to see phased sequencing, rationale, and chairside notes.
                </div>
              )}

              {status ? (
                <div className="mt-4 flex items-start gap-2 rounded-[20px] bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  <CheckCircle size={16} className="mt-0.5" /> {status}
                </div>
              ) : null}
            </section>
          </div>
        </div>
      </PageTransition>
    </AppLayout>
  )
}
