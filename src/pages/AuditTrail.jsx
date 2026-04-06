import { useState } from 'react'
import AppLayout from '../components/AppLayout'
import { getAuditLogs } from '../lib/data'
import { Shield, Download, Filter, Clock, CheckCircle, X, Edit2 } from 'lucide-react'

function formatDate(iso) {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const ACTION_STYLES = {
  accepted: 'bg-green-100 text-green-700',
  modified: 'bg-amber-100 text-amber-700',
  rejected: 'bg-red-100 text-red-700',
  pending: 'bg-gray-100 text-gray-500',
}

const SEV_COLORS = {
  EMERGENCY: 'bg-red-500',
  URGENT: 'bg-amber-500',
  ROUTINE: 'bg-green-500',
}

export default function AuditTrail() {
  const logs = getAuditLogs()
  const [filter, setFilter] = useState('All')

  const filtered = logs.filter(l =>
    filter === 'All' || l.severity === filter || l.doctorAction === filter.toLowerCase()
  )

  const handleExport = () => {
    const content = JSON.stringify(logs, null, 2)
    const blob = new Blob([content], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dental_ai_audit_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
  }

  return (
    <AppLayout>
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="bg-white border-b border-dental-border px-5 py-3 flex items-center">
          <div className="flex-1">
            <h1 className="text-sm font-bold text-dental-text flex items-center gap-2">
              <Shield size={15} className="text-dental-blue" /> Medico-Legal Audit Trail
            </h1>
            <p className="text-xs text-dental-text-secondary">Write-once log of all AI recommendations and doctor actions</p>
          </div>
          <button onClick={handleExport} className="btn-secondary text-xs py-1.5">
            <Download size={13} /> Export JSON
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white border-b border-dental-border px-5 py-2 flex gap-2">
          {['All', 'EMERGENCY', 'URGENT', 'ROUTINE', 'accepted', 'modified', 'rejected'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                filter === f ? 'bg-dental-blue text-white border-dental-blue' : 'text-dental-text-secondary border-dental-border hover:border-dental-blue'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {filtered.length === 0 ? (
            <div className="flex items-center justify-center h-full text-dental-text-secondary">
              <div className="text-center">
                <Shield size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No audit entries yet</p>
                <p className="text-xs mt-1">Entries are created automatically when you generate clinical pathways</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Header Row */}
              <div className="grid grid-cols-7 gap-3 px-4 py-2 text-[10px] font-bold text-dental-text-secondary uppercase tracking-wide">
                <span>Timestamp</span>
                <span>Case ID</span>
                <span>Severity</span>
                <span>Model Version</span>
                <span>Doctor Action</span>
                <span className="col-span-2">Details</span>
              </div>

              {filtered.map(log => (
                <div key={log.id} className="card px-4 py-3 grid grid-cols-7 gap-3 items-start animate-fade-in">
                  <div className="flex items-center gap-1.5 text-[10px] text-dental-text-secondary">
                    <Clock size={10} />
                    {formatDate(log.timestamp)}
                  </div>
                  <span className="text-[10px] font-mono text-dental-text-secondary truncate">{log.caseId || '—'}</span>
                  <div>
                    {log.severity && (
                      <div className="flex items-center gap-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${SEV_COLORS[log.severity] || 'bg-gray-400'}`} />
                        <span className="text-[10px] text-dental-text">{log.severity}</span>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-dental-text-secondary">{log.modelVersion}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full w-fit ${ACTION_STYLES[log.doctorAction] || ACTION_STYLES.pending}`}>
                    {log.doctorAction || 'pending'}
                  </span>
                  <div className="col-span-2 text-[10px] text-dental-text-secondary">
                    {log.input?.chiefComplaint || log.input?.caseId || 'System entry'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Footer */}
        <div className="bg-dental-surface border-t border-dental-border px-5 py-2">
          <p className="text-[10px] text-dental-text-secondary">
            All entries are write-once and cannot be edited or deleted. Exported as JSON for medico-legal proceedings.
            Total entries: <strong>{logs.length}</strong> · {filtered.length} shown
          </p>
        </div>
      </div>
    </AppLayout>
  )
}
