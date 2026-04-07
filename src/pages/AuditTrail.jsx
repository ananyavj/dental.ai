import { useEffect, useMemo, useState } from 'react'
import { Download, Shield } from 'lucide-react'
import AppLayout from '../components/AppLayout'
import PageTransition from '../components/PageTransition'
import { getAuditEvents } from '../lib/appData'

export default function AuditTrail() {
  const [events, setEvents] = useState([])
  const [filter, setFilter] = useState('All')

  useEffect(() => {
    getAuditEvents().then(setEvents)
  }, [])

  const filtered = useMemo(() => {
    return events.filter(item =>
      filter === 'All' ||
      item.severity === filter ||
      item.doctorAction === filter
    )
  }, [events, filter])

  function handleExport() {
    const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `dental-ai-audit-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <AppLayout>
      <PageTransition>
        <div className="min-h-full bg-[#f6f3ec] px-4 py-5 md:px-8">
          <div className="mx-auto max-w-7xl rounded-[30px] border border-black/6 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Audit trail</p>
                <h1 className="mt-2 text-3xl font-semibold text-slate-900">Medico-legal activity ledger</h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                  Every AI-assisted output and saved clinical draft can land here. The page reads live `audit_events` when present
                  and otherwise keeps working with the seeded write-once local log.
                </p>
              </div>
              <button onClick={handleExport} className="btn-secondary">
                <Download size={14} /> Export JSON
              </button>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {['All', 'EMERGENCY', 'URGENT', 'ROUTINE', 'accepted', 'modified', 'rejected'].map(item => (
                <button
                  key={item}
                  onClick={() => setFilter(item)}
                  className={`rounded-full px-4 py-2 text-xs font-medium transition ${
                    filter === item ? 'bg-[#101b35] text-white' : 'border border-slate-200 text-slate-600 hover:border-[#ff7a59]/40'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="mt-6 space-y-3">
              {filtered.map(item => (
                <div key={item.id} className="grid gap-4 rounded-[24px] border border-slate-200 bg-slate-50/70 p-5 md:grid-cols-[160px_140px_120px_1fr]">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Timestamp</p>
                    <p className="mt-2 text-sm font-medium text-slate-900">
                      {new Date(item.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Case / severity</p>
                    <p className="mt-2 text-sm font-medium text-slate-900">{item.caseId || 'System log'}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.severity || 'ROUTINE'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Action</p>
                    <span className="mt-2 inline-flex rounded-full bg-[#101b35] px-3 py-1 text-xs font-medium text-white">
                      {item.doctorAction || 'pending'}
                    </span>
                  </div>
                  <div className="rounded-[20px] bg-white px-4 py-3">
                    <div className="flex items-center gap-2 text-slate-900">
                      <Shield size={14} className="text-[#ff7a59]" />
                      <p className="text-sm font-medium">{item.input?.chiefComplaint || item.title || 'Clinical event logged'}</p>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">Model: {item.modelVersion || 'gemini-1.5-flash'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </PageTransition>
    </AppLayout>
  )
}
