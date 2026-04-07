import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  Bot,
  ClipboardCheck,
  MessageSquare,
  Sparkles,
  Stethoscope,
  Users,
} from 'lucide-react'
import AppLayout from '../components/AppLayout'
import PageTransition from '../components/PageTransition'
import { useAuth } from '../contexts/AuthContext'
import { getDashboardData } from '../lib/appData'

function formatDateTime(value) {
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function MetricCard({ item }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
      <p className="mt-3 text-3xl font-semibold text-slate-900">{item.value}</p>
      <p className="mt-2 text-sm text-slate-600">{item.helper}</p>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [data, setData] = useState({ metrics: [], recentCases: [], recentActivity: [], conversations: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    getDashboardData(profile).then(result => {
      if (!mounted) return
      setData(result)
      setLoading(false)
    })
    return () => {
      mounted = false
    }
  }, [profile])

  return (
    <AppLayout>
      <PageTransition>
        <div className="min-h-full bg-slate-50 px-4 py-5 md:px-8">
          <div className="mx-auto max-w-7xl space-y-8">
            <section className="rounded-3xl bg-[#0f172a] px-6 py-8 text-white shadow-[0_20px_60px_rgba(15,23,42,0.25)] md:px-8">
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Dental.ai workspace</p>
              <h1 className="mt-3 text-3xl font-semibold md:text-5xl">
                Clinical command center for {profile?.full_name?.split(' ')[0] || 'your team'}
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300 md:text-base">
                One place for patient flow, AI-assisted drafts, drug guidance, imaging review, and audit-ready activity.
              </p>

              <div className="mt-6 grid gap-3 md:grid-cols-3">
                <button onClick={() => navigate('/chat')} className="rounded-2xl bg-orange-500 px-4 py-4 text-left text-sm font-medium text-white">
                  <MessageSquare className="mb-3" size={18} />
                  Open AI chat
                </button>
                <button onClick={() => navigate('/patients')} className="rounded-2xl border border-slate-700 bg-slate-800 px-4 py-4 text-left text-sm font-medium text-white">
                  <Users className="mb-3" size={18} />
                  Patient directory
                </button>
                <button onClick={() => navigate('/tools/xray')} className="rounded-2xl border border-slate-700 bg-slate-800 px-4 py-4 text-left text-sm font-medium text-white">
                  <Sparkles className="mb-3" size={18} />
                  Analyze imaging
                </button>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {(loading
                ? Array.from({ length: 4 }, (_, index) => ({ label: 'Loading', value: '...', helper: `Preparing panel ${index + 1}` }))
                : data.metrics
              ).map(item => (
                <MetricCard key={item.label + item.helper} item={item} />
              ))}
            </section>

            <section className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Recent cases</p>
                    <h2 className="mt-1 text-xl font-semibold text-slate-900">Priority patient flow</h2>
                  </div>
                  <button onClick={() => navigate('/patients')} className="btn-secondary text-xs">
                    View all <ArrowRight size={13} />
                  </button>
                </div>

                <div className="space-y-3">
                  {data.recentCases.length === 0 ? (
                    <div className="rounded-2xl bg-slate-50 px-4 py-6 text-sm text-slate-500">
                      No patient cases available yet.
                    </div>
                  ) : (
                    data.recentCases.map(item => (
                      <button
                        key={item.id}
                        onClick={() => navigate('/patients')}
                        className="flex w-full items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left"
                      >
                        <div className={`mt-1 h-3 w-3 rounded-full ${
                          item.severity === 'EMERGENCY' ? 'bg-rose-500' :
                          item.severity === 'URGENT' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-slate-900">{item.patient_name || item.patientName}</p>
                            <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-white">
                              {item.severity}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-slate-600">{item.chief_complaint || item.chiefComplaint}</p>
                          <p className="mt-2 text-xs text-slate-500">
                            {item.specialty || 'General Dentistry'} · {formatDateTime(item.last_activity_at || item.timestamp)}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-2xl bg-slate-900 p-3 text-white"><Activity size={18} /></div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Live activity</p>
                      <h2 className="text-lg font-semibold text-slate-900">Audit-ready updates</h2>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {data.recentActivity.length === 0 ? (
                      <div className="rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500">
                        No activity yet.
                      </div>
                    ) : (
                      data.recentActivity.map(item => (
                        <div key={item.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-medium text-slate-900">{item.title}</p>
                            <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{item.status}</span>
                          </div>
                          <p className="mt-2 text-xs text-slate-500">{item.severity} · {formatDateTime(item.timestamp)}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-2xl bg-orange-500 p-3 text-white"><Bot size={18} /></div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Conversation memory</p>
                      <h2 className="text-lg font-semibold text-slate-900">Saved AI threads</h2>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {data.conversations.length === 0 ? (
                      <div className="rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500">
                        No saved conversations yet.
                      </div>
                    ) : (
                      data.conversations.map(item => (
                        <div key={item.id} className="rounded-2xl border border-slate-200 px-4 py-3">
                          <p className="text-sm font-medium text-slate-900">{item.title}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {item.mode} · {formatDateTime(item.updated_at || item.created_at || new Date().toISOString())}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-3">
              {[
                { icon: Stethoscope, title: 'Clinical pathways', text: 'Use the chatbot and treatment tools to draft next-step plans with documented context.', to: '/chat' },
                { icon: ClipboardCheck, title: 'Referral workflows', text: 'Generate referral letters and treatment summaries, then keep them searchable.', to: '/tools/referral' },
                { icon: Sparkles, title: 'Research + evidence', text: 'Keep articles, drug references, and findings in one consistent workspace.', to: '/discover' },
              ].map(card => (
                <button key={card.title} onClick={() => navigate(card.to)} className="rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm">
                  <card.icon size={18} className="text-orange-500" />
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">{card.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{card.text}</p>
                </button>
              ))}
            </section>
          </div>
        </div>
      </PageTransition>
    </AppLayout>
  )
}
