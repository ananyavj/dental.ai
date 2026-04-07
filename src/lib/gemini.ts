import { GoogleGenerativeAI } from '@google/generative-ai'
import type {
  ChatMode,
  ReferralResult,
  TriageResult,
  TreatmentPlanResult,
  XrayResult,
} from '../types'

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || ''
const enabled = Boolean(apiKey && !apiKey.includes('your_gemini_api_key_here'))

let client: GoogleGenerativeAI | null = null

function getClient() {
  if (!enabled) return null
  if (!client) client = new GoogleGenerativeAI(apiKey)
  return client
}

async function runPrompt(prompt: string) {
  const genAI = getClient()
  if (!genAI) throw new Error('GEMINI_NOT_CONFIGURED')
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
  const result = await model.generateContent(prompt)
  return result.response.text()
}

function cleanJson(text: string) {
  return text.replace(/```json/g, '').replace(/```/g, '').trim()
}

export const isGeminiEnabled = enabled

export async function chatWithGemini(mode: ChatMode, prompt: string, history: Array<{ role: string; content: string }>) {
  const genAI = getClient()
  if (!genAI) {
    return `${mode === 'practitioner' ? 'Practitioner' : mode === 'student' ? 'Student' : 'Patient'} mode demo response:\n\n${prompt}\n\nAdd VITE_GEMINI_API_KEY to enable live Gemini answers.`
  }

  const system =
    mode === 'practitioner'
      ? 'You are dental.ai for dentists. Be concise, clinically useful, and evidence-aware.'
      : mode === 'student'
        ? 'You are dental.ai for dental students. Explain clearly, structure answers, and include recall-friendly memory hooks.'
        : 'You are dental.ai for patients. Use simple, safe, non-diagnostic language and encourage dental consultation.'

  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: system,
  })

  const chat = model.startChat({
    history: history.map(item => ({
      role: item.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: item.content }],
    })),
  })

  const result = await chat.sendMessage(prompt)
  return result.response.text()
}

export async function triageWithGemini(input: { complaint: string; age: string; symptoms: string }) {
  try {
    const raw = await runPrompt(`Return valid JSON only:
{
  "severity": "EMERGENCY" | "URGENT" | "ROUTINE",
  "redFlags": ["..."],
  "triageReason": "short reason",
  "referralRequired": true
}

Assess this dental complaint:
Complaint: ${input.complaint}
Age: ${input.age}
Associated symptoms: ${input.symptoms}`)
    return JSON.parse(cleanJson(raw)) as TriageResult
  } catch {
    return {
      severity: input.complaint.toLowerCase().includes('swelling') ? 'URGENT' : 'ROUTINE',
      redFlags: input.symptoms ? [input.symptoms] : [],
      triageReason: 'Fallback triage used because Gemini was unavailable or returned an invalid payload.',
      referralRequired: input.complaint.toLowerCase().includes('trismus'),
    }
  }
}

export async function generateReferral(input: Record<string, string>): Promise<ReferralResult> {
  try {
    const raw = await runPrompt(`Write a concise dental referral letter and return JSON only:
{"subject":"...","letter":"..."}
Data: ${JSON.stringify(input)}`)
    return JSON.parse(cleanJson(raw)) as ReferralResult
  } catch {
    return {
      subject: `Referral to ${input.specialty || input.toSpecialty || 'specialist care'}`,
      letter: `Dear Specialist,\n\nPlease review ${input.patientName || 'this patient'} for ${input.reasonForReferral || input.chiefComplaint || 'further specialist assessment'}.\n\nClinical summary: ${input.clinicalFindings || 'See attached findings.'}\n\nRegards,\n${input.referringDoctor || 'Dental.ai user'}`,
    }
  }
}

export async function buildTreatmentPlan(input: Record<string, string>): Promise<TreatmentPlanResult> {
  try {
    const raw = await runPrompt(`Return treatment plan JSON only:
{"phases":[{"phase":1,"name":"...","visits":1,"rationale":"...","procedures":[{"procedure":"...","detail":"..."}]}],"maintenanceProtocol":"..."}
Input: ${JSON.stringify(input)}`)
    return JSON.parse(cleanJson(raw)) as TreatmentPlanResult
  } catch {
    return {
      phases: [
        {
          phase: 1,
          name: 'Stabilization',
          visits: 1,
          rationale: 'Control pain, infection, and urgent symptoms first.',
          procedures: [{ procedure: 'Emergency pain control', detail: input.chiefComplaint || 'Relieve active symptoms' }],
        },
        {
          phase: 2,
          name: 'Definitive care',
          visits: 2,
          rationale: 'Deliver definitive specialty-appropriate treatment once stable.',
          procedures: [{ procedure: 'Definitive dental treatment', detail: input.diagnoses || 'Proceed using confirmed diagnosis' }],
        },
      ],
      maintenanceProtocol: 'Review in 1 week, 6 weeks, and 3 months with oral hygiene reinforcement.',
    }
  }
}

export async function analyzeDrugInteractions(existing: string, planned: string) {
  try {
    const raw = await runPrompt(`Return JSON only:
{"summary":"...","safeToAdminister":true,"interactions":[{"severity":"Major","drugs":"...","management":"..."}]}
Existing meds: ${existing}
Planned dental meds: ${planned}`)
    return JSON.parse(cleanJson(raw)) as {
      summary: string
      safeToAdminister: boolean
      interactions: Array<{ severity: string; drugs: string; management: string }>
    }
  } catch {
    return {
      summary: 'Fallback interaction review generated. Verify with a standard interaction database before prescribing.',
      safeToAdminister: true,
      interactions: [
        {
          severity: 'Moderate',
          drugs: 'NSAID + antihypertensive',
          management: 'Monitor blood pressure and prefer the lowest effective NSAID course.',
        },
      ],
    }
  }
}

export async function analyzeXray(base64: string, mimeType: string): Promise<XrayResult> {
  const genAI = getClient()
  if (!genAI) {
    return {
      imagingType: 'IOPA or OPG',
      quality: 'Diagnostic quality assumed from uploaded image',
      urgency: 'URGENT',
      interpretation: 'Fallback imaging review suggests correlating the radiographic finding with vitality tests and percussion.',
      findings: [
        { title: 'Possible periapical change', detail: 'Review the apical region for widening or radiolucency.' },
        { title: 'Restorative concern', detail: 'Assess crown structure, caries depth, and remaining tooth integrity.' },
      ],
      nextSteps: ['Take history and symptoms', 'Confirm with chairside tests', 'Document the working diagnosis'],
    }
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    const result = await model.generateContent([
      'Return dental xray interpretation JSON only: {"imagingType":"...","quality":"...","urgency":"EMERGENCY|URGENT|ROUTINE","interpretation":"...","findings":[{"title":"...","detail":"..."}],"nextSteps":["..."]}',
      {
        inlineData: {
          data: base64,
          mimeType,
        },
      },
    ])
    return JSON.parse(cleanJson(result.response.text())) as XrayResult
  } catch {
    return {
      imagingType: 'IOPA or OPG',
      quality: 'Image uploaded successfully',
      urgency: 'URGENT',
      interpretation: 'Gemini was unavailable, so a safe fallback interpretation is shown for workflow continuity.',
      findings: [
        { title: 'Correlate radiograph clinically', detail: 'Pair imaging review with vitality, percussion, and palpation.' },
      ],
      nextSteps: ['Repeat focused imaging if needed', 'Confirm diagnosis clinically'],
    }
  }
}

export async function reviewPaperWithGemini(text: string) {
  try {
    return await runPrompt(`Summarize this dental research paper for a busy clinician in 5 bullet points:\n${text}`)
  } catch {
    return 'Fallback review: clarify study design, sample size, main outcome, clinical relevance, and limitations before applying it in practice.'
  }
}
