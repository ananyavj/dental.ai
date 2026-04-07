import React, { useState, useEffect } from 'react'
import AppLayout from '../components/AppLayout'
import { supabase } from '../supabase'
import { useAuth } from '../App'
import { Users, Search, Clock, ShieldCheck, Plus, Loader2, AlertCircle } from 'lucide-react'

const STATUS_STYLES = {
  open: 'bg-blue-100 text-blue-700',
  resolved: 'bg-green-100 text-green-700',
  review: 'bg-amber-100 text-amber-700',
  closed: 'bg-slate-100 text-slate-700',
}

export default function PatientCases() {
  const { user } = useAuth()
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')

  useEffect(() => {
    if (user) {
      loadMyCases()
    }
  }, [user])

  const loadMyCases = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('peer_cases')
        .select('*')
        .eq('author_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setCases(data)
    } catch (err) {
      console.error('Error loading cases:', err)
      setError('Failed to fetch your cases. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const filtered = cases.filter(c =>
    (filter === 'All' || c.status === filter || c.specialty === filter) &&
    (c.title.toLowerCase().includes(search.toLowerCase()) || 
     c.clinical_data?.toLowerCase().includes(search.toLowerCase()))
  )

  const specialties = ['Endodontics', 'Periodontics', 'Implantology', 'Oral Surgery', 'Orthodontics']

  return (
    <AppLayout>
      <div className="flex-1 overflow-hidden flex flex-col bg-[#f8fafc]">
        {/* Header */}
        <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users size={18} className="text-[#1a5fa8]" /> My Clinical Cases
            </h1>
            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Manage your shared cases and peer reviews</p>
          </div>
          <button className="flex items-center gap-2 bg-[#1a5fa8] text-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-[#164e8a] transition-all shadow-md active:scale-95">
            <Plus size={14} /> New Case Query
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white border-b border-slate-100 px-6 py-3 flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Search by title or clinical data..." 
              className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-2 text-xs focus:ring-2 focus:ring-[#1a5fa8]/10 focus:border-[#1a5fa8] outline-none transition-all" 
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {['All', 'open', 'review', 'resolved', ...specialties].slice(0, 8).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-[10px] font-bold px-3 py-1.5 rounded-full border transition-all uppercase tracking-tight ${
                  filter === f 
                    ? 'bg-[#1a5fa8] text-white border-[#1a5fa8] shadow-sm' 
                    : 'bg-white text-slate-500 border-slate-100 hover:border-[#1a5fa8] hover:text-[#1a5fa8]'
                }`}
              >{f}</button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 size={32} className="animate-spin text-[#1a5fa8]" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Retrieving cases...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center max-w-sm mx-auto">
              <AlertCircle size={32} className="text-red-500 mx-auto mb-4" />
              <h3 className="text-sm font-bold text-red-800">Connection Error</h3>
              <p className="text-xs text-red-600 mt-2">{error}</p>
              <button onClick={loadMyCases} className="mt-4 text-xs font-bold text-red-700 underline">Try again</button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 bg-white border border-slate-100 border-dashed rounded-3xl p-10">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users size={24} className="text-slate-300" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">No Cases Found</h3>
              <p className="text-xs text-slate-400 mt-2">You haven't posted any cases in this category yet.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filtered.map(c => (
                <div key={c.id} className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-5 hover:shadow-lg hover:shadow-slate-200/50 transition-all group cursor-pointer">
                  <div className="w-12 h-12 bg-[#1a5fa8]/5 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-[#1a5fa8] transition-colors">
                    <span className="text-[#1a5fa8] text-xs font-bold group-hover:text-white uppercase">
                      {c.specialty?.slice(0, 2) || 'CA'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm font-bold text-slate-800 truncate">{c.title}</h3>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter ${STATUS_STYLES[c.status] || STATUS_STYLES.open}`}>
                        {c.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-1 leading-relaxed">
                      {c.clinical_data}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(c.created_at).toLocaleDateString()}
                      </p>
                      <span className="text-[10px] font-bold text-[#1a5fa8] bg-[#1a5fa8]/5 px-2 py-0.5 rounded-md uppercase tracking-widest">
                        {c.specialty}
                      </span>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-6 pr-4">
                     {c.image_url && <ShieldCheck size={16} className="text-green-500" title="Image Attached" />}
                     <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Case Reference</p>
                        <p className="text-xs font-mono text-slate-400">#{c.id.slice(0, 8)}</p>
                     </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
