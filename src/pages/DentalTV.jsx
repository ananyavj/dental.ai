import { useState, useEffect } from 'react'
import AppLayout from '../components/AppLayout'
import { supabase } from '../supabase'
import { useAuth } from '../App'
import {
  Search, Play, Eye, Clock, Tv, X, ChevronRight, BookOpen,
  ExternalLink, Volume2, Plus, Send, CheckCircle, XCircle,
  AlertCircle, ShieldCheck, LinkIcon, MessageSquare, Loader2
} from 'lucide-react'

// ── Curated dental video database (6 user-verified YouTube links) ─────────────
const DENTAL_VIDEOS = [
  {
    id: 'v1',
    youtubeId: 'OdNcXcpsIUc',
    title: 'Root Canal Treatment — Step by Step Clinical Demonstration',
    channel: 'Dental Education',
    specialty: 'Endodontics',
    duration: null,
    views: null,
    level: 'Intermediate',
  },
  {
    id: 'v2',
    youtubeId: 'z0ugpkc0R18',
    title: 'Endodontic Access Cavity Preparation — Modern Concepts',
    channel: 'Endo Academy',
    specialty: 'Endodontics',
    duration: null,
    views: null,
    level: 'Advanced',
  },
  {
    id: 'v3',
    youtubeId: 'QCnJr1LDPkE',
    title: 'Scaling and Root Planing — Full Technique Walkthrough',
    channel: 'Perio Masterclass',
    specialty: 'Periodontics',
    duration: null,
    views: null,
    level: 'Intermediate',
  },
  {
    id: 'v4',
    youtubeId: 'P9t1CDxTN6E',
    title: 'Periodontal Flap Surgery — Step by Step',
    channel: 'Surgical Perio',
    specialty: 'Periodontics',
    duration: null,
    views: null,
    level: 'Advanced',
  },
  {
    id: 'v5',
    youtubeId: 'Hb1b3YPHiTE',
    title: 'Impacted Third Molar Extraction — Surgical Technique',
    channel: 'OMS Academy',
    specialty: 'Oral Surgery',
    duration: null,
    views: null,
    level: 'Intermediate',
  },
  {
    id: 'v6',
    youtubeId: 'zq7C9La2-yA',
    title: 'Atraumatic Extraction & Socket Preservation Protocol',
    channel: 'Implant Surgery Pro',
    specialty: 'Oral Surgery',
    duration: null,
    views: null,
    level: 'Intermediate',
  },
]

const SPECIALTIES = ['All', 'Endodontics', 'Periodontics', 'Oral Surgery', 'Implantology', 'Orthodontics', 'Prosthodontics', 'Paediatrics', 'Oral Medicine']
const LEVELS = ['All Levels', 'Beginner', 'Intermediate', 'Advanced']

const SPECIALTY_COLORS = {
  'Endodontics':    { gradient: 'from-blue-500 to-blue-700',    badge: 'bg-blue-100 text-blue-700',    dot: 'bg-blue-500' },
  'Periodontics':   { gradient: 'from-green-500 to-green-700',  badge: 'bg-green-100 text-green-700',  dot: 'bg-green-500' },
  'Oral Surgery':   { gradient: 'from-red-500 to-red-700',      badge: 'bg-red-100 text-red-700',      dot: 'bg-red-500' },
  'Implantology':   { gradient: 'from-purple-500 to-purple-700',badge: 'bg-purple-100 text-purple-700',dot: 'bg-purple-500' },
  'Orthodontics':   { gradient: 'from-indigo-500 to-indigo-700',badge: 'bg-indigo-100 text-indigo-700',dot: 'bg-indigo-500' },
  'Prosthodontics': { gradient: 'from-orange-500 to-orange-700',badge: 'bg-orange-100 text-orange-700',dot: 'bg-orange-500' },
  'Paediatrics':    { gradient: 'from-yellow-400 to-yellow-600',badge: 'bg-yellow-100 text-yellow-700',dot: 'bg-yellow-400' },
  'Oral Medicine':  { gradient: 'from-teal-500 to-teal-700',    badge: 'bg-teal-100 text-teal-700',    dot: 'bg-teal-500' },
}

const LEVEL_BADGE = {
  Beginner:     'bg-green-100 text-green-700 border-green-200',
  Intermediate: 'bg-amber-100 text-amber-700 border-amber-200',
  Advanced:     'bg-red-100 text-red-700 border-red-200',
}

// ── Utility: extract YouTube ID from various URL formats ──────────────────────
function extractYoutubeId(url) {
  if (!url) return null
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/,
    /^([A-Za-z0-9_-]{11})$/, // raw ID
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

// ── Video Card ─────────────────────────────────────────────────────────────────
function VideoCard({ video, onClick, isActive }) {
  const colors = SPECIALTY_COLORS[video.specialty] || { gradient: 'from-gray-400 to-gray-600', badge: 'bg-gray-100 text-gray-700' }
  const isCommunity = !!video.isCommunity

  return (
    <div
      onClick={onClick}
      className={`group cursor-pointer rounded-2xl overflow-hidden border transition-all duration-200 ${
        isActive
          ? 'border-dental-blue shadow-lg shadow-blue-100 scale-[1.01]'
          : 'border-dental-border hover:border-dental-blue hover:shadow-md hover:scale-[1.01]'
      } bg-white`}
    >
      {/* Thumbnail */}
      <div className={`relative h-32 bg-gradient-to-br ${colors.gradient} flex items-center justify-center overflow-hidden`}>
        <img
          src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
          alt={video.title}
          className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-70 transition-opacity"
          onError={e => { e.target.style.display = 'none' }}
        />
        <div className="relative z-10 w-10 h-10 bg-white/25 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white/40 group-hover:scale-110 transition-all border border-white/30">
          <Play size={16} className="text-white ml-0.5" fill="white" />
        </div>
        <div className="absolute bottom-2 right-2 z-10 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded-md flex items-center gap-1">
          <Clock size={8} /> {video.duration || '—'}
        </div>
        {isActive && (
          <div className="absolute inset-0 bg-dental-blue/20 flex items-center justify-center z-20">
            <div className="bg-dental-blue text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
              <Volume2 size={10} /> Now Playing
            </div>
          </div>
        )}
        {isCommunity && !isActive && (
          <div className="absolute top-2 left-2 z-10 bg-emerald-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
            Community
          </div>
        )}
      </div>
      {/* Info */}
      <div className="p-3">
        <h3 className="text-xs font-semibold text-dental-text leading-snug line-clamp-2 mb-1.5">{video.title}</h3>
        <p className="text-[10px] text-dental-text-secondary mb-2">{video.channel}</p>
        <div className="flex items-center justify-between">
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${LEVEL_BADGE[video.level] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
            {video.level || 'General'}
          </span>
          {video.views && (
            <span className="text-[10px] text-dental-text-secondary flex items-center gap-1">
              <Eye size={9} /> {video.views}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ── YouTube Player Panel ───────────────────────────────────────────────────────
function VideoPlayer({ video, allVideos, onClose }) {
  const colors = SPECIALTY_COLORS[video.specialty] || { gradient: 'from-gray-500 to-gray-700', badge: 'bg-gray-100 text-gray-700', dot: 'bg-gray-400' }
  const related = allVideos.filter(v => v.id !== video.id && v.specialty === video.specialty).slice(0, 4)

  return (
    <div className="flex flex-col h-full">
      {/* Embed */}
      <div className="relative bg-black" style={{ paddingBottom: '56.25%' }}>
        <iframe
          className="absolute inset-0 w-full h-full"
          src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
          title={video.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      {/* Meta */}
      <div className="p-4 border-b border-dental-border">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-dental-text leading-snug">{video.title}</h2>
            <p className="text-xs text-dental-text-secondary mt-1">{video.channel}</p>
            {video.submitterNote && (
              <p className="text-[11px] text-teal-700 bg-teal-50 border border-teal-100 rounded-lg px-2 py-1 mt-2 italic">
                💬 "{video.submitterNote}"
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-dental-text-secondary hover:text-dental-text p-1 rounded-lg hover:bg-dental-surface flex-shrink-0">
            <X size={16} />
          </button>
        </div>
        <div className="flex items-center gap-3 mt-3 flex-wrap">
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${colors.badge}`}>{video.specialty}</span>
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${LEVEL_BADGE[video.level] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
            {video.level || 'General'}
          </span>
          {video.views && (
            <span className="text-[10px] text-dental-text-secondary flex items-center gap-1"><Eye size={10} /> {video.views}</span>
          )}
          {video.duration && (
            <span className="text-[10px] text-dental-text-secondary flex items-center gap-1"><Clock size={10} /> {video.duration}</span>
          )}
          <a
            href={`https://youtube.com/watch?v=${video.youtubeId}`}
            target="_blank" rel="noreferrer"
            className="ml-auto text-[10px] text-dental-blue font-semibold flex items-center gap-1 hover:underline"
          >
            <ExternalLink size={10} /> YouTube
          </a>
        </div>
      </div>

      {/* Up Next */}
      {related.length > 0 && (
        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-[10px] font-bold text-dental-text-secondary uppercase tracking-widest mb-3">
            Up Next — {video.specialty}
          </p>
          <div className="space-y-3">
            {related.map(v => {
              const rc = SPECIALTY_COLORS[v.specialty] || { gradient: 'from-gray-400 to-gray-600' }
              return (
                <button
                  key={v.id}
                  onClick={() => window.dispatchEvent(new CustomEvent('dental-tv-select', { detail: v }))}
                  className="w-full flex items-start gap-3 text-left hover:bg-dental-surface p-2 rounded-xl transition-colors group"
                >
                  <div className={`w-20 h-12 rounded-lg bg-gradient-to-br ${rc.gradient} flex-shrink-0 flex items-center justify-center overflow-hidden relative`}>
                    <img
                      src={`https://img.youtube.com/vi/${v.youtubeId}/mqdefault.jpg`}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover opacity-60"
                      onError={e => { e.target.style.display = 'none' }}
                    />
                    <Play size={12} className="relative z-10 text-white" fill="white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-dental-text line-clamp-2 leading-snug group-hover:text-dental-blue transition-colors">
                      {v.title}
                    </p>
                    <p className="text-[9px] text-dental-text-secondary mt-0.5">
                      {v.channel}{v.duration ? ` · ${v.duration}` : ''}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Request Video Modal ────────────────────────────────────────────────────────
function RequestVideoModal({ onClose, onSubmit, loading }) {
  const [form, setForm] = useState({
    youtubeUrl: '',
    title: '',
    channel: '',
    specialty: 'Endodontics',
    level: 'Intermediate',
    note: '',
  })
  const [urlError, setUrlError] = useState('')

  const handleSubmit = () => {
    const ytId = extractYoutubeId(form.youtubeUrl)
    if (!ytId) {
      setUrlError('Please enter a valid YouTube URL or video ID.')
      return
    }
    if (!form.title.trim()) return
    setUrlError('')
    onSubmit({ ...form, youtubeId: ytId })
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-dental-border animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-dental-border">
          <div>
            <h2 className="text-sm font-bold text-dental-text flex items-center gap-2">
              <Plus size={14} className="text-dental-blue" /> Request a Video
            </h2>
            <p className="text-[10px] text-dental-text-secondary mt-0.5">
              Your request will be reviewed by an admin before going live.
            </p>
          </div>
          <button onClick={onClose} className="text-dental-text-secondary hover:text-dental-text p-1 rounded-lg hover:bg-dental-surface">
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <div className="p-5 space-y-3">
          {/* YouTube URL */}
          <div>
            <label className="text-[10px] font-bold text-dental-text-secondary uppercase tracking-wider mb-1 block">
              YouTube URL or Video ID *
            </label>
            <div className="relative">
              <LinkIcon size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-dental-text-secondary" />
              <input
                value={form.youtubeUrl}
                onChange={e => { setForm(f => ({ ...f, youtubeUrl: e.target.value })); setUrlError('') }}
                placeholder="https://youtube.com/watch?v=..."
                className="input-field pl-8 text-xs w-full"
              />
            </div>
            {urlError && <p className="text-[10px] text-red-500 mt-1">{urlError}</p>}
            {/* Live preview */}
            {extractYoutubeId(form.youtubeUrl) && (
              <div className="mt-2 flex items-center gap-2 bg-dental-surface rounded-xl p-2 border border-dental-border">
                <img
                  src={`https://img.youtube.com/vi/${extractYoutubeId(form.youtubeUrl)}/mqdefault.jpg`}
                  className="w-20 h-12 object-cover rounded-lg flex-shrink-0"
                  alt="preview"
                  onError={e => { e.target.src = '' }}
                />
                <p className="text-[10px] text-green-700 font-semibold flex items-center gap-1">
                  <CheckCircle size={10} /> Valid YouTube video detected
                </p>
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="text-[10px] font-bold text-dental-text-secondary uppercase tracking-wider mb-1 block">
              Video Title *
            </label>
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Furcation Involvement Management"
              className="input-field text-xs w-full"
            />
          </div>

          {/* Channel */}
          <div>
            <label className="text-[10px] font-bold text-dental-text-secondary uppercase tracking-wider mb-1 block">
              Channel Name
            </label>
            <input
              value={form.channel}
              onChange={e => setForm(f => ({ ...f, channel: e.target.value }))}
              placeholder="e.g. Perio Masterclass"
              className="input-field text-xs w-full"
            />
          </div>

          {/* Specialty + Level */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-dental-text-secondary uppercase tracking-wider mb-1 block">
                Specialty
              </label>
              <select
                value={form.specialty}
                onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))}
                className="input-field text-xs w-full"
              >
                {SPECIALTIES.filter(s => s !== 'All').map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-dental-text-secondary uppercase tracking-wider mb-1 block">
                Level
              </label>
              <select
                value={form.level}
                onChange={e => setForm(f => ({ ...f, level: e.target.value }))}
                className="input-field text-xs w-full"
              >
                {['Beginner', 'Intermediate', 'Advanced'].map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="text-[10px] font-bold text-dental-text-secondary uppercase tracking-wider mb-1 block flex items-center gap-1">
              <MessageSquare size={9} /> Note for Admin (optional)
            </label>
            <textarea
              value={form.note}
              onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              rows={2}
              placeholder="Why should this video be added? Any context about its quality or relevance..."
              className="input-field text-xs w-full resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex gap-2 justify-end">
          <button onClick={onClose} className="btn-secondary text-xs px-4 py-2">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={loading || !form.title.trim() || !form.youtubeUrl.trim()}
            className="btn-primary text-xs px-5 py-2 flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
            Submit Request
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Admin Panel ────────────────────────────────────────────────────────────────
function AdminPanel({ onClose, onVideoApproved }) {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [toast, setToast] = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchRequests = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('tv_video_requests')
      .select('*, profiles(name, specialty)')
      .order('created_at', { ascending: false })
    if (!error) setRequests(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchRequests() }, [])

  const handleApprove = async (req) => {
    setActionLoading(req.id)
    // Insert into approved community videos table
    const { error: insertErr } = await supabase.from('tv_community_videos').insert({
      youtube_id: req.youtube_id,
      title: req.title,
      channel: req.channel || 'Community',
      specialty: req.specialty,
      level: req.level,
      submitter_note: req.note,
      approved_at: new Date().toISOString(),
    })
    if (insertErr) { showToast('Failed to approve: ' + insertErr.message, 'error'); setActionLoading(null); return }
    // Update request status
    await supabase.from('tv_video_requests').update({ status: 'approved' }).eq('id', req.id)
    showToast('Video approved and added to Dental TV!')
    fetchRequests()
    onVideoApproved()
    setActionLoading(null)
  }

  const handleReject = async (req) => {
    setActionLoading(req.id + '-reject')
    await supabase.from('tv_video_requests').update({ status: 'rejected' }).eq('id', req.id)
    showToast('Request rejected.', 'warn')
    fetchRequests()
    setActionLoading(null)
  }

  const pending = requests.filter(r => r.status === 'pending')
  const reviewed = requests.filter(r => r.status !== 'pending')

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-2xl border border-dental-border flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-dental-border flex-shrink-0">
          <div>
            <h2 className="text-sm font-bold text-dental-text flex items-center gap-2">
              <ShieldCheck size={14} className="text-dental-blue" /> Admin — Video Request Queue
            </h2>
            <p className="text-[10px] text-dental-text-secondary mt-0.5">
              {pending.length} pending · {reviewed.length} reviewed
            </p>
          </div>
          <button onClick={onClose} className="text-dental-text-secondary hover:text-dental-text p-1 rounded-lg hover:bg-dental-surface">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin text-dental-blue" />
            </div>
          ) : pending.length === 0 && reviewed.length === 0 ? (
            <div className="text-center py-16">
              <CheckCircle size={32} className="mx-auto mb-3 text-dental-text-secondary opacity-30" />
              <p className="text-sm text-dental-text-secondary">No requests yet</p>
            </div>
          ) : (
            <>
              {pending.length > 0 && (
                <>
                  <p className="text-[10px] font-bold text-dental-text-secondary uppercase tracking-widest">
                    Pending ({pending.length})
                  </p>
                  {pending.map(req => (
                    <RequestRow
                      key={req.id}
                      req={req}
                      onApprove={() => handleApprove(req)}
                      onReject={() => handleReject(req)}
                      approveLoading={actionLoading === req.id}
                      rejectLoading={actionLoading === req.id + '-reject'}
                    />
                  ))}
                </>
              )}
              {reviewed.length > 0 && (
                <>
                  <p className="text-[10px] font-bold text-dental-text-secondary uppercase tracking-widest mt-4">
                    Reviewed ({reviewed.length})
                  </p>
                  {reviewed.map(req => (
                    <RequestRow key={req.id} req={req} reviewed />
                  ))}
                </>
              )}
            </>
          )}
        </div>

        {/* Toast */}
        {toast && (
          <div className={`mx-5 mb-4 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            toast.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
            toast.type === 'warn' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
            'bg-green-50 text-green-700 border border-green-200'
          }`}>
            {toast.type === 'error' ? <XCircle size={12} /> : <CheckCircle size={12} />}
            {toast.msg}
          </div>
        )}
      </div>
    </div>
  )
}

function RequestRow({ req, onApprove, onReject, approveLoading, rejectLoading, reviewed }) {
  const ytId = req.youtube_id
  const statusColor = req.status === 'approved'
    ? 'text-green-700 bg-green-50 border-green-200'
    : req.status === 'rejected'
    ? 'text-red-700 bg-red-50 border-red-200'
    : 'text-amber-700 bg-amber-50 border-amber-200'

  return (
    <div className="border border-dental-border rounded-2xl overflow-hidden bg-dental-surface/40">
      <div className="flex gap-3 p-3">
        {/* Thumbnail */}
        <div className="w-24 h-14 rounded-xl overflow-hidden bg-gray-200 flex-shrink-0">
          <img
            src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
            className="w-full h-full object-cover"
            alt=""
            onError={e => { e.target.style.display = 'none' }}
          />
        </div>
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-xs font-bold text-dental-text line-clamp-1">{req.title}</h3>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${statusColor}`}>
              {req.status}
            </span>
          </div>
          <p className="text-[10px] text-dental-text-secondary">
            {req.channel || 'Unknown Channel'} · {req.specialty} · {req.level}
          </p>
          {req.note && (
            <p className="text-[10px] text-teal-700 bg-teal-50 rounded-lg px-2 py-1 mt-1 italic line-clamp-2">
              💬 {req.note}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1">
            <p className="text-[9px] text-dental-text-secondary">
              Submitted by {req.profiles?.name || 'Unknown'} · {new Date(req.created_at).toLocaleDateString()}
            </p>
            <a
              href={`https://youtube.com/watch?v=${ytId}`}
              target="_blank" rel="noreferrer"
              className="text-[9px] text-dental-blue flex items-center gap-0.5 hover:underline"
            >
              <ExternalLink size={8} /> View
            </a>
          </div>
        </div>
      </div>
      {/* Actions — only for pending */}
      {!reviewed && (
        <div className="flex border-t border-dental-border">
          <button
            onClick={onReject}
            disabled={rejectLoading || approveLoading}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {rejectLoading ? <Loader2 size={11} className="animate-spin" /> : <XCircle size={11} />}
            Reject
          </button>
          <div className="w-px bg-dental-border" />
          <button
            onClick={onApprove}
            disabled={approveLoading || rejectLoading}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold text-green-700 hover:bg-green-50 transition-colors disabled:opacity-50"
          >
            {approveLoading ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle size={11} />}
            Approve & Publish
          </button>
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function DentalTV() {
  const { user } = useAuth()
  const [specialty, setSpecialty] = useState('All')
  const [level, setLevel] = useState('All Levels')
  const [search, setSearch] = useState('')
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [featuredIndex, setFeaturedIndex] = useState(0)
  const featured = DENTAL_VIDEOS.slice(0, 5)

  // Community videos from Supabase
  const [communityVideos, setCommunityVideos] = useState([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)

  // Modal state
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const [requestLoading, setRequestLoading] = useState(false)
  const [requestToast, setRequestToast] = useState(null)

  // Load community videos + check admin
  const loadCommunityVideos = async () => {
    const { data } = await supabase
      .from('tv_community_videos')
      .select('*')
      .order('approved_at', { ascending: false })
    if (data) {
      setCommunityVideos(
        data.map((v, i) => ({
          id: 'community-' + v.id,
          youtubeId: v.youtube_id,
          title: v.title,
          channel: v.channel,
          specialty: v.specialty,
          level: v.level,
          submitterNote: v.submitter_note,
          duration: v.duration || null,
          views: null,
          isCommunity: true,
        }))
      )
    }
  }

  const checkAdmin = async () => {
    if (!user) return
    const { data } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    if (data?.is_admin) setIsAdmin(true)
  }

  const loadPendingCount = async () => {
    if (!isAdmin) return
    const { count } = await supabase
      .from('tv_video_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')
    setPendingCount(count || 0)
  }

  useEffect(() => {
    loadCommunityVideos()
    checkAdmin()
  }, [user])

  useEffect(() => {
    if (isAdmin) loadPendingCount()
  }, [isAdmin])

  // Listen for "up next" selections from player
  useEffect(() => {
    const handler = e => setSelectedVideo(e.detail)
    window.addEventListener('dental-tv-select', handler)
    return () => window.removeEventListener('dental-tv-select', handler)
  }, [])

  // Auto-rotate featured
  useEffect(() => {
    if (selectedVideo) return
    const t = setInterval(() => setFeaturedIndex(i => (i + 1) % featured.length), 5000)
    return () => clearInterval(t)
  }, [selectedVideo])

  const allVideos = [...DENTAL_VIDEOS, ...communityVideos]

  const filtered = allVideos.filter(v => {
    const matchSpecialty = specialty === 'All' || v.specialty === specialty
    const matchLevel = level === 'All Levels' || v.level === level
    const matchSearch =
      v.title.toLowerCase().includes(search.toLowerCase()) ||
      v.channel.toLowerCase().includes(search.toLowerCase()) ||
      v.specialty.toLowerCase().includes(search.toLowerCase())
    return matchSpecialty && matchLevel && matchSearch
  })

  const featuredVideo = featured[featuredIndex]
  const featuredColors = SPECIALTY_COLORS[featuredVideo?.specialty] || { gradient: 'from-gray-500 to-gray-700' }

  const handleSubmitRequest = async (form) => {
    if (!user) return
    setRequestLoading(true)
    const { error } = await supabase.from('tv_video_requests').insert({
      submitted_by: user.id,
      youtube_id: form.youtubeId,
      title: form.title,
      channel: form.channel || null,
      specialty: form.specialty,
      level: form.level,
      note: form.note || null,
      status: 'pending',
    })
    setRequestLoading(false)
    if (error) {
      setRequestToast({ msg: 'Failed to submit: ' + error.message, type: 'error' })
    } else {
      setShowRequestModal(false)
      setRequestToast({ msg: 'Request submitted! An admin will review it soon.', type: 'success' })
      if (isAdmin) loadPendingCount()
    }
    setTimeout(() => setRequestToast(null), 4000)
  }

  return (
    <AppLayout>
      <div className="flex-1 overflow-hidden flex flex-col">

        {/* Global toast */}
        {requestToast && (
          <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-lg border ${
            requestToast.type === 'error'
              ? 'bg-red-50 text-red-700 border-red-200'
              : 'bg-green-50 text-green-700 border-green-200'
          }`}>
            {requestToast.type === 'error' ? <XCircle size={13} /> : <CheckCircle size={13} />}
            {requestToast.msg}
          </div>
        )}

        {/* Header */}
        <div className="bg-white border-b border-dental-border px-5 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-sm font-bold text-dental-text flex items-center gap-2">
              <Tv size={15} className="text-dental-blue" /> Dental TV
            </h1>
            <p className="text-xs text-dental-text-secondary">
              Curated dental education — {allVideos.length} videos across {SPECIALTIES.length - 1} specialties
              {communityVideos.length > 0 && (
                <span className="ml-1 text-emerald-600">· {communityVideos.length} community</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Admin queue button */}
            {isAdmin && (
              <button
                onClick={() => setShowAdminPanel(true)}
                className="relative flex items-center gap-1.5 text-[10px] font-semibold bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1.5 rounded-full hover:bg-amber-100 transition-colors"
              >
                <ShieldCheck size={11} />
                Admin Queue
                {pendingCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {pendingCount}
                  </span>
                )}
              </button>
            )}

            {/* Request video button */}
            <button
              onClick={() => setShowRequestModal(true)}
              className="flex items-center gap-1.5 text-[10px] font-semibold bg-dental-blue text-white px-3 py-1.5 rounded-full hover:bg-blue-600 transition-colors"
            >
              <Plus size={11} /> Request Video
            </button>

            <div className="flex items-center gap-1.5 text-[10px] text-green-600 font-semibold bg-green-50 border border-green-100 px-2.5 py-1 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Live Feed
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex">
          {/* Left: Browse */}
          <div className="flex-1 overflow-y-auto">

            {/* Featured Hero */}
            {!selectedVideo && (
              <div className={`relative h-52 bg-gradient-to-br ${featuredColors.gradient} overflow-hidden`}>
                <img
                  src={`https://img.youtube.com/vi/${featuredVideo?.youtubeId}/maxresdefault.jpg`}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover opacity-30"
                  onError={e => { e.target.style.display = 'none' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 p-5">
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-white border border-white/20 uppercase tracking-wider">
                    Featured · {featuredVideo?.specialty}
                  </span>
                  <h2 className="text-white font-bold text-base mt-2 leading-snug max-w-lg">{featuredVideo?.title}</h2>
                  <p className="text-white/70 text-xs mt-1">{featuredVideo?.channel} · {featuredVideo?.duration}</p>
                  <button
                    onClick={() => setSelectedVideo(featuredVideo)}
                    className="mt-3 flex items-center gap-2 bg-white text-dental-blue font-bold text-xs px-4 py-2 rounded-full hover:bg-blue-50 transition-colors shadow-lg"
                  >
                    <Play size={13} fill="currentColor" /> Watch Now
                  </button>
                </div>
                {/* Dots */}
                <div className="absolute bottom-4 right-5 flex gap-1.5">
                  {featured.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setFeaturedIndex(i)}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        i === featuredIndex ? 'bg-white w-4' : 'bg-white/40 hover:bg-white/70'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Search + Filters */}
            <div className="p-4 space-y-3 bg-dental-surface border-b border-dental-border">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-dental-text-secondary" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search videos, channels, specialties..."
                  className="input-field pl-9 text-xs w-full"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {SPECIALTIES.map(s => {
                  const dot = SPECIALTY_COLORS[s]?.dot
                  return (
                    <button
                      key={s}
                      onClick={() => setSpecialty(s)}
                      className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-colors flex items-center gap-1.5 ${
                        specialty === s
                          ? 'bg-dental-blue text-white border-dental-blue'
                          : 'bg-white text-dental-text-secondary border-dental-border hover:border-dental-blue hover:text-dental-blue'
                      }`}
                    >
                      {s !== 'All' && <div className={`w-1.5 h-1.5 rounded-full ${specialty === s ? 'bg-white' : dot}`} />}
                      {s}
                    </button>
                  )
                })}
              </div>
              <div className="flex gap-2">
                {LEVELS.map(l => (
                  <button
                    key={l}
                    onClick={() => setLevel(l)}
                    className={`text-[11px] px-3 py-1 rounded-full font-medium border transition-colors ${
                      level === l
                        ? 'bg-dental-text text-white border-dental-text'
                        : 'bg-white text-dental-text-secondary border-dental-border hover:border-dental-text'
                    }`}
                  >
                    {l}
                  </button>
                ))}
                <span className="ml-auto text-[10px] text-dental-text-secondary self-center">{filtered.length} videos</span>
              </div>
            </div>

            {/* Grid */}
            <div className="p-4">
              {filtered.length === 0 ? (
                <div className="text-center py-16">
                  <Tv size={32} className="mx-auto mb-3 text-dental-text-secondary opacity-30" />
                  <p className="text-sm text-dental-text-secondary">No videos match your filters</p>
                  <button
                    onClick={() => { setSpecialty('All'); setLevel('All Levels'); setSearch('') }}
                    className="text-xs text-dental-blue mt-2 underline"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                  {filtered.map(video => (
                    <VideoCard
                      key={video.id}
                      video={video}
                      onClick={() => setSelectedVideo(video)}
                      isActive={selectedVideo?.id === video.id}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Player Panel */}
          {selectedVideo && (
            <div className="w-96 flex-shrink-0 border-l border-dental-border bg-white overflow-hidden flex flex-col">
              <VideoPlayer
                video={selectedVideo}
                allVideos={allVideos}
                onClose={() => setSelectedVideo(null)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showRequestModal && (
        <RequestVideoModal
          onClose={() => setShowRequestModal(false)}
          onSubmit={handleSubmitRequest}
          loading={requestLoading}
        />
      )}
      {showAdminPanel && (
        <AdminPanel
          onClose={() => { setShowAdminPanel(false); loadPendingCount() }}
          onVideoApproved={() => { loadCommunityVideos(); loadPendingCount() }}
        />
      )}
    </AppLayout>
  )
}
