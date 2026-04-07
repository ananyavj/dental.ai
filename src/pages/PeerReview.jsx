import React, { useState, useEffect, useRef } from 'react'
import AppLayout from '../components/AppLayout'
import {
  MessageSquare, Heart, Share2, Plus, Filter,
  SortDesc, Image as ImageIcon, Send, X, CheckCircle2,
  MoreVertical, ShieldCheck, Clock, MessageCircle,
  Loader2, Camera, Trash2
} from 'lucide-react'
import { supabase } from '../supabase'
import { useAuth } from '../App'
import {
  fetchCases, createCase, deleteCase, endorseCase, unendorseCase,
  checkUserEndorsement, fetchComments, addComment
} from '../lib/data'

// ── Comment Thread Component ──────────────────────────────────────────────────
function CommentThread({ caseId, isOpen, onClose }) {
  const { user } = useAuth()
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadComments()
    }
  }, [isOpen, caseId])

  const loadComments = async () => {
    setLoading(true)
    try {
      const data = await fetchComments(caseId)
      setComments(data)
    } catch (err) {
      console.error('Error fetching comments:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newComment.trim() || !user) return

    try {
      const data = await addComment(caseId, user.id, newComment)
      setComments([...comments, { ...data, profiles: (await supabase.from('profiles').select('*').eq('id', user.id).single()).data }])
      setNewComment('')
      loadComments() // Refresh to get profile data properly joined
    } catch (err) {
      console.error('Error posting comment:', err)
    }
  }

  if (!isOpen) return null

  return (
    <div className="border-t border-slate-100 bg-slate-50/50 p-4 animate-slide-down">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
          <MessageCircle size={14} className="text-blue-500" /> Discussion
        </h4>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
          <X size={14} />
        </button>
      </div>

      <div className="space-y-4 max-h-64 overflow-y-auto mb-4 pr-2">
        {loading ? (
          <div className="flex justify-center py-4"><Loader2 className="animate-spin text-blue-500" size={20} /></div>
        ) : comments.length === 0 ? (
          <p className="text-center text-xs text-slate-400 italic py-4">No comments yet. Start the discussion.</p>
        ) : (
          comments.map(c => (
            <div key={c.id} className="flex gap-3">
              <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-blue-700">
                {c.profiles?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??'}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800">{c.profiles?.name}</span>
                  {c.profiles?.is_verified && <ShieldCheck size={10} className="text-amber-500" />}
                  <span className="text-[10px] text-slate-400 italic">{c.profiles?.specialty}</span>
                  <span className="text-[10px] text-slate-400 ml-auto">
                    {new Date(c.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                  {c.body}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          placeholder="Share your opinion as a professional..."
          className="flex-1 bg-white border border-slate-200 rounded-full px-4 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-sm"
        />
        <button type="submit" disabled={!newComment.trim()} className="bg-blue-600 text-white rounded-full p-1.5 hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md">
          <Send size={14} />
        </button>
      </form>
    </div>
  )
}

// ── Delete Confirmation Modal ─────────────────────────────────────────────────
function DeleteConfirmModal({ title, onConfirm, onCancel, deleting }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-slate-100">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center border-4 border-red-100">
            <Trash2 size={24} className="text-red-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Delete this case?</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-slate-700">&ldquo;{title}&rdquo;</span>?{' '}
              This cannot be undone.
            </p>
          </div>
          <div className="flex gap-3 w-full">
            <button
              onClick={onCancel}
              disabled={deleting}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={deleting}
              className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-red-100"
            >
              {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
              {deleting ? 'Deleting...' : 'Yes, Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Case Card Component ───────────────────────────────────────────────────────
function CaseCard({ c, user, onDelete }) {
  const [isEndorsed, setIsEndorsed] = useState(false)
  const [endorsementCount, setEndorsementCount] = useState(c.endorsements?.[0]?.count || 0)
  const [showComments, setShowComments] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteCase(c.id)
      onDelete(c.id)
    } catch (err) {
      alert('Failed to delete: ' + err.message)
      setDeleting(false)
      setShowDeleteModal(false)
    }
  }

  useEffect(() => {
    if (user) {
      checkUserEndorsement(c.id, user.id).then(setIsEndorsed)
    }
  }, [c.id, user])

  const handleEndorse = async () => {
    if (!user) return
    const prevEndorsed = isEndorsed
    setIsEndorsed(!prevEndorsed)
    setEndorsementCount(prev => prevEndorsed ? prev - 1 : prev + 1)

    try {
      if (prevEndorsed) await unendorseCase(c.id, user.id)
      else await endorseCase(c.id, user.id)
    } catch (err) {
      setIsEndorsed(prevEndorsed)
      setEndorsementCount(prev => prevEndorsed ? prev + 1 : prev - 1)
      console.error('Endorsement failed:', err)
    }
  }

  return (
    <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
      <div className="p-4">
        {/* Author Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center font-bold text-blue-700 border border-blue-50">
            {c.profiles?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold text-slate-800">{c.profiles?.name || 'Anonymous Practitioner'}</h3>
              {c.profiles?.is_verified && <ShieldCheck size={12} className="text-amber-500" />}
            </div>
            <p className="text-[10px] text-slate-400">{c.profiles?.specialty}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <Clock size={10} /> {new Date(c.created_at).toLocaleDateString()}
            </span>
            {user?.id === c.author_id && (
              <button
                onClick={() => setShowDeleteModal(true)}
                className="text-slate-300 hover:text-red-500 transition-all p-1.5 rounded-lg hover:bg-red-50 hover:scale-110"
                title="Delete post"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <h2 className="text-sm font-bold text-slate-800 mb-2 leading-tight">{c.title}</h2>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {c.tags?.map(tag => (
            <span key={tag} className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 uppercase tracking-tight">
              {tag}
            </span>
          ))}
        </div>
        <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 mb-3 bg-slate-50/50 p-3 rounded-xl border border-slate-100/50 italic">
          "{c.clinical_data}"
        </p>
        <p className="text-xs font-semibold text-slate-800 mb-4 bg-blue-50/30 p-2 rounded-lg border border-blue-50 flex items-start gap-2">
          <MessageSquare size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
          <span>Q: {c.question}</span>
        </p>

        {/* Case Image */}
        {c.image_url && (
          <div className="mb-4 rounded-xl overflow-hidden border border-slate-100 shadow-inner">
            <img src={c.image_url} alt="Clinical findings" className="w-full h-auto object-cover max-h-64 brightness-95" />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-6 pt-2 border-t border-slate-50">
          <button
            onClick={handleEndorse}
            className={`flex items-center gap-1.5 text-xs font-bold transition-all ${isEndorsed ? 'text-red-500 scale-105' : 'text-slate-400 hover:text-red-500 hover:scale-105'}`}
          >
            <Heart size={16} fill={isEndorsed ? 'currentColor' : 'none'} className={isEndorsed ? 'animate-pulse' : ''} />
            {endorsementCount} Endorsements
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className={`flex items-center gap-1.5 text-xs font-bold transition-all ${showComments ? 'text-blue-600 scale-105' : 'text-slate-400 hover:text-blue-600 hover:scale-105'}`}
          >
            <MessageSquare size={16} fill={showComments ? 'currentColor' : 'none'} />
            {c.peer_comments?.[0]?.count || 0} Opinions
          </button>
          <button className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-700 transition-all ml-auto">
            <Share2 size={16} />
            Share
          </button>
        </div>
      </div>

      <CommentThread
        caseId={c.id}
        isOpen={showComments}
        onClose={() => setShowComments(false)}
      />

      {showDeleteModal && (
        <DeleteConfirmModal
          title={c.title}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteModal(false)}
          deleting={deleting}
        />
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function PeerReview() {
  const { user } = useAuth()
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeSpecialty, setActiveSpecialty] = useState('All Specialties')
  const [sortBy, setSortBy] = useState('newest')
  const [isPostModalOpen, setIsPostModalOpen] = useState(false)

  const specialties = [
    'All Specialties', 'Endodontics', 'Periodontics', 'Implantology', 
    'Oral Surgery', 'Orthodontics', 'Paediatrics', 'Prosthodontics', 'Oral Medicine'
  ]

  useEffect(() => {
    loadCases()
  }, [activeSpecialty, sortBy])

  const loadCases = async () => {
    setLoading(true)
    try {
      const data = await fetchCases(activeSpecialty, sortBy)
      setCases(data)
    } catch (err) {
      console.error('Error loading cases:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppLayout>
      <div className="flex-1 flex flex-col bg-[#fdfdfe] overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm shadow-blue-900/5">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-200">
              <MessageSquare size={20} />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">Peer Review Feed</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <CheckCircle2 size={12} className="text-green-500" />
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Anonymised Case Discussion Hub</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsPostModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-blue-700 transition-all shadow-md active:scale-95 group"
          >
            <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300" />
            Post a Case
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-3 bg-white/80 backdrop-blur-md border-b border-slate-50 flex items-center gap-4 scrollbar-hide overflow-x-auto whitespace-nowrap sticky top-[73px] z-10 transition-all">
          <div className="flex gap-2">
            {specialties.map(s => (
              <button
                key={s}
                onClick={() => setActiveSpecialty(s)}
                className={`px-4 py-1.5 rounded-full text-[11px] font-bold transition-all border ${
                  activeSpecialty === s 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100 scale-105' 
                    : 'bg-white text-slate-500 border-slate-100 hover:border-blue-200 hover:text-blue-500'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
             <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest hidden sm:inline">Sort By</span>
             <select 
               value={sortBy}
               onChange={e => setSortBy(e.target.value)}
               className="bg-slate-50 border border-slate-100 text-[11px] font-bold text-slate-600 rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-blue-100 transition-all"
             >
               <option value="newest">Newest Cases</option>
               <option value="popular">Most Endorsed</option>
               <option value="discussed">Most Discussed</option>
             </select>
          </div>
        </div>

        {/* Feed Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar bg-slate-50/30">
          <div className="max-w-2xl mx-auto space-y-6 pb-12">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 size={40} className="animate-spin text-blue-600" />
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Scanning professional network...</p>
              </div>
            ) : cases.length === 0 ? (
              <div className="text-center py-20 bg-white border border-slate-100 rounded-3xl p-10 shadow-sm border-dashed">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                   <Filter size={24} className="text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">No cases found</h3>
                <p className="text-xs text-slate-500 mt-2">Adjust your filters or be the first to share a case in {activeSpecialty}.</p>
                <button 
                  onClick={() => setIsPostModalOpen(true)}
                  className="mt-6 text-blue-600 font-bold text-xs uppercase tracking-wider underline hover:text-blue-800"
                >
                  Share Clinical Query
                </button>
              </div>
            ) : (
              cases.map(c => <CaseCard key={c.id} c={c} user={user} onDelete={id => setCases(prev => prev.filter(x => x.id !== id))} />)
            )}
          </div>
        </div>

        <PostCaseModal
          isOpen={isPostModalOpen}
          onClose={() => setIsPostModalOpen(false)}
          onSuccess={() => {
            setIsPostModalOpen(false)
            loadCases()
          }}
          user={user}
        />
      </div>
    </AppLayout>
  )
}

// ── Post Case Modal Component ─────────────────────────────────────────────────
function PostCaseModal({ isOpen, onClose, onSuccess, user }) {
  const [form, setForm] = useState({
    title: '',
    specialty: 'Endodontics',
    clinical_data: '',
    question: '',
    tags: []
  })
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const fileRef = useRef(null)

  const specialties = [
    'Endodontics', 'Periodontics', 'Implantology', 
    'Oral Surgery', 'Orthodontics', 'Paediatrics', 'Prosthodontics', 'Oral Medicine'
  ]

  const availableTags = ['Restorative', 'Digital', 'Emergency', 'Prophylaxis', 'Surgical', 'Radiology', 'Pathology']

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImage(file)
      const reader = new FileReader()
      reader.onloadend = () => setImagePreview(reader.result)
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) return
    setLoading(true)

    try {
      let imageUrl = null
      if (image) {
        const fileExt = image.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('case-images')
          .upload(fileName, image)
        
        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('case-images')
          .getPublicUrl(fileName)
        
        imageUrl = publicUrl
      }

      await createCase({
        ...form,
        author_id: user.id,
        image_url: imageUrl
      })

      onSuccess()
    } catch (err) {
      console.error('Error posting case:', err)
      alert('Failed to post case: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleTag = (tag) => {
    if (form.tags.includes(tag)) {
      setForm({ ...form, tags: form.tags.filter(t => t !== tag) })
    } else {
      setForm({ ...form, tags: [...form.tags, tag] })
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-white/20 animate-scale-up">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2 text-blue-600">
             <Camera size={18} />
             <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Post Clinical Case</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
          <div className="grid grid-cols-2 gap-4">
             <div className="col-span-2">
               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Case Headline</label>
               <input
                 type="text"
                 required
                 className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                 placeholder="e.g., Challenging Root Canal Anatomy in Lower Left First Molar"
                 value={form.title}
                 onChange={e => setForm({ ...form, title: e.target.value })}
               />
             </div>
             <div>
               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Primary Specialty</label>
               <select
                 className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                 value={form.specialty}
                 onChange={e => setForm({ ...form, specialty: e.target.value })}
               >
                 {specialties.filter(s => s !== 'All Specialties').map(s => <option key={s} value={s}>{s}</option>)}
               </select>
             </div>
             <div>
               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Tags</label>
               <div className="flex flex-wrap gap-1">
                 {availableTags.slice(0, 4).map(t => (
                   <button
                     key={t}
                     type="button"
                     onClick={() => toggleTag(t)}
                     className={`text-[9px] font-bold px-2 py-1 rounded-full border transition-all ${
                       form.tags.includes(t) ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white text-slate-400 border-slate-100'
                     }`}
                   >
                     {t}
                   </button>
                 ))}
               </div>
             </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Clinical Observations</label>
            <textarea
              required
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500/20 min-h-[80px]"
              placeholder="Provide a detailed, anonymised clinical summary..."
              value={form.clinical_data}
              onChange={e => setForm({ ...form, clinical_data: e.target.value })}
            />
          </div>

          <div>
             <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Your Question to Colleagues</label>
             <div className="relative">
               <div className="absolute left-4 top-3 text-blue-500"><MessageSquare size={14} /></div>
               <input
                 type="text"
                 required
                 className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                 placeholder="How would you approach this case?"
                 value={form.question}
                 onChange={e => setForm({ ...form, question: e.target.value })}
               />
             </div>
          </div>

          <div>
             <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Upload Radiograph / Image</label>
             <div 
               onClick={() => fileRef.current?.click()}
               className="w-full border-2 border-dashed border-slate-100 rounded-3xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-blue-200 transition-all bg-slate-50/30 group"
             >
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full max-h-48 object-contain rounded-xl shadow-md" />
                ) : (
                  <>
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-300 group-hover:text-blue-500 group-hover:shadow-md transition-all mb-3"><ImageIcon size={24} /></div>
                    <p className="text-[11px] font-bold text-slate-400">Tap to upload IOPA, OPG or clinical photo</p>
                    <p className="text-[10px] text-slate-300 mt-1 italic">JPEG or PNG, max 5MB</p>
                  </>
                )}
                <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
             </div>
          </div>
        </form>

        <div className="p-6 border-t border-slate-50 bg-slate-50/50 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
          <button 
            disabled={loading || !form.title || !form.clinical_data || !form.question}
            onClick={handleSubmit} 
            className="flex-[2] py-3 bg-blue-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 transition-all flex justify-center items-center gap-2"
          >
            {loading ? <><Loader2 size={16} className="animate-spin" /> Publishing Case...</> : 'Publish to Feed'}
          </button>
        </div>
      </div>
    </div>
  )
}
