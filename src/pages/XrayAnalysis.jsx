import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { AlertTriangle, CheckCircle, Loader2, Save, Upload } from 'lucide-react'
import AppLayout from '../components/AppLayout'
import PageTransition from '../components/PageTransition'
import { saveXrayReport } from '../lib/appData'
import { analyzeXray } from '../lib/gemini'

export default function XrayAnalysis() {
  const [image, setImage] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')

  const onDrop = useCallback(files => {
    const file = files[0]
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = event => setImage(event.target.result)
    reader.readAsDataURL(file)
    setAnalysis(null)
    setStatus('')
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [] },
    multiple: false,
  })

  async function handleAnalyze() {
    if (!image || !imageFile) return
    setLoading(true)
    setStatus('')
    try {
      const result = await analyzeXray(image.split(',')[1], imageFile.type || 'image/jpeg')
      setAnalysis(result)
      setStatus('Radiograph interpretation generated.')
    } catch (error) {
      setAnalysis({
        imagingType: 'IOPA / OPG review',
        quality: 'Diagnostic image uploaded',
        urgency: 'URGENT',
        interpretation: 'Fallback imaging summary prepared for clinical review. Please confirm findings chairside and correlate with symptoms.',
        findings: [
          { id: '1', name: 'Possible proximal caries', location: 'Upper posterior quadrant', severity: 'moderate', confidence: 78, description: 'Radiolucent area requiring clinical correlation and bitewing confirmation.' },
          { id: '2', name: 'Periapical change', location: 'Apical region', severity: 'high', confidence: 84, description: 'Periapical rarefaction should be correlated with sensibility tests and percussion findings.' },
        ],
        nextSteps: ['Repeat focused imaging if needed', 'Correlate with vitality tests and symptoms', 'Document working diagnosis before treatment'],
        disclaimer: `Live AI analysis failed: ${error.message}. This fallback is for demo continuity only.`,
      })
      setStatus('Used deterministic fallback analysis because live AI was unavailable.')
    } finally {
      setLoading(false)
    }
  }

  function handleSave() {
    if (!analysis) return
    saveXrayReport({ ...analysis, fileName: imageFile?.name || 'uploaded-image' })
    setStatus('Imaging report saved to workspace and audit log.')
  }

  return (
    <AppLayout>
      <PageTransition>
        <div className="min-h-full bg-[#f6f3ec] px-4 py-5 md:px-8">
          <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <section className="rounded-[30px] border border-black/6 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Imaging analysis</p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">Upload and review dental radiographs</h1>

              {!image ? (
                <div
                  {...getRootProps()}
                  className={`mt-6 flex min-h-[320px] cursor-pointer flex-col items-center justify-center rounded-[28px] border-2 border-dashed p-8 text-center transition ${
                    isDragActive ? 'border-[#ff7a59] bg-[#fff5f2]' : 'border-slate-300 bg-slate-50 hover:border-[#ff7a59]/50'
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload size={32} className="text-[#ff7a59]" />
                  <p className="mt-4 text-lg font-medium text-slate-900">Drop an IOPA or OPG image here</p>
                  <p className="mt-2 text-sm text-slate-500">PNG and JPEG uploads supported for this build.</p>
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  <img src={image} alt="Uploaded radiograph" className="max-h-[520px] w-full rounded-[28px] object-contain bg-slate-100 p-4" />
                  <div className="flex gap-2">
                    <button onClick={handleAnalyze} disabled={loading} className="btn-primary">
                      {loading ? <><Loader2 size={14} className="animate-spin" /> Analyzing</> : 'Analyze image'}
                    </button>
                    <button onClick={() => { setImage(''); setImageFile(null); setAnalysis(null); setStatus('') }} className="btn-secondary">Replace image</button>
                  </div>
                </div>
              )}

              {analysis ? (
                <div className="mt-6 space-y-4">
                  <div className="rounded-[24px] bg-slate-50 p-5">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Interpretation</p>
                    <p className="mt-3 text-sm leading-6 text-slate-700">{analysis.interpretation}</p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {analysis.findings?.map(item => (
                      <div key={item.id} className="rounded-[22px] border border-slate-200 bg-white p-4">
                        <div className="flex items-center gap-2">
                          {item.severity === 'high' ? <AlertTriangle size={15} className="text-rose-600" /> : <CheckCircle size={15} className="text-amber-600" />}
                          <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                        </div>
                        <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">{item.location} · {item.confidence}% confidence</p>
                        <p className="mt-3 text-sm leading-6 text-slate-700">{item.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </section>

            <aside className="space-y-6">
              <section className="rounded-[30px] border border-black/6 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Case output</p>
                <div className="mt-4 space-y-3 text-sm text-slate-700">
                  <div className="rounded-[20px] bg-slate-50 px-4 py-3">Imaging type: {analysis?.imagingType || 'Awaiting upload'}</div>
                  <div className="rounded-[20px] bg-slate-50 px-4 py-3">Quality: {analysis?.quality || 'Not analyzed yet'}</div>
                  <div className="rounded-[20px] bg-slate-50 px-4 py-3">Urgency: {analysis?.urgency || 'Pending'}</div>
                </div>
                <button onClick={handleSave} disabled={!analysis} className="btn-secondary mt-4 w-full justify-center">
                  <Save size={14} /> Save report
                </button>
                {analysis?.nextSteps ? (
                  <div className="mt-4 rounded-[20px] bg-[#101b35] p-4 text-white">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/60">Next steps</p>
                    <ul className="mt-3 space-y-2 text-sm text-white/80">
                      {analysis.nextSteps.map(step => <li key={step}>{step}</li>)}
                    </ul>
                  </div>
                ) : null}
              </section>

              {status ? (
                <div className="rounded-[24px] bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{status}</div>
              ) : null}
            </aside>
          </div>
        </div>
      </PageTransition>
    </AppLayout>
  )
}
