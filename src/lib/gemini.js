import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const GEMINI_MODEL = "gemini-2.0-flash";

let genAI = null;

function getClient() {
  if (!genAI && API_KEY && API_KEY !== "your_gemini_api_key_here") {
    genAI = new GoogleGenerativeAI(API_KEY);
  }
  return genAI;
}

const CLINICAL_PATHWAY_PROMPT = `You are a senior dental clinical AI assistant.

Given the patient context, generate a complete structured clinical pathway in valid JSON with this exact shape:
{
  "severity": "EMERGENCY" | "URGENT" | "ROUTINE",
  "redFlags": ["flag1", "flag2"],
  "triageReason": "Brief 1-2 sentence reason",
  "referralRequired": true | false,
  "differentials": [
    {
      "diagnosis": "Diagnosis name",
      "probability": "likely" | "possible" | "unlikely",
      "specialty": "Endodontics" | "Periodontics" | "Oral Surgery" | "Orthodontics" | "Prosthodontics" | "Paediatric Dentistry" | "Oral Medicine" | "Implantology" | "General Dentistry",
      "icd10": "ICD-10 code",
      "keyFeatures": ["feature1", "feature2"]
    }
  ],
  "investigations": [
    { "name": "Investigation name", "rationale": "Why needed", "priority": "Essential" | "Recommended" | "Optional" }
  ],
  "management": [
    { "phase": "Immediate" | "Short-term" | "Long-term", "action": "Action description", "detail": "Specific detail or technique" }
  ],
  "evidence": [
    {
      "title": "Full paper title",
      "journal": "Journal name",
      "year": 2023,
      "authors": "Author et al.",
      "relevance": "One sentence on clinical relevance",
      "level": "Systematic review" | "RCT" | "Cohort study" | "Case series" | "Expert consensus" | "Clinical guideline"
    }
  ],
  "referral": {
    "required": true | false,
    "specialty": "Specialty if required",
    "urgency": "Same day" | "Within 24h" | "Within 1 week" | "Elective"
  },
  "followUp": "Follow-up instructions",
  "disclaimer": "AI-generated pathway. Verify all recommendations before clinical application. Patient-specific factors may alter management."
}

Rules:
- If the presentation is emergency or high-risk, set severity to EMERGENCY and make the triage/referral explicit.
- Provide 3-6 differentials for non-emergency presentations.
- Include 2-4 evidence sources.
- Respond ONLY with valid JSON. No markdown, no explanations.`;

// ─── Specialty System Prompts ───────────────────────────────────────────────

export const SPECIALTY_PROMPTS = {
  "Endo.ai": `You are Endo.ai, an expert endodontic AI assistant for practising dentists. You are primed on: RCT protocols, pulp biology, rotary file systems (WaveOne, ProTaper, Reciproc), irrigant protocols (NaOCl concentrations, EDTA, activation), obturation techniques (warm vertical compaction, single cone with bioceramic sealers), endodontic retreatment, periapical surgery, Vertucci canal classification, CBCT interpretation for endodontics.

You respond like a senior endodontist colleague. Keep responses structured with clear headings. Use bullet points for protocols. Always mention evidence level for recommendations. Flag if a case needs specialist referral.`,

  "Perio.ai": `You are Perio.ai, an expert periodontal AI assistant for practising dentists. You are primed on: 2017 AAP/EFP classification of periodontal diseases, staging and grading of periodontitis, SRP protocols, local drug delivery, bone graft materials (allografts, xenografts, alloplasts), guided tissue regeneration membranes, peri-implantitis diagnosis and management, periodontal surgical procedures (flap surgery, modified Widman flap, osseous surgery), supportive periodontal therapy intervals.

Respond like a senior periodontist. Structure your answers clearly. Lead with diagnosis/staging, then management protocol.`,

  "Implant.ai": `You are Implant.ai, an expert implantology AI assistant for practising dentists. You are primed on: implant placement protocols, immediate vs early vs delayed placement and loading protocols, bone augmentation (GBR, block grafting, ring technique), sinus lift procedures (lateral window vs crestal approach), soft tissue management (connective tissue grafts, free gingival grafts), implant failure diagnosis and management, prosthetic options (cement-retained vs screw-retained), digital workflow for implants.

Respond like a senior implantologist. Always address bone volume, soft tissue quality, and systemic contraindications.`,

  "OralSurg.ai": `You are OralSurg.ai, an expert oral surgery AI assistant for practising dentists. You are primed on: surgical extraction techniques, impaction classification (Winter's, Pell & Gregory), lower third molar surgery, management of facial space infections (vestibular, buccal, submandibular, masseteric, pterygomandibular, lateral pharyngeal spaces), Ludwig's angina protocol, orthognathic surgery principles (Le Fort I, BSSO, genioplasty), odontogenic cyst and tumour management, TMJ arthroscopy.

Respond like a consultant oral and maxillofacial surgeon. Always address airway in infection cases first.`,

  "OrthoD.ai": `You are OrthoD.ai, an expert orthodontic AI assistant for practising dentists. You are primed on: cephalometric analysis (ANB, Wits, SNA, SNB, IMPA, Frankfort mandibular plane angle), appliance selection, fixed vs clear aligner therapy (Invisalign, Spark), skeletal vs dental discrepancies, extraction vs non-extraction decisions, Class II and Class III treatment strategies, retention protocols, interdisciplinary orthodontic-surgical cases, early treatment (Phase 1) indications.

Respond like a senior orthodontist. Lead with skeletal classification, then dental analysis, then treatment options.`,

  "Pedo.ai": `You are Pedo.ai, an expert paediatric dentistry AI assistant for practising dentists. You are primed on: behaviour management techniques (tell-show-do, voice control, protective stabilisation, nitrous oxide sedation), pulpotomy and pulpectomy protocols for primary teeth, stainless steel crown indications and technique, space maintainers (band and loop, Nance appliance, lower lingual arch), preventive protocols (fissure sealants, fluoride varnish dosing), fluoride toxicity thresholds, eruption chronology and disturbances, paediatric dental trauma management.

Respond like a senior paediatric dentist. Always consider behaviour management before clinical protocol.`,

  "Prostho.ai": `You are Prostho.ai, an expert prosthodontic AI assistant for practising dentists. You are primed on: crown and bridge design principles, material selection (monolithic zirconia vs layered zirconia vs lithium disilicate vs PFM — indications and limitations), RPD frameworks (Kennedy classification, surveying, clasps, connectors), complete denture principles (border moulding, impression techniques, jaw relation records, try-in assessment), occlusal concepts (centric relation, mutually protected occlusion, canine guidance), digital prosthetic workflows (intraoral scanning, CAD/CAM, 3D printing).

Respond like a senior prosthodontist. Always address occlusion and material choice with evidence.`,

  "OralMed.ai": `You are OralMed.ai, an expert oral medicine AI assistant for practising dentists. You are primed on: oral mucosal lesion diagnosis and management, potentially malignant disorders (leukoplakia, erythroplakia, oral submucous fibrosis — staging and surveillance), salivary gland disorders (Sjögren's syndrome, salivary calculi, neoplasms), oral manifestations of systemic disease (diabetes, leukaemia, HIV, osteoporosis, medications causing xerostomia, gingival enlargement), TMJ disorders (myofascial pain, disc displacement, degenerative joint disease), orofacial pain classification.

Respond like a senior oral physician. Always consider systemic connections and biopsy indications.`,
};

// ─── Core API Functions ────────────────────────────────────────────────────────

async function callGemini(systemPrompt, userContent) {
  const client = getClient();
  if (!client) {
    throw new Error("GEMINI_KEY_MISSING");
  }
  const model = client.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: systemPrompt,
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 2048,
    },
  });
  const result = await model.generateContent(userContent);
  return result.response.text();
}

function getTextModel(client, generationConfig = {}) {
  return client.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig,
  });
}

function parseJSON(text) {
  // Strip markdown code fences if present
  const cleaned = text
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
  return JSON.parse(cleaned);
}

// ─── Clinical Pathway Pipeline ────────────────────────────────────────────────

async function runClinicalPathwayLive(input, onProgress) {
  const {
    chiefComplaint,
    patientAge,
    patientSex,
    medicalHistory,
    clinicalFindings,
  } = input;

  const contextString = `
Patient: ${patientAge} year old ${patientSex}
Chief Complaint: ${chiefComplaint}
Medical History: ${medicalHistory || "Not provided"}
Clinical Findings: ${clinicalFindings || "Not provided"}
  `.trim();

  onProgress?.("triage", "running");
  const pathwayRaw = await callGemini(CLINICAL_PATHWAY_PROMPT, contextString);
  const pathwayResult = parseJSON(pathwayRaw);
  onProgress?.("triage", "done", pathwayResult);
  onProgress?.("differentials", "done", pathwayResult);
  onProgress?.("evidence", "done", pathwayResult);
  onProgress?.("pathway", "done", pathwayResult);

  onProgress?.("complete", "done");

  return {
    severity: pathwayResult.severity,
    redFlags: pathwayResult.redFlags || [],
    triageReason: pathwayResult.triageReason,
    referralRequired: Boolean(pathwayResult.referralRequired),
    differentials: pathwayResult.differentials || [],
    investigations: pathwayResult.investigations || [],
    management: pathwayResult.management || [],
    evidence: pathwayResult.evidence || [],
    referral: pathwayResult.referral || {
      required: false,
      specialty: "General Dentistry",
      urgency: "Within 1 week",
    },
    followUp: pathwayResult.followUp,
    disclaimer: pathwayResult.disclaimer,
  };
}

export async function runClinicalPathway(input, onProgress) {
  return runClinicalPathwayLive(input, onProgress);
}

// ─── Specialty AI Chat ─────────────────────────────────────────────────────────

export async function specialtyChat(specialtyName, messages, newMessage) {
  const client = getClient();
  if (!client) throw new Error("GEMINI_KEY_MISSING");

  const systemPrompt =
    SPECIALTY_PROMPTS[specialtyName] || SPECIALTY_PROMPTS["Endo.ai"];

  const model = client.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: systemPrompt,
    generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
  });

  const history = messages.map((m) => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: m.content }],
  }));

  const chat = model.startChat({ history });
  const result = await chat.sendMessage(newMessage);
  return result.response.text();
}

// ─── Follow-up Chat (in Pathway) ───────────────────────────────────────────────

export async function followUpChat(pathway, previousMessages, newMessage) {
  const client = getClient();
  if (!client) throw new Error("GEMINI_KEY_MISSING");

  const systemPrompt = `You are a clinical dental AI assistant. The doctor has already received a structured clinical pathway. Answer follow-up questions clearly and concisely. Reference the pathway when relevant. Format answers with bullet points where helpful. Never guess — say "refer to specialist" if beyond confidence.

Active pathway context:
${JSON.stringify(pathway, null, 2)}`;

  const model = client.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: systemPrompt,
    generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
  });

  const history = previousMessages.map((m) => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: m.content }],
  }));

  const chat = model.startChat({ history });
  const result = await chat.sendMessage(newMessage);
  return result.response.text();
}

// ─── Drug Interaction Checker ──────────────────────────────────────────────────

export async function checkDrugInteractions(existingMeds, plannedPrescription) {
  const client = getClient();
  if (!client) throw new Error("GEMINI_KEY_MISSING");

  const prompt = `You are a dental pharmacology expert. Check interactions between the patient's existing medications and the planned dental prescription.

Output ONLY valid JSON:
{
  "interactions": [
    {
      "drug1": "existing drug",
      "drug2": "dental drug",
      "severity": "Major" | "Moderate" | "Minor",
      "mechanism": "interaction mechanism",
      "effect": "clinical effect",
      "recommendation": "avoid" | "monitor" | "dose-adjust" | "alternative-suggested",
      "alternative": "alternative if applicable or null"
    }
  ],
  "safeToAdminister": true | false,
  "summary": "Brief clinical summary"
}

Existing medications: ${existingMeds}
Planned dental prescription: ${plannedPrescription}

Respond ONLY with valid JSON.`;

  const model = getTextModel(client, {
    temperature: 0.1,
    maxOutputTokens: 1024,
  });
  const result = await model.generateContent(prompt);
  return parseJSON(result.response.text());
}

// ─── X-ray Analysis ────────────────────────────────────────────────────────────

export async function analyzeXray(imageBase64, mimeType) {
  const client = getClient();
  if (!client) throw new Error("GEMINI_KEY_MISSING");

  const model = getTextModel(client);

  const prompt = `You are a dental radiograph expert. Analyze this dental X-ray (IOPA/OPG) and provide a structured report.

Output ONLY valid JSON:
{
  "imagingType": "IOPA" | "OPG" | "CBCT" | "Unknown",
  "quality": "Diagnostic" | "Suboptimal" | "Non-diagnostic",
  "findings": [
    {
      "id": "finding_1",
      "name": "Finding name",
      "description": "Detailed description",
      "location": "Tooth/region description",
      "confidence": 85,
      "severity": "high" | "moderate" | "low",
      "type": "periapical" | "caries" | "bone_level" | "calculus" | "restoration" | "anatomical" | "other"
    }
  ],
  "interpretation": "Plain English 2-3 paragraph interpretation for the treating dentist",
  "nextSteps": ["Step 1", "Step 2", "Step 3"],
  "urgency": "Immediate" | "Within 1 week" | "Routine",
  "disclaimer": "Radiographic interpretation only. Correlate with clinical findings."
}`;

  const result = await model.generateContent([
    {
      inlineData: {
        data: imageBase64,
        mimeType: mimeType,
      },
    },
    prompt,
  ]);
  return parseJSON(result.response.text());
}

// ─── Referral Letter Generation ─────────────────────────────────────────────────

export async function generateReferralLetter(caseData) {
  const client = getClient();
  if (!client) throw new Error("GEMINI_KEY_MISSING");

  const prompt = `Generate a formal dental referral letter suitable for Indian hospital outpatient departments. 

Output ONLY valid JSON:
{
  "letter": "Full formatted letter text with proper salutation, body paragraphs, and sign-off",
  "subject": "Re: Referral of [Patient] for [Specialty] consultation"
}

Case data: ${JSON.stringify(caseData)}`;

  const model = getTextModel(client, {
    temperature: 0.4,
    maxOutputTokens: 1024,
  });
  const result = await model.generateContent(prompt);
  return parseJSON(result.response.text());
}

// ─── Treatment Plan Builder ─────────────────────────────────────────────────────

export async function buildTreatmentPlan(inputData) {
  const client = getClient();
  if (!client) throw new Error("GEMINI_KEY_MISSING");

  const prompt = `You are a comprehensive dental treatment planning AI. Create a phased treatment plan.

Output ONLY valid JSON:
{
  "phases": [
    {
      "phase": 1,
      "name": "Emergency / Pain Relief",
      "visits": 1,
      "procedures": [
        { "procedure": "Procedure name", "detail": "Specific detail", "priority": "Critical" | "High" | "Standard" }
      ],
      "rationale": "Why this phase is sequenced here"
    }
  ],
  "patientFriendlyPlan": "Plain English version of the full treatment plan",
  "totalVisitsEstimate": 8,
  "maintenanceProtocol": "Long-term maintenance recommendation"
}

Patient data: ${JSON.stringify(inputData)}`;

  const model = getTextModel(client, {
    temperature: 0.3,
    maxOutputTokens: 2048,
  });
  const result = await model.generateContent(prompt);
  return parseJSON(result.response.text());
}

export { API_KEY };
