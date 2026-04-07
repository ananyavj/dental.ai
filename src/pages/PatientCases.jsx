import { useEffect, useMemo, useState } from 'react'
import { Search, Stethoscope, Users } from 'lucide-react'
import AppLayout from '../components/AppLayout'
import PageTransition from '../components/PageTransition'
import { getPatientCases } from '../lib/appData'

export default function PatientCases() {
  const [cases, setCases] = useState([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')

  useEffect(() => {
    getPatientCases().then(setCases)
  }, [])

  const filtered = useMemo(() => {
    return cases.filter(item => {
      const matchesFilter = filter === 'All' || item.severity === filter || item.status === filter
      const q = search.toLowerCase()
      const matchesSearch =
        (item.patientName || '').toLowerCase().includes(q) ||
        (item.chiefComplaint || '').toLowerCase().includes(q)
      return matchesFilter && matchesSearch
    })
  }, [cases, filter, search])

  return (
    <AppLayout>
      <PageTransition>
        <div className="min-h-full bg-[#f6f3ec] px-4 py-5 md:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="rounded-[30px] border border-black/6 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Patient directory</p>
                  <h1 className="mt-2 text-3xl font-semibold text-slate-900">Case tracking with triage context</h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                    Search, filter, and review the active clinic roster. This page now reads from Supabase when available,
                    with a clinic-grade fallback dataset for demo runs.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[22px] bg-[#101b35] px-4 py-3 text-white">
                    <p className="text-xs uppercase tracking-[0.24em] text-white/60">Patients</p>
                    <p className="mt-2 text-2xl font-semibold">{cases.length}</p>
                  </div>
                  <div className="rounded-[22px] bg-[#ff7a59] px-4 py-3 text-white">
                    <p className="text-xs uppercase tracking-[0.24em] text-white/70">Urgent now</p>
                    <p className="mt-2 text-2xl font-semibold">{cases.filter(item => item.severity === 'URGENT').length}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={event => setSearch(event.target.value)}
                    placeholder="Search by patient name or complaint"
                    className="w-full rounded-[18px] border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-[#ff7a59]"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {['All', 'EMERGENCY', 'URGENT', 'ROUTINE', 'active', 'completed', 'review'].map(item => (
                    <button
                      key={item}
                      onClick={() => setFilter(item)}
                      className={`rounded-full px-4 py-2 text-xs font-medium transition ${
                        filter === item
                          ? 'bg-[#101b35] text-white'
                          : 'border border-slate-200 bg-white text-slate-600 hover:border-[#ff7a59]/40 hover:text-slate-900'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 grid gap-4 xl:grid-cols-2">
                {filtered.map(item => (
                  <div key={item.id} className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#101b35] text-sm font-semibold text-white">
                        {(item.patientName || 'P').split(' ').map(part => part[0]).join('').slice(0, 2)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-lg font-semibold text-slate-900">{item.patientName}</h2>
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide ${
                            item.severity === 'EMERGENCY' ? 'bg-rose-100 text-rose-700' :
                            item.severity === 'URGENT' ? 'bg-amber-100 text-amber-700' :
                            'bg-emerald-100 text-emerald-700'
                          }`}>
                            {item.severity}
                          </span>
                          <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-slate-700">
                            {item.status}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-slate-600">{item.chiefComplaint}</p>
                        <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
                          <span>{item.age} years</span>
                          <span>{item.sex}</span>
                          <span>{item.specialty || 'General Dentistry'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between rounded-[18px] bg-white px-4 py-3 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-2"><Users size={13} /> Case ID: {item.id}</span>
                      <span className="inline-flex items-center gap-2"><Stethoscope size={13} /> {new Date(item.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </PageTransition>
    </AppLayout>
  )
}
