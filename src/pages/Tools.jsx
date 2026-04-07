import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion as Motion } from 'framer-motion'
import {
  Image, Pill, FileText, ClipboardList, Shield,
  ChevronRight, Stethoscope, ArrowUpRight,
  Activity, Search, Wrench,
} from 'lucide-react'
import AppLayout from '../components/AppLayout'
import PageTransition from '../components/PageTransition'
import { useAuth } from '../contexts/AuthContext'

const TOOLS = [
  {
    id: 'xray',
    path: '/tools/xray',
    icon: Image,
    color: 'text-primary bg-primary-50',
    title: 'X-ray Analyzer',
    description: 'Upload IOPA, OPG, or CBCT radiographs. AI annotations with structured findings, confidence scores, and urgency rating.',
    badge: 'Vision AI',
    badgeColor: 'badge-blue',
    roles: ['doctor', 'student'],
  },
  {
    id: 'drugs',
    path: '/tools/drugs',
    icon: Pill,
    color: 'text-success bg-green-50',
    title: 'Drug Reference',
    description: 'Complete dental pharmacology database. Drug interactions, dosage calculator, renal & hepatic adjustments, Indian brands.',
    badge: 'Pharmacology',
    badgeColor: 'badge-green',
    roles: ['doctor', 'student'],
  },
  {
    id: 'referral',
    path: '/tools/referral',
    icon: FileText,
    color: 'text-warning bg-amber-50',
    title: 'Referral Builder',
    description: 'AI-generated referral letters for Indian hospital OPDs. Includes clinical summary, urgency, and specialty requested.',
    badge: 'Document AI',
    badgeColor: 'badge-amber',
    roles: ['doctor'],
  },
  {
    id: 'treatment-plan',
    path: '/tools/treatment-plan',
    icon: ClipboardList,
    color: 'text-purple-600 bg-purple-50',
    title: 'Treatment Planner',
    description: 'Phased treatment planning with patient-friendly explanations. Generates visit estimates and maintenance protocols.',
    badge: 'Planning',
    badgeColor: 'badge-gray',
    roles: ['doctor'],
  },
  {
    id: 'clinical-pathway',
    path: '/tools/pathway',
    icon: Activity,
    color: 'text-danger bg-red-50',
    title: 'Clinical Pathway',
    description: '4-agent AI pipeline: triage → differentials → evidence → management. Full clinical decision support for any presentation.',
    badge: 'Multi-Agent',
    badgeColor: 'badge-red',
    roles: ['doctor'],
  },
  {
    id: 'audit',
    path: '/tools/audit',
    icon: Shield,
    color: 'text-gray-600 bg-gray-100',
    title: 'Audit Trail',
    description: 'Complete audit log of all AI-generated recommendations with doctor responses. Compliance and legal documentation.',
    badge: 'Compliance',
    badgeColor: 'badge-gray',
    roles: ['doctor'],
  },
]

export default function Tools() {
  const navigate = useNavigate()
  const { role } = useAuth()
  const [search, setSearch] = useState('')

  const visible = TOOLS.filter(t =>
    (!t.roles || t.roles.includes(role)) &&
    (t.title.toLowerCase().includes(search.toLowerCase()) ||
     t.description.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <AppLayout>
      <PageTransition>
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 bg-primary rounded-[8px] flex items-center justify-center">
                <Wrench size={16} className="text-white" />
              </div>
              <h1 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">
                Tools
              </h1>
            </div>
            <p className="text-sm text-text-muted-light dark:text-text-muted-dark">
              AI-powered clinical utilities to support your practice
            </p>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted-light dark:text-text-muted-dark" />
            <input
              className="input-field pl-9"
              placeholder="Search tools..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visible.map((tool, i) => {
              const Icon = tool.icon
              return (
                <Motion.button
                  key={tool.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.2 }}
                  onClick={() => navigate(tool.path)}
                  className="card text-left group hover:border-primary/30 transition-all duration-150 hover:shadow-card"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-[8px] flex items-center justify-center flex-shrink-0 ${tool.color}`}>
                      <Icon size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
                            {tool.title}
                          </h3>
                          <span className={`badge ${tool.badgeColor} text-2xs`}>{tool.badge}</span>
                        </div>
                        <ArrowUpRight
                          size={15}
                          className="text-text-muted-light dark:text-text-muted-dark group-hover:text-primary transition-colors flex-shrink-0"
                        />
                      </div>
                      <p className="text-xs text-text-muted-light dark:text-text-muted-dark leading-relaxed">
                        {tool.description}
                      </p>
                    </div>
                  </div>
                </Motion.button>
              )
            })}
          </div>

          {visible.length === 0 && (
            <div className="text-center py-16">
              <Wrench size={32} className="mx-auto text-text-muted-light dark:text-text-muted-dark mb-3 opacity-40" />
              <p className="text-sm text-text-muted-light dark:text-text-muted-dark">No tools match your search</p>
            </div>
          )}
        </div>
      </PageTransition>
    </AppLayout>
  )
}
