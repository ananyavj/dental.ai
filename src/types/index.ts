export type Role = "doctor" | "student" | "patient" | "admin";

export type ChatMode = "practitioner" | "student" | "patient";

export type Severity = "EMERGENCY" | "URGENT" | "ROUTINE";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  institution?: string | null;
  specialty?: string | null;
  qualification?: string | null;
  avatar_url?: string | null;
}

export interface MetricCardData {
  label: string;
  value: string | number;
  helper: string;
}

export interface PatientCase {
  id: string;
  patient_id?: string | null;
  doctor_id?: string | null;
  patient_name: string;
  age: number;
  sex: string;
  chief_complaint: string;
  specialty?: string | null;
  severity: Severity;
  status: string;
  last_activity_at?: string | null;
}

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  duration_minutes: number;
  type: string;
  status: string;
  patient_name?: string | null;
  contact_number?: string | null;
  clinic_location?: string | null;
  notes?: string | null;
}

export interface AuditEvent {
  id: string;
  case_id?: string | null;
  doctor_id?: string | null;
  event_type: string;
  event_title: string;
  action_status: string;
  severity: Severity;
  event_payload?: Record<string, unknown>;
  created_at?: string;
}

export interface ConversationMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at?: string;
}

export interface Conversation {
  id: string;
  title: string;
  mode: string;
  doctor_id?: string | null;
  patient_id?: string | null;
  updated_at?: string;
  messages?: ConversationMessage[];
}

export interface DrugItem {
  id: string;
  genericName: string;
  brandNames: string[];
  className: string;
  dentalDose: string;
  commonDentalUse: string;
  contraindications: string[];
  sideEffects: string[];
}

export interface ResearchPaper {
  id: string;
  title: string;
  authors: string;
  journal: string;
  year: string;
  abstract: string;
  link: string;
  updatedAt?: number;
}

export interface CaseStudy {
  id: string;
  title: string;
  authorName: string;
  authorId?: string | null;
  authorRole?: Role | "guest";
  specialty: string;
  summary: string;
  content: string;
  views: number;
  helpfulCount: number;
  publishedAt: string;
  contentType?: "case_study" | "study_guide" | "workflow";
  coverImage?: string;
  readTime?: string;
}

export interface TriageResult {
  severity: Severity;
  redFlags: string[];
  triageReason: string;
  referralRequired: boolean;
}

export interface DetectionResult {
  detections: Array<{
    class_name: string;
    confidence: number;
    bbox: number[];
  }>;
  annotated_image: string;
}

export interface VisionResult {
  labels: string[];
  objects: Array<{
    name: string;
    score: number;
    bbox: number[];
  }>;
  text: string;
  interpretation: string;
}

export interface XrayResult {
  imagingType: string;
  quality: string;
  urgency: Severity;
  interpretation: string;
  findings: Array<{ title: string; detail: string }>;
  nextSteps: string[];
  detection?: DetectionResult;
  vision?: VisionResult;
}

export interface TreatmentPlanResult {
  phases: Array<{
    phase: number;
    name: string;
    visits: number;
    rationale: string;
    procedures: Array<{ procedure: string; detail: string }>;
  }>;
  maintenanceProtocol: string;
}

export interface SavedTreatmentPlan {
  id: string;
  patient_name: string;
  patient_gender?: string | null;
  urgency?: string | null;
  created_at: string;
  plan_json: unknown;
}

export interface ReferralResult {
  subject: string;
  letter: string;
}

export interface ExamQuestion {
  id: string;
  prompt: string;
  options: string[];
  answer: string;
  explanation: string;
}

export interface VideoItem {
  id: string;
  title: string;
  channel: string;
  specialty: string;
  duration: string;
  views: string;
  thumbnailUrl: string;
  videoUrl: string;
  playlist: string;
  topic: string;
}
