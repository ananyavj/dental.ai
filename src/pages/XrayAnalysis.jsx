import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import AppLayout from '../components/AppLayout'
import { analyzeXray } from '../lib/gemini'
import {
  Upload, ZoomIn, ZoomOut, Sun, Contrast, Ruler, AlertTriangle,
  CheckCircle, AlertCircle, Loader2, X, Info, ChevronRight
} from 'lucide-react'

function ConfidenceBar({ value, severity }) {
  const color = severity === 'high' ? 'bg-red-500' : severity === 'moderate' ? 'bg-amber-500' : 'bg-green-500'
  return (
    <div className="confidence-bar mt-1">
      <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${value}%` }} />
    </div>
  )
}

export default function XrayAnalysis() {
  const [image, setImage] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [zoom, setZoom] = useState(100)
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)
  const [selectedFinding, setSelectedFinding] = useState(null)

  const onDrop = useCallback(accepted => {
    const file = accepted[0]
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = e => setImage(e.target.result)
    reader.readAsDataURL(file)
    setAnalysis(null)
    setError(null)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/dcm': [] },
    multiple: false,
  })

  const handleAnalyze = async () => {
    if (!image || !imageFile) return
    setLoading(true)
    setError(null)
    try {
      const base64 = image.split(',')[1]
      const mimeType = imageFile.type || 'image/jpeg'
      const result = await analyzeXray(base64, mimeType)
      setAnalysis(result)
    } catch (err) {
      if (err.message === 'GEMINI_KEY_MISSING') {
        setError('Gemini API key required for X-ray analysis.')
      } else {
        setError(`Analysis error: ${err.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const severityColor = sev =>
    sev === 'high' ? 'border-red-300 bg-red-50' :
    sev === 'moderate' ? 'border-amber-300 bg-amber-50' :
    'border-green-300 bg-green-50'

  const severityIcon = sev =>
    sev === 'high' ? <AlertTriangle size={13} className="text-red-600" /> :
    sev === 'moderate' ? <AlertCircle size={13} className="text-amber-600" /> :
    <CheckCircle size={13} className="text-green-600" />

  return (
    <AppLayout>
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-dental-border px-5 py-3">
          <h1 className="text-sm font-bold text-dental-text">X-ray / Imaging Analysis</h1>
          <p className="text-xs text-dental-text-secondary">Upload IOPA, OPG or CBCT — AI analysis with annotated findings</p>
        </div>

        <div className="flex-1 overflow-hidden flex">
          {/* Left: Upload + Viewer + Controls */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Upload Zone */}
            {!image ? (
              <div
                {...getRootProps()}
                className={`
                  border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors
                  ${isDragActive ? 'border-dental-blue bg-dental-blue-light' : 'border-dental-border hover:border-dental-blue hover:bg-dental-blue-light'}
                `}
              >
                <input {...getInputProps()} />
                <Upload size={32} className={`mx-auto mb-3 ${isDragActive ? 'text-dental-blue' : 'text-dental-text-secondary'}`} />
                <p className="text-sm font-medium text-dental-text">
                  {isDragActive ? 'Drop X-ray here...' : 'Drag & drop X-ray here'}
                </p>
                <p className="text-xs text-dental-text-secondary mt-1">Supports JPEG, PNG, DICOM · Non-destructive analysis</p>
                <button className="btn-primary mt-4 mx-auto">
                  <Upload size={14} /> Choose file
                </button>
              </div>
            ) : (
              <>
                {/* Image Viewer */}
                <div className="card overflow-hidden">
                  <div className="bg-gray-900 flex items-center justify-center overflow-hidden" style={{ height: '380px' }}>
                    <img
                      src={image}
                      alt="X-ray"
                      style={{
                        transform: `scale(${zoom / 100})`,
                        filter: `brightness(${brightness}%) contrast(${contrast}%)`,
                        transition: 'transform 0.2s',
                        maxHeight: '100%',
                        maxWidth: '100%',
                        objectFit: 'contain',
                      }}
                    />
                  </div>

                  {/* Toolbar */}
                  <div className="bg-gray-800 px-4 py-2 flex items-center gap-4 flex-wrap">
                    {/* Zoom */}
                    <div className="flex items-center gap-2">
                      <button onClick={() => setZoom(z => Math.max(50, z - 10))} className="text-gray-300 hover:text-white"><ZoomOut size={14} /></button>
                      <span className="text-gray-300 text-xs w-10 text-center">{zoom}%</span>
                      <button onClick={() => setZoom(z => Math.min(300, z + 10))} className="text-gray-300 hover:text-white"><ZoomIn size={14} /></button>
                    </div>
                    {/* Brightness */}
                    <div className="flex items-center gap-2">
                      <Sun size={13} className="text-gray-400" />
                      <input type="range" min="50" max="200" value={brightness} onChange={e => setBrightness(+e.target.value)} className="w-20 accent-dental-blue" />
                      <span className="text-gray-400 text-xs">{brightness}%</span>
                    </div>
                    {/* Contrast */}
                    <div className="flex items-center gap-2">
                      <Contrast size={13} className="text-gray-400" />
                      <input type="range" min="50" max="200" value={contrast} onChange={e => setContrast(+e.target.value)} className="w-20 accent-dental-blue" />
                      <span className="text-gray-400 text-xs">{contrast}%</span>
                    </div>
                    <button onClick={() => { setImage(null); setAnalysis(null); setImageFile(null) }} className="ml-auto text-gray-400 hover:text-red-400 flex items-center gap-1 text-xs">
                      <X size={13} /> Remove
                    </button>
                  </div>
                </div>

                {/* Analyze Button */}
                {!analysis && (
                  <button onClick={handleAnalyze} disabled={loading} className="btn-primary w-full justify-center">
                    {loading ? <><Loader2 size={14} className="animate-spin" /> Analysing with Gemini Vision...</> : 'Analyse X-ray with AI'}
                  </button>
                )}

                {/* Error */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-2">
                    <AlertTriangle size={15} className="text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-700">{error}</p>
                  </div>
                )}

                {/* Findings */}
                {analysis && (
                  <div className="space-y-3 animate-slide-in">
                    {/* Overview */}
                    <div className="card p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-semibold text-dental-text">Image Overview</h3>
                        <div className="flex gap-2">
                          <span className="tag-pill">{analysis.imagingType}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            analysis.quality === 'Diagnostic' ? 'bg-green-100 text-green-700' :
                            analysis.quality === 'Suboptimal' ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          }`}>{analysis.quality}</span>
                        </div>
                      </div>
                      <p className={`text-xs font-semibold mb-1 flex items-center gap-1 ${
                        analysis.urgency === 'Immediate' ? 'text-red-600' :
                        analysis.urgency === 'Within 1 week' ? 'text-amber-600' : 'text-green-600'
                      }`}>
                        <AlertTriangle size={12} /> {analysis.urgency} action required
                      </p>
                    </div>

                    {/* Findings List */}
                    <div className="card p-4">
                      <h3 className="text-xs font-semibold text-dental-text mb-3">
                        Radiographic Findings ({analysis.findings?.length || 0})
                      </h3>
                      <div className="space-y-2">
                        {analysis.findings?.map((f, i) => (
                          <div
                            key={i}
                            onClick={() => setSelectedFinding(selectedFinding?.id === f.id ? null : f)}
                            className={`border rounded-xl p-3 cursor-pointer transition-colors ${severityColor(f.severity)} ${
                              selectedFinding?.id === f.id ? 'ring-2 ring-dental-blue' : ''
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              {severityIcon(f.severity)}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className="text-xs font-semibold text-dental-text">{f.name}</p>
                                  <span className="text-xs text-dental-text-secondary">{f.confidence}%</span>
                                </div>
                                <p className="text-[10px] text-dental-text-secondary mt-0.5">{f.location}</p>
                                <ConfidenceBar value={f.confidence} severity={f.severity} />
                                {selectedFinding?.id === f.id && (
                                  <p className="text-[11px] text-dental-text mt-2 border-t border-black/10 pt-2">{f.description}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right Panel: AI Interpretation */}
          {analysis && (
            <div className="w-72 border-l border-dental-border bg-white overflow-y-auto p-4 space-y-4">
              <h3 className="text-xs font-bold text-dental-text uppercase tracking-wide">AI Interpretation</h3>
              <p className="text-xs text-dental-text leading-relaxed whitespace-pre-wrap">{analysis.interpretation}</p>

              <div>
                <h4 className="text-xs font-semibold text-dental-text mb-2">Next Steps</h4>
                <ol className="space-y-1.5">
                  {analysis.nextSteps?.map((step, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-dental-text">
                      <span className="w-4 h-4 bg-dental-blue text-white rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                <p className="text-[10px] text-amber-700">
                  <strong>Disclaimer:</strong> {analysis.disclaimer}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-dental-text mb-2">Legend</h4>
                <div className="space-y-1">
                  {[
                    { label: 'High concern', color: 'bg-red-400' },
                    { label: 'Moderate concern', color: 'bg-amber-400' },
                    { label: 'Low concern / normal', color: 'bg-green-400' },
                  ].map(({ label, color }) => (
                    <div key={label} className="flex items-center gap-2">
                      <div className={`w-3 h-1.5 rounded-full ${color}`} />
                      <span className="text-[10px] text-dental-text-secondary">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
