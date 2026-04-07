import { useMemo, useState } from 'react'
import { CheckCircle, Download, FileText, Loader2, Save } from 'lucide-react'
import AppLayout from '../components/AppLayout'
import PageTransition from '../components/PageTransition'
import { useAuth } from '../contexts/AuthContext'
import { saveGeneratedReferral } from '../lib/appData'
import { generateReferralLetter } from '../lib/gemini'

export default function ReferralBuilder() {
  const { profile } = useAuth()
  const today = useMemo(() => new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }), [])

  const [form, setForm] = useState({
    patientName: '',
    patientAge: '',
    patientSex: 'Male',
    referralDate: today,
    toSpecialty: '',
    chiefComplaint: '',
    clinicalFindings: '',
    provisionalDiagnosis: '',
    investigationsDone: '',
    reasonForReferral: '',
    requestedManagement: '',
  })
  const [letter, setLetter] = useState('')
  const [subject, setSubject] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')

  function updateField(key, value) {
    setForm(current => ({ ...current, [key]: value }))
  }

  async function handleGenerate() {
    setLoading(true)
    setStatus('')
    try {
      const result = await generateReferralLetter({
        ...form,
        referringDoctor: profile?.full_name || 'Dr. Priya Sharma',
        referringClinic: profile?.institution || 'Dental.ai Demo Clinic',
        referringQualification: profile?.specialty || 'Dental Practitioner',
      })
      setLetter(result.letter)
      setSubject(result.subject || `Referral to ${form.toSpecialty}`)
      setStatus('Letter generated and ready for review.')
    } catch (error) {
      const fallbackLetter = `Date: ${form.referralDate}

To,
Department of ${form.toSpecialty || 'Specialist Dentistry'}

Re: ${form.patientName || 'Patient'} (${form.patientAge || 'Age not specified'}, ${form.patientSex})

Chief complaint:
${form.chiefComplaint || 'Not specified'}

Clinical findings:
${form.clinicalFindings || 'Pending clinician entry'}

Provisional diagnosis:
${form.provisionalDiagnosis || 'Working diagnosis under review'}

Investigations done:
${form.investigationsDone || 'No investigations attached'}

Reason for referral:
${form.reasonForReferral || 'Specialist opinion requested'}

Requested management:
${form.requestedManagement || 'Please assess and advise'}

Regards,
${profile?.full_name || 'Dr. Priya Sharma'}
${profile?.institution || 'Dental.ai Demo Clinic'}`
      setLetter(fallbackLetter)
      setSubject(`Referral to ${form.toSpecialty || 'Specialist Dentistry'}`)
      setStatus(`Used structured fallback draft because live AI generation failed: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  function handleSave() {
    if (!letter) return
    saveGeneratedReferral({
      ...form,
      letter,
      subject,
      patientName: form.patientName,
      chiefComplaint: form.chiefComplaint,
    })
    setStatus('Referral saved to the local workspace and audit log.')
  }

  function handlePrint() {
    const win = window.open('', '_blank')
    win.document.write(`<pre style="font-family: Georgia, serif; white-space: pre-wrap; padding: 40px;">${letter}</pre>`)
    win.document.close()
    win.print()
  }

  return (
    <AppLayout>
      <PageTransition>
        <div className="min-h-full bg-[#f6f3ec] px-4 py-5 md:px-8">
          <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
            <section className="rounded-[30px] border border-black/6 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Referral workflow</p>
              <h1 className="mt-2 text-2xl font-semibold text-slate-900">Generate polished specialist letters</h1>
              <div className="mt-5 space-y-3">
                {[
                  ['patientName', 'Patient name'],
                  ['patientAge', 'Age'],
                  ['toSpecialty', 'Target specialty'],
                  ['chiefComplaint', 'Chief complaint'],
                  ['clinicalFindings', 'Clinical findings'],
                  ['provisionalDiagnosis', 'Provisional diagnosis'],
                  ['investigationsDone', 'Investigations done'],
                  ['reasonForReferral', 'Reason for referral'],
                  ['requestedManagement', 'Requested management'],
                ].map(([key, label]) => (
                  <div key={key}>
                    <label className="mb-1 block text-xs font-medium text-slate-500">{label}</label>
                    {key === 'chiefComplaint' || key === 'clinicalFindings' || key === 'provisionalDiagnosis' || key === 'investigationsDone' || key === 'reasonForReferral' || key === 'requestedManagement' ? (
                      <textarea value={form[key]} onChange={event => updateField(key, event.target.value)} rows={3} className="w-full rounded-[18px] border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-[#ff7a59]" />
                    ) : (
                      <input value={form[key]} onChange={event => updateField(key, event.target.value)} className="w-full rounded-[18px] border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-[#ff7a59]" />
                    )}
                  </div>
                ))}
                <button onClick={handleGenerate} disabled={loading} className="btn-primary w-full justify-center">
                  {loading ? <><Loader2 size={14} className="animate-spin" /> Generating</> : <><FileText size={14} /> Generate letter</>}
                </button>
              </div>
            </section>

            <section className="rounded-[30px] border border-black/6 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Preview</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">{subject || 'Referral draft preview'}</h2>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleSave} disabled={!letter} className="btn-secondary text-xs"><Save size={13} /> Save</button>
                  <button onClick={handlePrint} disabled={!letter} className="btn-primary text-xs"><Download size={13} /> Print / PDF</button>
                </div>
              </div>

              <div className="mt-6 rounded-[26px] bg-slate-50 p-6">
                {letter ? (
                  <pre className="whitespace-pre-wrap text-sm leading-7 text-slate-800 font-serif">{letter}</pre>
                ) : (
                  <div className="flex min-h-[420px] items-center justify-center text-center text-slate-500">
                    Fill the form and generate the first referral draft.
                  </div>
                )}
              </div>

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
