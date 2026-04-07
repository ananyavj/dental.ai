import { useState, useEffect } from 'react'
import AppLayout from '../components/AppLayout'
import { generateReferralLetter } from '../lib/gemini'
import { fetchUserProfile } from '../lib/data'
import { useAuth } from '../App'
import { FileText, Download, Loader2, Edit2, CheckCircle, AlertTriangle } from 'lucide-react'

export default function ReferralBuilder() {
  const { user } = useAuth()
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
  
  const [form, setForm] = useState({
    patientName: '',
    patientAge: '',
    patientSex: 'Male',
    referralDate: today,
    referringDoctor: '',
    referringClinic: 'Dental.ai Verified Clinic',
    referringQualification: '',
    referringRegNumber: '',
    toSpecialty: '',
    chiefComplaint: '',
    clinicalFindings: '',
    provisionalDiagnosis: '',
    investigationsDone: '',
    reasonForReferral: '',
    requestedManagement: '',
  })

  useEffect(() => {
    if (user) {
      fetchUserProfile(user.id).then(profile => {
        if (profile) {
          setForm(f => ({
            ...f,
            referringDoctor: profile.name || '',
            referringRegNumber: profile.registration_number || '',
            referringQualification: profile.specialty || '', // Using specialty as qualification for now
          }))
        }
      })
    }
  }, [user])

  const [letter, setLetter] = useState(null)
  const [editedLetter, setEditedLetter] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(false)

  const handleChange = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    setLetter(null)
    try {
      const result = await generateReferralLetter(form)
      setLetter(result)
      setEditedLetter(result.letter)
    } catch (err) {
      setError(err.message === 'GEMINI_KEY_MISSING'
        ? 'Gemini API key required.'
        : `Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    const win = window.open('', '_blank')
    win.document.write(`
      <html><head>
        <title>Referral Letter — ${form.patientName}</title>
        <style>
          body { font-family: 'Times New Roman', serif; padding: 60px; line-height: 1.8; color: #111; font-size: 14px; }
          pre { font-family: inherit; white-space: pre-wrap; }
        </style>
      </head><body>
        <pre>${editedLetter || letter?.letter}</pre>
        <script>window.onload=()=>window.print()</script>
      </body></html>
    `)
    win.document.close()
  }

  const SPECIALTIES = [
    'Endodontics', 'Periodontics', 'Oral Surgery', 'Orthodontics',
    'Prosthodontics', 'Paediatric Dentistry', 'Oral Medicine',
    'Implantology', 'Maxillofacial Surgery', 'Hospital A&E'
  ]

  return (
    <AppLayout>
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="bg-white border-b border-dental-border px-5 py-3">
          <h1 className="text-sm font-bold text-dental-text">Referral Letter Generator</h1>
          <p className="text-xs text-dental-text-secondary">Auto-populate and generate a formal referral letter in seconds</p>
        </div>

        <div className="flex-1 overflow-hidden flex">
          {/* Form */}
          <div className="w-80 border-r border-dental-border overflow-y-auto p-4 space-y-4 bg-white">
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-dental-text uppercase tracking-wide">Patient Details</h3>
              <input className="input-field text-xs" placeholder="Patient Name" value={form.patientName} onChange={e => handleChange('patientName', e.target.value)} />
              <div className="grid grid-cols-2 gap-2">
                <input className="input-field text-xs" type="number" placeholder="Age" value={form.patientAge} onChange={e => handleChange('patientAge', e.target.value)} />
                <select className="input-field text-xs" value={form.patientSex} onChange={e => handleChange('patientSex', e.target.value)}>
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-dental-text uppercase tracking-wide">Refer To</h3>
              <select className="input-field text-xs" value={form.toSpecialty} onChange={e => handleChange('toSpecialty', e.target.value)}>
                <option value="">Select specialty...</option>
                {SPECIALTIES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-dental-text uppercase tracking-wide">Clinical Details</h3>
              {[
                { key: 'chiefComplaint', label: 'Chief Complaint', rows: 2 },
                { key: 'clinicalFindings', label: 'Clinical Findings', rows: 3 },
                { key: 'provisionalDiagnosis', label: 'Provisional Diagnosis', rows: 2 },
                { key: 'investigationsDone', label: 'Investigations Done & Results', rows: 2 },
                { key: 'reasonForReferral', label: 'Reason for Referral', rows: 2 },
                { key: 'requestedManagement', label: 'Requested Management', rows: 2 },
              ].map(({ key, label, rows }) => (
                <div key={key}>
                  <label className="text-[10px] font-medium text-dental-text-secondary block mb-1">{label}</label>
                  <textarea
                    className="input-field text-xs resize-none"
                    rows={rows}
                    placeholder={label}
                    value={form[key]}
                    onChange={e => handleChange(key, e.target.value)}
                  />
                </div>
              ))}
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading || !form.patientName || !form.chiefComplaint || !form.toSpecialty}
              className="btn-primary w-full justify-center"
            >
              {loading ? <><Loader2 size={14} className="animate-spin" /> Generating...</> : <><FileText size={14} /> Generate Letter</>}
            </button>

            {error && <p className="text-xs text-red-600">{error}</p>}
          </div>

          {/* Letter Preview */}
          <div className="flex-1 overflow-y-auto p-5">
            {!letter && !loading && (
              <div className="flex items-center justify-center h-full text-dental-text-secondary">
                <div className="text-center">
                  <FileText size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Fill the form and generate your referral letter</p>
                  <p className="text-xs mt-1">Auto-populated from active case data · Standard Indian hospital format</p>
                </div>
              </div>
            )}

            {loading && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Loader2 size={32} className="animate-spin text-dental-blue mx-auto mb-3" />
                  <p className="text-sm text-dental-text-secondary">Generating referral letter...</p>
                </div>
              </div>
            )}

            {letter && (
              <div className="max-w-2xl mx-auto space-y-3 animate-fade-in">
                {/* Actions */}
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-dental-text flex-1">Referral Letter Preview</h3>
                  <button onClick={() => setEditing(!editing)} className="btn-ghost text-xs py-1.5">
                    <Edit2 size={12} /> {editing ? 'Preview' : 'Edit'}
                  </button>
                  <button onClick={handlePrint} className="btn-primary text-xs py-1.5">
                    <Download size={12} /> Print / Save PDF
                  </button>
                </div>

                {letter.subject && (
                  <div className="bg-dental-blue-light border border-dental-blue rounded-lg px-3 py-2">
                    <p className="text-xs font-semibold text-dental-blue">{letter.subject}</p>
                  </div>
                )}

                {editing ? (
                  <textarea
                    value={editedLetter}
                    onChange={e => setEditedLetter(e.target.value)}
                    className="w-full border border-dental-border rounded-xl p-4 text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-dental-blue"
                    rows={30}
                  />
                ) : (
                  <div className="card p-6">
                    <pre className="text-xs leading-relaxed whitespace-pre-wrap font-serif text-dental-text">
                      {editedLetter || letter.letter}
                    </pre>
                  </div>
                )}

                <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2">
                  <CheckCircle size={14} className="text-green-600" />
                  <p className="text-xs text-green-700">Letter generated. Review before printing or sending.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
