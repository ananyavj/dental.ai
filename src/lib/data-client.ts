import { demoAppointments, demoAudit, demoCaseStudies, demoCases, demoConversations, demoDrugs, demoMetrics, demoVideos } from './mock'
import { readStorage, stripHtml, withTimeout, writeStorage } from './utils'
import { isSupabaseConfigured, supabase } from './supabase'
import type {
  Appointment,
  AuditEvent,
  CaseStudy,
  Conversation,
  ConversationMessage,
  DrugItem,
  MetricCardData,
  PatientCase,
  Profile,
  XrayResult,
} from '../types'

const CASE_STUDY_DRAFTS = 'dental-ai-case-studies'
const CONVERSATION_DRAFTS = 'dental-ai-conversations'
const APPOINTMENT_DRAFTS = 'dental-ai-appointments'

function parseLocation(notes?: string | null) {
  if (!notes) return null
  const match = notes.match(/Location:\s*(.+)/i)
  return match?.[1]?.split('\n')[0]?.trim() || null
}

async function queryOrFallback<T>(loader: () => Promise<T>, fallback: T) {
  if (!supabase || !isSupabaseConfigured) return fallback
  try {
    return await withTimeout(loader(), fallback)
  } catch {
    return fallback
  }
}

export async function getDashboardData(profile?: Profile | null): Promise<{
  metrics: MetricCardData[]
  cases: PatientCase[]
  appointments: Appointment[]
  activity: AuditEvent[]
  conversations: Conversation[]
}> {
  if (!profile) {
    return {
      metrics: demoMetrics,
      cases: demoCases,
      appointments: demoAppointments,
      activity: demoAudit,
      conversations: demoConversations,
    }
  }

  const cases = await queryOrFallback(
    async () => {
      const { data } = await supabase!.from('patient_cases').select('*').order('last_activity_at', { ascending: false }).limit(6)
      return (data as PatientCase[]) || demoCases
    },
    demoCases
  )

  const appointments = await queryOrFallback(
    async () => {
      const { data } = await supabase!
        .from('appointments')
        .select('*, patients(full_name, contact_number)')
        .order('appointment_date', { ascending: true })
        .limit(6)
      return ((data || []).map((item: Record<string, unknown>) => ({
        id: String(item.id),
        patient_id: String(item.patient_id),
        doctor_id: String(item.doctor_id),
        appointment_date: String(item.appointment_date),
        duration_minutes: Number(item.duration_minutes || 30),
        type: String(item.type || 'Consultation'),
        status: String(item.status || 'scheduled'),
        notes: (item.notes as string | null) || null,
        clinic_location: parseLocation(item.notes as string | null),
        patient_name: (item.patients as { full_name?: string } | null)?.full_name || 'Patient',
        contact_number: (item.patients as { contact_number?: string } | null)?.contact_number || null,
      })) as Appointment[]) || demoAppointments
    },
    demoAppointments
  )

  const activity = await queryOrFallback(
    async () => {
      const { data } = await supabase!.from('audit_events').select('*').order('created_at', { ascending: false }).limit(5)
      return (data as AuditEvent[]) || demoAudit
    },
    demoAudit
  )

  const conversations = await getChatConversations(profile)

  return {
    metrics: [
      { label: 'Active patients', value: cases.length, helper: 'From your clinic workspace' },
      { label: 'Urgent cases', value: cases.filter(item => item.severity === 'URGENT').length, helper: 'Fast same-day prioritization' },
      { label: 'Saved drafts', value: activity.length, helper: 'Referrals, treatment plans, and audit events' },
      { label: 'Conversations', value: conversations.length, helper: 'Practitioner, student, and patient modes' },
    ],
    cases,
    appointments,
    activity,
    conversations,
  }
}

export async function getPatientCases() {
  return queryOrFallback(
    async () => {
      const { data } = await supabase!.from('patient_cases').select('*').order('last_activity_at', { ascending: false })
      return (data as PatientCase[]) || demoCases
    },
    demoCases
  )
}

export async function getAppointments() {
  const localDrafts = readStorage<Appointment[]>(APPOINTMENT_DRAFTS, [])
  return queryOrFallback(
    async () => {
      const { data } = await supabase!
        .from('appointments')
        .select('*, patients(full_name, contact_number)')
        .order('appointment_date', { ascending: true })
      const rows = (data || []).map((item: Record<string, unknown>) => ({
        id: String(item.id),
        patient_id: String(item.patient_id),
        doctor_id: String(item.doctor_id),
        appointment_date: String(item.appointment_date),
        duration_minutes: Number(item.duration_minutes || 30),
        type: String(item.type || 'Consultation'),
        status: String(item.status || 'scheduled'),
        notes: (item.notes as string | null) || null,
        clinic_location: parseLocation(item.notes as string | null),
        patient_name: (item.patients as { full_name?: string } | null)?.full_name || 'Patient',
        contact_number: (item.patients as { contact_number?: string } | null)?.contact_number || null,
      })) as Appointment[]
      return rows.length ? [...rows, ...localDrafts.filter(local => !rows.some(remote => remote.id === local.id))] : [...localDrafts, ...demoAppointments]
    },
    localDrafts.length ? [...localDrafts, ...demoAppointments] : demoAppointments
  )
}

export async function saveTriage(profile: Profile, payload: {
  patientId: string
  caseId?: string
  note?: string
  triage: { severity: string; triageReason: string; redFlags: string[]; referralRequired: boolean }
}) {
  if (!supabase) return
  await supabase.from('triage_sessions').insert({
    patient_id: payload.patientId,
    doctor_id: profile.id,
    triage_level: payload.triage.severity,
    confidence_score: 0.91,
    reasoning: payload.triage.triageReason,
    red_flags: payload.triage.redFlags,
    ai_recommendation: { referralRequired: payload.triage.referralRequired },
    needs_doctor_review: false,
  })
  await appendAudit(profile, {
    event_type: 'triage',
    event_title: `${payload.triage.severity} triage saved`,
    severity: payload.triage.severity as 'EMERGENCY' | 'URGENT' | 'ROUTINE',
  })
  if (payload.caseId && payload.note) {
    await supabase.from('clinical_notes').insert({
      case_id: payload.caseId,
      author_id: profile.id,
      note_type: 'triage',
      content: payload.note,
    })
  }
}

export async function getDrugCatalog() {
  return queryOrFallback(
    async () => {
      const { data } = await supabase!.from('drug_catalog').select('*').order('generic_name')
      return (
        (data || []).map(item => ({
          id: item.id,
          genericName: item.generic_name,
          brandNames: item.brand_names || [],
          className: item.drug_class,
          dentalDose: item.dental_dose,
          commonDentalUse: item.common_dental_use,
          contraindications: item.contraindications || [],
          sideEffects: item.side_effects || [],
        })) as DrugItem[]
      )
    },
    demoDrugs
  )
}

export async function getAuditEvents() {
  return queryOrFallback(
    async () => {
      const { data } = await supabase!.from('audit_events').select('*').order('created_at', { ascending: false })
      return (data as AuditEvent[]) || demoAudit
    },
    demoAudit
  )
}

export async function appendAudit(profile: Profile, event: {
  event_type: string
  event_title: string
  severity: 'EMERGENCY' | 'URGENT' | 'ROUTINE'
  case_id?: string
}) {
  if (!supabase) return
  await supabase.from('audit_events').insert({
    doctor_id: profile.id,
    case_id: event.case_id || null,
    event_type: event.event_type,
    event_title: event.event_title,
    action_status: 'accepted',
    severity: event.severity,
    event_payload: { source: 'vite-client' },
  })
}

export async function getPatientHistory(patientId?: string | null, caseId?: string | null) {
  const appointments = await getAppointments()
  const events = await getAuditEvents()
  return {
    appointments: appointments.filter(item => !patientId || item.patient_id === patientId),
    events: events.filter(item => !caseId || item.case_id === caseId),
  }
}

export async function scheduleAppointmentFromTriage(profile: Profile, payload: {
  patientId: string
  patientName: string
  appointmentDate: string
  appointmentType: string
  durationMinutes: number
  clinicLocation: string
  complaint: string
  severity: 'EMERGENCY' | 'URGENT' | 'ROUTINE'
}) {
  const note = `Location: ${payload.clinicLocation}\nComplaint: ${payload.complaint}\nScheduled from AI triage`
  const draft: Appointment = {
    id: crypto.randomUUID(),
    patient_id: payload.patientId,
    doctor_id: profile.id,
    patient_name: payload.patientName,
    appointment_date: payload.appointmentDate,
    duration_minutes: payload.durationMinutes,
    type: payload.appointmentType,
    status: payload.severity === 'EMERGENCY' ? 'confirmed' : 'scheduled',
    clinic_location: payload.clinicLocation,
    notes: note,
  }

  if (!supabase || !isSupabaseConfigured) {
    const drafts = readStorage<Appointment[]>(APPOINTMENT_DRAFTS, demoAppointments)
    writeStorage(APPOINTMENT_DRAFTS, [draft, ...drafts])
    return draft
  }

  const { data, error } = await supabase
    .from('appointments')
    .insert({
      patient_id: payload.patientId,
      doctor_id: profile.id,
      appointment_date: payload.appointmentDate,
      duration_minutes: payload.durationMinutes,
      type: payload.appointmentType,
      status: payload.severity === 'EMERGENCY' ? 'confirmed' : 'scheduled',
      notes: note,
    })
    .select()
    .single()

  if (error) {
    const drafts = readStorage<Appointment[]>(APPOINTMENT_DRAFTS, demoAppointments)
    writeStorage(APPOINTMENT_DRAFTS, [draft, ...drafts])
    return draft
  }

  await appendAudit(profile, {
    event_type: 'appointment',
    event_title: `${payload.appointmentType} scheduled for ${payload.patientName}`,
    severity: payload.severity,
  })

  return {
    ...draft,
    id: String(data.id),
  }
}

export async function getChatConversations(profile: Profile) {
  const localDrafts = readStorage<Conversation[]>(CONVERSATION_DRAFTS, [])
  const fallback =
    localDrafts.length
      ? localDrafts
      : profile.role === 'student'
        ? demoConversations.filter(item => item.mode === 'Student')
        : profile.role === 'patient'
          ? demoConversations.filter(item => item.mode !== 'Student')
          : demoConversations

  return queryOrFallback(
    async () => {
      const { data } = await supabase!
        .from('ai_conversations')
        .select('*, ai_messages(*)')
        .eq('doctor_id', profile.id)
        .order('updated_at', { ascending: false })
      const rows = (data || []).map(item => ({
        id: item.id,
        title: item.title,
        mode: item.mode,
        doctor_id: item.doctor_id,
        patient_id: item.patient_id,
        updated_at: item.updated_at,
        messages: (item.ai_messages || []).map((message: Record<string, unknown>) => ({
          id: String(message.id),
          role: message.role as 'user' | 'assistant',
          content: String(message.content),
          created_at: message.created_at as string,
        })),
      })) as Conversation[]
      return rows.length ? rows : fallback
    },
    fallback
  )
}

export async function upsertConversation(profile: Profile, conversation: Conversation, messages: ConversationMessage[]) {
  if (!supabase || !isSupabaseConfigured) {
    const drafts = readStorage<Conversation[]>(CONVERSATION_DRAFTS, demoConversations)
    writeStorage(CONVERSATION_DRAFTS, [
      { ...conversation, messages, updated_at: new Date().toISOString() },
      ...drafts.filter(item => item.id !== conversation.id),
    ])
    return
  }

  const { error } = await supabase.from('ai_conversations').upsert({
    id: conversation.id,
    doctor_id: profile.id,
    patient_id: conversation.patient_id || null,
    title: conversation.title,
    mode: conversation.mode,
    updated_at: new Date().toISOString(),
  })

  if (error) return

  await supabase.from('ai_messages').delete().eq('conversation_id', conversation.id)
  await supabase.from('ai_messages').insert(
    messages.map(item => ({
      id: item.id,
      conversation_id: conversation.id,
      role: item.role,
      content: item.content,
    }))
  )
}

export async function getCommunityCaseStudies() {
  return queryOrFallback(
    async () => {
      const { data } = await supabase!.from('knowledge_base').select('*').contains('metadata', { content_type: 'case_study' })
      const studies = (data || []).map(item => {
        const metadata = (item.metadata || {}) as Record<string, unknown>
        return {
          id: item.id,
          title: String(metadata.title || 'Untitled case study'),
          authorName: String(metadata.author_name || 'Dental.ai Doctor'),
          authorId: String(metadata.author_id || ''),
          authorRole: String(metadata.author_role || 'doctor') as 'doctor' | 'student' | 'patient' | 'admin' | 'guest',
          specialty: String(metadata.specialty || 'General Dentistry'),
          summary: String(metadata.summary || stripHtml(item.content).slice(0, 180)),
          content: String(item.content || ''),
          views: Number(metadata.views || 0),
          helpfulCount: Number(metadata.helpful_count || 0),
          publishedAt: String(metadata.published_at || new Date().toISOString()),
          contentType: String(metadata.content_type || 'case_study') as 'case_study' | 'study_guide' | 'workflow',
          coverImage: String(metadata.cover_image || ''),
          readTime: String(metadata.read_time || '5 min read'),
        } satisfies CaseStudy
      })
      const localStudies = readStorage<CaseStudy[]>(CASE_STUDY_DRAFTS, [])
      const merged = [...localStudies, ...studies, ...demoCaseStudies]
      return merged.length ? merged.sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt)) : demoCaseStudies
    },
    readStorage<CaseStudy[]>(CASE_STUDY_DRAFTS, demoCaseStudies)
  )
}

export async function getCaseStudyById(id: string) {
  const studies = await getCommunityCaseStudies()
  return studies.find(item => item.id === id) ?? null
}

export async function publishCaseStudy(profile: Profile, study: Omit<CaseStudy, 'id' | 'authorName' | 'authorId' | 'publishedAt' | 'views' | 'helpfulCount'>) {
  const draft: CaseStudy = {
    id: crypto.randomUUID(),
    title: study.title,
    authorName: profile.full_name,
    authorId: profile.id,
    authorRole: profile.role,
    specialty: study.specialty,
    summary: study.summary,
    content: study.content,
    views: 0,
    helpfulCount: 0,
    publishedAt: new Date().toISOString(),
    contentType: 'case_study',
    readTime: '5 min read',
  }

  if (!supabase || !isSupabaseConfigured) {
    const current = readStorage<CaseStudy[]>(CASE_STUDY_DRAFTS, demoCaseStudies)
    writeStorage(CASE_STUDY_DRAFTS, [draft, ...current.filter(item => item.id !== draft.id)])
    return
  }

  const { error } = await supabase.from('knowledge_base').insert({
    content: study.content,
    metadata: {
      content_type: 'case_study',
      title: study.title,
      specialty: study.specialty,
      summary: study.summary,
      author_name: profile.full_name,
      author_id: profile.id,
      author_role: profile.role,
      published_at: new Date().toISOString(),
      views: 0,
      helpful_count: 0,
      read_time: '5 min read',
    },
  })
  if (error) {
    const current = readStorage<CaseStudy[]>(CASE_STUDY_DRAFTS, demoCaseStudies)
    writeStorage(CASE_STUDY_DRAFTS, [draft, ...current.filter(item => item.id !== draft.id)])
    return
  }
  await appendAudit(profile, {
    event_type: 'case_study',
    event_title: `Published case study: ${study.title}`,
    severity: 'ROUTINE',
  })
}

export async function saveReferral(profile: Profile, payload: { caseId?: string; patientName: string; specialty: string; subject: string; letter: string }) {
  if (!supabase) return
  await supabase.from('referrals').insert({
    case_id: payload.caseId || null,
    doctor_id: profile.id,
    patient_name: payload.patientName,
    specialty: payload.specialty,
    subject: payload.subject,
    letter: payload.letter,
  })
  await appendAudit(profile, { event_type: 'referral', event_title: `Saved referral for ${payload.patientName}`, severity: 'ROUTINE' })
}

export async function saveTreatmentPlan(profile: Profile, payload: { caseId?: string; patientName: string; urgency: string; plan: unknown }) {
  if (!supabase) return
  await supabase.from('treatment_plans').insert({
    case_id: payload.caseId || null,
    doctor_id: profile.id,
    patient_name: payload.patientName,
    urgency: payload.urgency,
    plan_json: payload.plan,
  })
  await appendAudit(profile, { event_type: 'treatment_plan', event_title: `Saved treatment plan for ${payload.patientName}`, severity: 'ROUTINE' })
}

export async function saveXrayReport(profile: Profile, payload: { caseId?: string; fileName: string; imagingType: string; urgency: string; report: XrayResult | unknown }) {
  if (!supabase) return
  await supabase.from('xray_reports').insert({
    case_id: payload.caseId || null,
    doctor_id: profile.id,
    file_name: payload.fileName,
    imaging_type: payload.imagingType,
    urgency: payload.urgency,
    report_json: payload.report,
  })
  await appendAudit(profile, { event_type: 'xray', event_title: `Saved imaging report: ${payload.fileName}`, severity: 'URGENT' })
}

export async function getVideos() {
  return demoVideos
}
