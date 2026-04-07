import {
  DENTAL_DRUGS,
  DUMMY_USER,
  MOCK_ARTICLES,
  MOCK_CASES,
  getAuditLogs,
  logAuditEntry,
} from './data'
import { isSupabaseConfigured, supabase } from './supabase'

const STORAGE_KEYS = {
  referrals: 'dental_ai_referrals',
  treatmentPlans: 'dental_ai_treatment_plans',
  xrayReports: 'dental_ai_xray_reports',
  aiConversations: 'dental_ai_conversations',
}

function nowIso() {
  return new Date().toISOString()
}

function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

function buildDemoCases() {
  return MOCK_CASES.map((item, index) => ({
    id: item.id,
    patient_id: `patient-${String(index + 1).padStart(3, '0')}`,
    patient_name: item.patientName,
    age: item.age,
    sex: item.sex,
    chief_complaint: item.chiefComplaint,
    severity: item.severity,
    status: item.status,
    specialty: ['Endodontics', 'Periodontics', 'Oral Medicine', 'General Dentistry'][index % 4],
    last_activity_at: item.timestamp,
    created_at: item.timestamp,
  }))
}

function buildDemoAuditEvents() {
  const existing = getAuditLogs()
  if (existing.length > 0) return existing
  return [
    {
      id: 'audit-seed-001',
      timestamp: nowIso(),
      caseId: 'case-001',
      severity: 'URGENT',
      modelVersion: 'gemini-1.5-flash',
      doctorAction: 'accepted',
      input: { chiefComplaint: 'Severe toothache upper left, pain radiating to ear' },
    },
    {
      id: 'audit-seed-002',
      timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
      caseId: 'case-003',
      severity: 'URGENT',
      modelVersion: 'gemini-1.5-flash',
      doctorAction: 'modified',
      input: { chiefComplaint: 'Swelling lower jaw, difficulty opening mouth, fever' },
    },
  ]
}

function buildDemoDashboard(profile) {
  const cases = buildDemoCases()
  const audit = buildDemoAuditEvents()
  const conversations = getConversationStore(profile)

  return {
    metrics: [
      { label: 'Active patients', value: cases.length, helper: 'Clinic roster synced' },
      { label: 'Urgent cases', value: cases.filter(item => item.severity === 'URGENT').length, helper: 'Needs same-day review' },
      { label: 'AI drafts saved', value: readStorage(STORAGE_KEYS.referrals, []).length + readStorage(STORAGE_KEYS.treatmentPlans, []).length, helper: 'Referral + treatment outputs' },
      { label: 'Chats this week', value: conversations.length, helper: 'Persisted in workspace' },
    ],
    recentCases: cases.slice(0, 5),
    recentActivity: audit.slice(0, 5).map(item => ({
      id: item.id,
      title: item.input?.chiefComplaint || 'Clinical action logged',
      status: item.doctorAction || 'pending',
      severity: item.severity || 'ROUTINE',
      timestamp: item.timestamp,
    })),
    conversations: conversations.slice(0, 5),
  }
}

function normalizeConversationTitle(messages, fallback = 'New conversation') {
  const firstUserMessage = messages.find(item => item.role === 'user' && item.content?.trim())
  if (!firstUserMessage) return fallback
  return firstUserMessage.content.trim().slice(0, 60)
}

function getConversationStore(profile) {
  const seeded = [
    {
      id: 'conv-seed-001',
      title: "Ludwig's angina management",
      mode: 'Practitioner',
      updated_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      messages: [
        { id: 1, role: 'assistant', content: 'Structured airway-first management plan prepared for emergency review.' },
      ],
    },
    {
      id: 'conv-seed-002',
      title: 'Vertucci classification explained',
      mode: 'Student',
      updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      messages: [
        { id: 2, role: 'assistant', content: 'Classification summary ready with exam-focused mnemonics.' },
      ],
    },
  ]
  const items = readStorage(STORAGE_KEYS.aiConversations, seeded)
  const roleLabel = profile?.role === 'student' ? 'Student' : profile?.role === 'patient' ? 'Patient' : 'Practitioner'
  return items.map(item => ({ ...item, mode: item.mode || roleLabel }))
}

function setConversationStore(items) {
  writeStorage(STORAGE_KEYS.aiConversations, items)
}

async function safeSelect(table, queryBuilder, fallback) {
  if (!isSupabaseConfigured || !supabase) return fallback
  try {
    const query = queryBuilder(supabase.from(table))
    const { data, error } = await query
    if (error || !data) return fallback
    return data
  } catch {
    return fallback
  }
}

export async function getDashboardData(profile) {
  const fallback = buildDemoDashboard(profile)
  if (!isSupabaseConfigured || !supabase || !profile?.id) return fallback

  try {
    const [cases, audit, conversations] = await Promise.all([
      safeSelect('patient_cases', query => query.select('*').order('last_activity_at', { ascending: false }).limit(5), fallback.recentCases),
      safeSelect('audit_events', query => query.select('*').order('created_at', { ascending: false }).limit(5), fallback.recentActivity),
      safeSelect('ai_conversations', query => query.select('*').order('updated_at', { ascending: false }).limit(5), fallback.conversations),
    ])

    const recentActivity = audit.map(item => ({
      id: item.id,
      title: item.event_title || item.event_type || 'Clinical action logged',
      status: item.action_status || item.doctor_action || 'pending',
      severity: item.severity || 'ROUTINE',
      timestamp: item.created_at || item.timestamp || nowIso(),
    }))

    return {
      metrics: [
        { label: 'Active patients', value: cases.length, helper: 'Supabase live dataset' },
        { label: 'Urgent cases', value: cases.filter(item => item.severity === 'URGENT').length, helper: 'Needs same-day review' },
        { label: 'AI drafts saved', value: readStorage(STORAGE_KEYS.referrals, []).length + readStorage(STORAGE_KEYS.treatmentPlans, []).length, helper: 'Saved locally if table is empty' },
        { label: 'Chats this week', value: conversations.length, helper: 'Conversation headers persisted' },
      ],
      recentCases: cases,
      recentActivity,
      conversations,
    }
  } catch {
    return fallback
  }
}

export async function getPatientCases() {
  const fallback = buildDemoCases()
  const cases = await safeSelect(
    'patient_cases',
    query => query.select('*').order('last_activity_at', { ascending: false }),
    fallback
  )
  return cases.map(item => ({
    ...item,
    patientName: item.patientName || item.patient_name,
    chiefComplaint: item.chiefComplaint || item.chief_complaint,
    timestamp: item.timestamp || item.last_activity_at || item.created_at,
    sex: item.sex || item.gender,
  }))
}

export async function getDrugCatalog() {
  const fallback = DENTAL_DRUGS
  return safeSelect('drug_catalog', query => query.select('*').order('generic_name'), fallback)
}

export async function getDiscoverArticles() {
  const fallback = MOCK_ARTICLES
  const articles = await safeSelect('knowledge_base', query => query.select('*').eq('content_type', 'article').order('created_at', { ascending: false }), fallback)
  return articles.map(item => ({
    ...item,
    title: item.title || item.metadata?.title || item.content?.slice(0, 80) || 'Knowledge base article',
    summary: item.summary || item.metadata?.summary || item.content,
    tags: item.tags || item.metadata?.tags || [],
    type: item.type || item.metadata?.type || 'Research',
    journal: item.journal || item.metadata?.journal || 'Dental.ai Knowledge Base',
    date: item.date || item.metadata?.date || 'Current',
    doi: item.doi || item.metadata?.doi || '',
  }))
}

export async function getAuditEvents() {
  const fallback = buildDemoAuditEvents()
  const events = await safeSelect('audit_events', query => query.select('*').order('created_at', { ascending: false }), fallback)
  return events.map(item => ({
    ...item,
    timestamp: item.timestamp || item.created_at,
    caseId: item.caseId || item.case_id,
    doctorAction: item.doctorAction || item.doctor_action || item.action_status,
    modelVersion: item.modelVersion || item.model_version || 'gemini-1.5-flash',
  }))
}

export function saveGeneratedReferral(payload) {
  const next = [{ id: `ref-${Date.now()}`, created_at: nowIso(), ...payload }, ...readStorage(STORAGE_KEYS.referrals, [])]
  writeStorage(STORAGE_KEYS.referrals, next)
  logAuditEntry({
    caseId: payload.caseId || null,
    severity: payload.severity || 'ROUTINE',
    doctorAction: 'accepted',
    input: { chiefComplaint: payload.chiefComplaint || `Referral generated for ${payload.patientName}` },
  })
  return next[0]
}

export function saveTreatmentPlan(payload) {
  const next = [{ id: `plan-${Date.now()}`, created_at: nowIso(), ...payload }, ...readStorage(STORAGE_KEYS.treatmentPlans, [])]
  writeStorage(STORAGE_KEYS.treatmentPlans, next)
  logAuditEntry({
    caseId: payload.caseId || null,
    severity: payload.severity || 'ROUTINE',
    doctorAction: 'modified',
    input: { chiefComplaint: payload.chiefComplaint || `Treatment plan drafted for ${payload.patientName}` },
  })
  return next[0]
}

export function saveXrayReport(payload) {
  const next = [{ id: `xray-${Date.now()}`, created_at: nowIso(), ...payload }, ...readStorage(STORAGE_KEYS.xrayReports, [])]
  writeStorage(STORAGE_KEYS.xrayReports, next)
  logAuditEntry({
    caseId: payload.caseId || null,
    severity: payload.urgency || 'ROUTINE',
    doctorAction: 'accepted',
    input: { chiefComplaint: payload.imagingType || 'Radiograph analysis completed' },
  })
  return next[0]
}

export function getSavedReferrals() {
  return readStorage(STORAGE_KEYS.referrals, [])
}

export function getSavedTreatmentPlans() {
  return readStorage(STORAGE_KEYS.treatmentPlans, [])
}

export function getSavedXrayReports() {
  return readStorage(STORAGE_KEYS.xrayReports, [])
}

export function loadChatWorkspace(profile) {
  return getConversationStore(profile)
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    .map(item => ({
      ...item,
      time: new Date(item.updated_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    }))
}

export function persistChatWorkspace({ conversationId, mode, messages }) {
  const all = readStorage(STORAGE_KEYS.aiConversations, [])
  const updated = [
    {
      id: conversationId,
      title: normalizeConversationTitle(messages),
      mode,
      updated_at: nowIso(),
      messages,
    },
    ...all.filter(item => item.id !== conversationId),
  ]
  setConversationStore(updated)
  return updated
}
