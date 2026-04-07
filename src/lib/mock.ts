import type {
  Appointment,
  AuditEvent,
  CaseStudy,
  Conversation,
  DrugItem,
  ExamQuestion,
  MetricCardData,
  PatientCase,
  ResearchPaper,
} from '../types'

export const demoMetrics: MetricCardData[] = [
  { label: 'Active patients', value: 18, helper: 'Fast local fallback data' },
  { label: 'Urgent cases', value: 4, helper: 'Needs same-day follow-up' },
  { label: 'AI drafts', value: 7, helper: 'Referral + treatment outputs' },
  { label: 'Study threads', value: 12, helper: 'Saved across roles' },
]

export const demoCases: PatientCase[] = [
  {
    id: 'case-1',
    patient_id: 'pat-1',
    doctor_id: 'doc-1',
    patient_name: 'Patient Demo User',
    age: 29,
    sex: 'Female',
    chief_complaint: 'Pain in lower right molar while chewing for 4 days',
    specialty: 'Endodontics',
    severity: 'URGENT',
    status: 'active',
    last_activity_at: new Date().toISOString(),
  },
  {
    id: 'case-2',
    patient_id: 'pat-2',
    doctor_id: 'doc-1',
    patient_name: 'Rahul Mehta',
    age: 34,
    sex: 'Male',
    chief_complaint: 'Severe toothache upper left, pain radiating to ear',
    specialty: 'Endodontics',
    severity: 'URGENT',
    status: 'active',
    last_activity_at: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
  },
  {
    id: 'case-3',
    patient_id: 'pat-3',
    doctor_id: 'doc-1',
    patient_name: 'Sunita Patel',
    age: 52,
    sex: 'Female',
    chief_complaint: 'Loose teeth, bleeding gums, halitosis',
    specialty: 'Periodontics',
    severity: 'ROUTINE',
    status: 'review',
    last_activity_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
]

export const demoAppointments: Appointment[] = [
  {
    id: 'appt-1',
    patient_id: 'pat-1',
    doctor_id: 'doc-1',
    appointment_date: new Date(Date.now() + 1000 * 60 * 60 * 4).toISOString(),
    duration_minutes: 30,
    type: 'Emergency consult',
    status: 'confirmed',
    notes: 'IOPA + sensibility testing',
  },
  {
    id: 'appt-2',
    patient_id: 'pat-3',
    doctor_id: 'doc-1',
    appointment_date: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    duration_minutes: 45,
    type: 'Periodontal review',
    status: 'scheduled',
    notes: 'Pocket depth reassessment',
  },
]

export const demoAudit: AuditEvent[] = [
  {
    id: 'audit-1',
    case_id: 'case-1',
    doctor_id: 'doc-1',
    event_type: 'triage',
    event_title: 'Urgent molar pain triage accepted',
    action_status: 'accepted',
    severity: 'URGENT',
    created_at: new Date().toISOString(),
  },
  {
    id: 'audit-2',
    case_id: 'case-3',
    doctor_id: 'doc-1',
    event_type: 'referral',
    event_title: 'Periodontal referral prepared',
    action_status: 'modified',
    severity: 'ROUTINE',
    created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
  },
]

export const demoConversations: Conversation[] = [
  {
    id: 'conv-1',
    title: 'Molar pain triage plan',
    mode: 'Practitioner',
    updated_at: new Date().toISOString(),
    messages: [
      {
        id: 'msg-1',
        role: 'assistant',
        content: 'Assess pulpal status, take an IOPA, and plan urgent pain relief followed by definitive endodontic treatment.',
      },
    ],
  },
  {
    id: 'conv-2',
    title: 'Vertucci classification revision',
    mode: 'Student',
    updated_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    messages: [
      {
        id: 'msg-2',
        role: 'assistant',
        content: 'Type I to VIII summary with common exam traps ready to review.',
      },
    ],
  },
]

export const demoDrugs: DrugItem[] = [
  {
    id: 'amoxicillin',
    genericName: 'Amoxicillin',
    brandNames: ['Novamox', 'Amoxil'],
    className: 'Aminopenicillin antibiotic',
    dentalDose: '500 mg TDS for 5 to 7 days',
    commonDentalUse: 'Odontogenic infection and prophylaxis in selected patients',
    contraindications: ['Penicillin allergy', 'Infectious mononucleosis'],
    sideEffects: ['Nausea', 'Diarrhoea', 'Rash'],
  },
  {
    id: 'metronidazole',
    genericName: 'Metronidazole',
    brandNames: ['Metrogyl', 'Flagyl'],
    className: 'Nitroimidazole antibiotic',
    dentalDose: '400 mg TDS for 5 to 7 days',
    commonDentalUse: 'Anaerobic infections and pericoronitis',
    contraindications: ['Alcohol use', 'First trimester pregnancy'],
    sideEffects: ['Metallic taste', 'Nausea', 'Headache'],
  },
  {
    id: 'ibuprofen',
    genericName: 'Ibuprofen',
    brandNames: ['Brufen', 'Ibugesic'],
    className: 'NSAID',
    dentalDose: '400 mg TDS after food',
    commonDentalUse: 'Acute dental pain and post-operative inflammation',
    contraindications: ['Active peptic ulcer', 'NSAID allergy'],
    sideEffects: ['Gastric irritation', 'Fluid retention'],
  },
]

export const demoVideos = [
  {
    id: 'video-1',
    title: 'Rotary endodontics full protocol',
    channel: 'Dentsply Academy',
    specialty: 'Endodontics',
    duration: '24:31',
    views: '128K',
  },
  {
    id: 'video-2',
    title: 'Periodontal staging and grading in clinic',
    channel: 'Perio Mastery',
    specialty: 'Periodontics',
    duration: '18:45',
    views: '89K',
  },
]

export const fallbackResearch: ResearchPaper[] = [
  {
    id: 'paper-1',
    title: 'AI-assisted caries detection on bitewing radiographs',
    authors: 'Sharma et al.',
    journal: 'Dentomaxillofacial Radiology',
    year: '2024',
    abstract: 'AI models continue to improve proximal caries detection and can support faster chairside review when paired with clinician oversight.',
    link: 'https://pubmed.ncbi.nlm.nih.gov/',
  },
  {
    id: 'paper-2',
    title: 'Single-visit versus multi-visit endodontic treatment outcomes',
    authors: 'Patel et al.',
    journal: 'Journal of Endodontics',
    year: '2024',
    abstract: 'Outcome differences remain small in well-selected cases, with case selection and asepsis still dominating success.',
    link: 'https://pubmed.ncbi.nlm.nih.gov/',
  },
]

export const demoCaseStudies: CaseStudy[] = [
  {
    id: 'case-study-1',
    title: 'Managing acute symptomatic irreversible pulpitis in a diabetic patient',
    authorName: 'Dr. Demo User',
    authorId: 'doc-1',
    specialty: 'Endodontics',
    summary: 'Chairside pain control, antibiotic stewardship, and staged treatment planning for a medically complex patient.',
    content: '<h2>Background</h2><p>This case focused on rapid pain relief with tight medical history review.</p><h2>Approach</h2><p>IOPA, vitality testing, occlusal relief, and definitive endodontic sequencing were used.</p>',
    views: 128,
    helpfulCount: 17,
    publishedAt: new Date().toISOString(),
  },
]

export const examQuestions: ExamQuestion[] = [
  {
    id: 'q-1',
    prompt: 'Which tooth most commonly shows two canals that rejoin?',
    options: ['Mandibular first premolar', 'Maxillary canine', 'Mandibular central incisor', 'Maxillary first molar'],
    answer: 'Mandibular first premolar',
    explanation: 'It is notorious for variable anatomy and exam questions often test the possibility of split canals that rejoin.',
  },
  {
    id: 'q-2',
    prompt: 'In gingival health, sulcus depth is usually:',
    options: ['1 to 3 mm', '4 to 5 mm', '6 to 7 mm', 'Above 8 mm'],
    answer: '1 to 3 mm',
    explanation: 'Depths above 3 mm need clinical correlation for pocketing and attachment loss.',
  },
]
