import { supabase } from "./supabase";

const LOCAL_CASES_KEY = "dental_ai_cases";

function getLocalCases() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_CASES_KEY) || "[]");
  } catch {
    return [];
  }
}

function setLocalCases(cases) {
  localStorage.setItem(LOCAL_CASES_KEY, JSON.stringify(cases));
}

function mapDbRowToCase(row) {
  return {
    id: row.id,
    patientName: row.patient_name,
    age: row.age,
    sex: row.sex,
    chiefComplaint: row.chief_complaint,
    medicalHistory: row.medical_history || "",
    clinicalFindings: row.clinical_findings || "",
    severity: row.severity || "ROUTINE",
    timestamp: row.created_at || new Date().toISOString(),
    status: row.status || "active",
    doctorAction: row.doctor_action || "pending",
    pathway: row.pathway || null,
  };
}

function mapCaseToDbInsert(input) {
  return {
    patient_name: input.patientName,
    age: Number(input.age) || null,
    sex: input.sex,
    chief_complaint: input.chiefComplaint,
    medical_history: input.medicalHistory || null,
    clinical_findings: input.clinicalFindings || null,
    severity: input.severity || "ROUTINE",
    status: input.status || "active",
    doctor_action: input.doctorAction || "pending",
    pathway: input.pathway || null,
  };
}

export async function listCases() {
  if (!supabase) return getLocalCases();

  const { data, error } = await supabase
    .from("cases")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(
      "Failed to load Supabase cases, falling back to localStorage:",
      error,
    );
    return getLocalCases();
  }

  const remoteCases = data.map(mapDbRowToCase);
  const localCases = getLocalCases();

  // Keep local fallback records visible even when Supabase reads succeed.
  const merged = [...remoteCases];
  const seen = new Set(remoteCases.map((c) => c.id));

  for (const localCase of localCases) {
    if (!seen.has(localCase.id)) {
      merged.push(localCase);
      seen.add(localCase.id);
    }
  }

  return merged.sort((a, b) => {
    const left = new Date(a.timestamp || 0).getTime();
    const right = new Date(b.timestamp || 0).getTime();
    return right - left;
  });
}

export async function getCaseById(caseId) {
  if (!caseId) return null;

  if (!supabase || String(caseId).startsWith("local-case-")) {
    return getLocalCases().find((c) => c.id === caseId) || null;
  }

  const { data, error } = await supabase
    .from("cases")
    .select("*")
    .eq("id", caseId)
    .maybeSingle();

  if (error) {
    console.error(
      "Failed to load case by ID, falling back to localStorage:",
      error,
    );
    return getLocalCases().find((c) => c.id === caseId) || null;
  }

  return data ? mapDbRowToCase(data) : null;
}

export async function createCaseRecord(input) {
  const localRecord = {
    id: input.id || `local-case-${Date.now()}`,
    patientName: input.patientName,
    age: Number(input.age) || null,
    sex: input.sex,
    chiefComplaint: input.chiefComplaint,
    medicalHistory: input.medicalHistory || "",
    clinicalFindings: input.clinicalFindings || "",
    severity: input.severity || "ROUTINE",
    timestamp: new Date().toISOString(),
    status: input.status || "active",
    doctorAction: input.doctorAction || "pending",
    pathway: input.pathway || null,
  };

  if (!supabase) {
    const existing = getLocalCases();
    setLocalCases([localRecord, ...existing]);
    return localRecord;
  }

  const { data, error } = await supabase
    .from("cases")
    .insert(mapCaseToDbInsert(input))
    .select("*")
    .single();

  if (error) {
    console.error(
      "Failed to create Supabase case, saving to localStorage:",
      error,
    );
    const existing = getLocalCases();
    setLocalCases([localRecord, ...existing]);
    return localRecord;
  }

  return mapDbRowToCase(data);
}

export async function updateCaseDoctorAction(caseId, doctorAction) {
  if (!caseId) return;

  if (!supabase || String(caseId).startsWith("local-case-")) {
    const existing = getLocalCases();
    const next = existing.map((c) =>
      c.id === caseId ? { ...c, doctorAction } : c,
    );
    setLocalCases(next);
    return;
  }

  const { error } = await supabase
    .from("cases")
    .update({ doctor_action: doctorAction })
    .eq("id", caseId);

  if (error) {
    console.error("Failed to update doctor action:", error);
  }
}

export async function updateCaseStatus(caseId, status) {
  if (!caseId) return;

  if (!supabase || String(caseId).startsWith("local-case-")) {
    const existing = getLocalCases();
    const next = existing.map((c) => (c.id === caseId ? { ...c, status } : c));
    setLocalCases(next);
    return;
  }

  const { error } = await supabase
    .from("cases")
    .update({ status })
    .eq("id", caseId);

  if (error) {
    console.error("Failed to update case status:", error);
  }
}
