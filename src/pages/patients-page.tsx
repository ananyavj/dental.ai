import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { PageHeader } from "../components/common/page-header";
import {
  getPatientCases,
  getPatientHistory,
  getSavedTreatmentPlans,
  saveTriage,
  scheduleAppointmentFromTriage,
} from "../lib/data-client";
import { triageWithGemini } from "../lib/gemini";
import { useAuth } from "../contexts/auth-context";
import { formatDateTime } from "../lib/utils";
import { demoAppointments, demoAudit, demoCases } from "../lib/mock";
import type {
  Appointment,
  AuditEvent,
  PatientCase,
  SavedTreatmentPlan,
} from "../types";

export function PatientsPage() {
  const { profile } = useAuth();
  const [cases, setCases] = useState<PatientCase[]>(demoCases);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [triageInput, setTriageInput] = useState({
    complaint: "",
    age: "",
    symptoms: "",
  });
  const [triageResult, setTriageResult] = useState<{
    severity: string;
    triageReason: string;
    redFlags: string[];
    referralRequired: boolean;
  } | null>(null);
  const [triageLoading, setTriageLoading] = useState(false);
  const [appointments, setAppointments] =
    useState<Appointment[]>(demoAppointments);
  const [history, setHistory] = useState<AuditEvent[]>(demoAudit);
  const [savedPlans, setSavedPlans] = useState<SavedTreatmentPlan[]>([]);
  const [appointmentForm, setAppointmentForm] = useState({
    appointmentDate: "",
    appointmentType: "Clinical review",
    clinicLocation: "Main Clinic - Operatory 2",
    durationMinutes: "30",
  });
  const [savingAppointment, setSavingAppointment] = useState(false);

  useEffect(() => {
    void getPatientCases().then((items) => {
      setCases(items);
      setSelectedId(items[0]?.id ?? null);
    });
  }, []);

  const filteredCases = useMemo(
    () =>
      cases.filter((item) => {
        const query = search.toLowerCase();
        return (
          item.patient_name.toLowerCase().includes(query) ||
          item.chief_complaint.toLowerCase().includes(query)
        );
      }),
    [cases, search],
  );

  const directoryItems = useMemo(() => {
    const caseNameSet = new Set(
      cases.map((item) => item.patient_name.trim().toLowerCase()),
    );
    const planOnlyPatients = savedPlans.filter(
      (item) => !caseNameSet.has(item.patient_name.trim().toLowerCase()),
    );
    const query = search.trim().toLowerCase();

    const caseEntries = filteredCases.map((item) => ({
      kind: "case" as const,
      id: item.id,
      patientName: item.patient_name,
      subtitle: item.chief_complaint,
      meta: `${item.specialty || "General"} • ${formatDateTime(item.last_activity_at)}`,
      severity: item.severity,
      isSelected: selectedPlanId === null && selectedId === item.id,
    }));

    const planEntries = planOnlyPatients
      .filter((item) => {
        if (!query) return true;
        return (
          item.patient_name.toLowerCase().includes(query) ||
          (item.patient_gender || "").toLowerCase().includes(query)
        );
      })
      .map((item) => ({
        kind: "plan" as const,
        id: item.id,
        patientName: item.patient_name,
        subtitle: `Saved treatment plan • Gender: ${item.patient_gender || "Not provided"}`,
        meta: `Urgency: ${item.urgency || "Routine"} • ${formatDateTime(item.created_at)}`,
        severity: item.urgency || "Routine",
        isSelected: selectedPlanId === item.id,
      }));

    return [...caseEntries, ...planEntries];
  }, [cases, filteredCases, savedPlans, search, selectedId, selectedPlanId]);

  const selectedCase = selectedPlanId
    ? null
    : (filteredCases.find((item) => item.id === selectedId) ??
      filteredCases[0] ??
      null);
  const selectedPlan = selectedPlanId
    ? (savedPlans.find((item) => item.id === selectedPlanId) ?? null)
    : null;

  useEffect(() => {
    if (!selectedCase) return;
    setTriageInput({
      complaint: selectedCase.chief_complaint,
      age: String(selectedCase.age),
      symptoms: "",
    });
  }, [selectedCase]);

  useEffect(() => {
    if (!selectedCase) return;
    void getPatientHistory(selectedCase.patient_id, selectedCase.id).then(
      (data) => {
        setAppointments(data.appointments);
        setHistory(data.events);
      },
    );
  }, [selectedCase]);

  useEffect(() => {
    void getSavedTreatmentPlans(profile).then(setSavedPlans);
  }, [profile]);

  function suggestAppointment(severity: string) {
    const now = new Date();
    if (severity === "EMERGENCY") {
      now.setHours(now.getHours() + 1);
      return {
        date: now.toISOString().slice(0, 16),
        type: "Emergency consult",
        duration: "45",
        location: "Emergency Chair - Ground Floor",
      };
    }
    if (severity === "URGENT") {
      now.setHours(now.getHours() + 4);
      return {
        date: now.toISOString().slice(0, 16),
        type: "Urgent review",
        duration: "30",
        location: "Main Clinic - Operatory 2",
      };
    }
    now.setDate(now.getDate() + 2);
    now.setHours(11, 0, 0, 0);
    return {
      date: now.toISOString().slice(0, 16),
      type: "Routine follow-up",
      duration: "30",
      location: "Review Bay - Floor 1",
    };
  }

  async function handleTriage() {
    if (!selectedCase || !profile) return;
    setTriageLoading(true);
    const result = await triageWithGemini(triageInput);
    setTriageResult(result);
    await saveTriage(profile, {
      patientId: selectedCase.patient_id || "",
      caseId: selectedCase.id,
      note: `Complaint: ${triageInput.complaint}\nSymptoms: ${triageInput.symptoms || "None recorded"}\nAI triage: ${result.severity}\nReason: ${result.triageReason}`,
      triage: result,
    });
    const suggestion = suggestAppointment(result.severity);
    setAppointmentForm({
      appointmentDate: suggestion.date,
      appointmentType: suggestion.type,
      clinicLocation: suggestion.location,
      durationMinutes: suggestion.duration,
    });
    setTriageLoading(false);
    toast.success("Triage result saved");
  }

  async function handleAppointmentSave() {
    if (!selectedCase || !profile || !appointmentForm.appointmentDate) return;
    setSavingAppointment(true);
    const appointment = await scheduleAppointmentFromTriage(profile, {
      patientId: selectedCase.patient_id || "",
      patientName: selectedCase.patient_name,
      appointmentDate: new Date(appointmentForm.appointmentDate).toISOString(),
      appointmentType: appointmentForm.appointmentType,
      durationMinutes: Number(appointmentForm.durationMinutes),
      clinicLocation: appointmentForm.clinicLocation,
      complaint: triageInput.complaint || selectedCase.chief_complaint,
      severity: (triageResult?.severity || selectedCase.severity) as
        | "EMERGENCY"
        | "URGENT"
        | "ROUTINE",
    });
    setAppointments((current) => [appointment, ...current]);
    setSavingAppointment(false);
    toast.success("Appointment scheduled");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Patient Directory"
        title="Search cases and run lightweight triage"
        description="Fast list rendering first, then synced Supabase data. Use the right panel to run AI triage without leaving the directory."
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <Card>
          <CardContent className="space-y-4">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search patient name, complaint, or gender"
            />
            <div className="space-y-3">
              {directoryItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.kind === "case") {
                      setSelectedId(item.id);
                      setSelectedPlanId(null);
                    } else {
                      setSelectedPlanId(item.id);
                    }
                  }}
                  className={`w-full rounded-xl border p-4 text-left transition ${item.isSelected ? "border-primary bg-primary/5" : item.kind === "plan" ? "border-emerald-200 bg-emerald-50/40" : "border-border bg-card"}`}
                >
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{item.patientName}</p>
                    <span className="rounded-full bg-muted px-2 py-1 text-[11px] text-muted-foreground">
                      {item.severity}
                    </span>
                    {item.kind === "plan" ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-[11px] text-emerald-700">
                        Plan
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.subtitle}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {item.meta}
                  </p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-5">
            <h2 className="text-lg font-semibold">
              {selectedPlan?.patient_name ||
                selectedCase?.patient_name ||
                "Select a patient"}
            </h2>
            <div className="rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground">
              {selectedPlan
                ? `Saved treatment plan (${selectedPlan.urgency || "Routine"})`
                : selectedCase?.chief_complaint ||
                  "Choose a patient case from the list"}
            </div>

            {selectedPlan ? (
              <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Plan Summary</p>
                <p className="mt-1">
                  Gender: {selectedPlan.patient_gender || "Not provided"}
                </p>
                <p className="mt-1">
                  Urgency: {selectedPlan.urgency || "Routine"}
                </p>
                <p className="mt-1">
                  Saved: {formatDateTime(selectedPlan.created_at)}
                </p>
              </div>
            ) : null}
            <div className="space-y-3">
              <Input
                placeholder="Chief complaint"
                value={triageInput.complaint}
                onChange={(event) =>
                  setTriageInput((current) => ({
                    ...current,
                    complaint: event.target.value,
                  }))
                }
              />
              <Input
                placeholder="Age"
                value={triageInput.age}
                onChange={(event) =>
                  setTriageInput((current) => ({
                    ...current,
                    age: event.target.value,
                  }))
                }
              />
              <Textarea
                placeholder="Associated symptoms"
                value={triageInput.symptoms}
                onChange={(event) =>
                  setTriageInput((current) => ({
                    ...current,
                    symptoms: event.target.value,
                  }))
                }
              />
              <Button
                className="w-full"
                disabled={
                  triageLoading || !triageInput.complaint || !selectedCase
                }
                onClick={handleTriage}
              >
                {triageLoading ? "Running triage..." : "Run AI triage"}
              </Button>
            </div>

            {triageResult ? (
              <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
                <p className="font-medium">{triageResult.severity}</p>
                <p className="text-sm text-muted-foreground">
                  {triageResult.triageReason}
                </p>
                <p className="text-xs text-muted-foreground">
                  Red flags: {triageResult.redFlags.join(", ") || "None"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Referral required:{" "}
                  {triageResult.referralRequired ? "Yes" : "No"}
                </p>
              </div>
            ) : null}

            <div className="space-y-3 rounded-2xl border border-border p-4">
              <div>
                <p className="font-medium">Schedule next appointment</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  AI triage can directly suggest and store the next visit for
                  the patient CRM timeline.
                </p>
              </div>
              <Input
                type="datetime-local"
                value={appointmentForm.appointmentDate}
                onChange={(event) =>
                  setAppointmentForm((current) => ({
                    ...current,
                    appointmentDate: event.target.value,
                  }))
                }
              />
              <Input
                placeholder="Appointment type"
                value={appointmentForm.appointmentType}
                onChange={(event) =>
                  setAppointmentForm((current) => ({
                    ...current,
                    appointmentType: event.target.value,
                  }))
                }
              />
              <Input
                placeholder="Clinic location"
                value={appointmentForm.clinicLocation}
                onChange={(event) =>
                  setAppointmentForm((current) => ({
                    ...current,
                    clinicLocation: event.target.value,
                  }))
                }
              />
              <Input
                placeholder="Duration (minutes)"
                value={appointmentForm.durationMinutes}
                onChange={(event) =>
                  setAppointmentForm((current) => ({
                    ...current,
                    durationMinutes: event.target.value,
                  }))
                }
              />
              <Button
                className="w-full"
                variant="secondary"
                disabled={
                  savingAppointment ||
                  !appointmentForm.appointmentDate ||
                  !selectedCase
                }
                onClick={handleAppointmentSave}
              >
                {savingAppointment ? "Scheduling..." : "Schedule appointment"}
              </Button>
            </div>

            <div className="space-y-3">
              <p className="font-medium">Upcoming appointments</p>
              {appointments.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-border p-3"
                >
                  <p className="text-sm font-medium">{item.type}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDateTime(item.appointment_date)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.clinic_location || item.notes}
                  </p>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <p className="font-medium">History log</p>
              {history.slice(0, 4).map((item) => (
                <div key={item.id} className="rounded-xl bg-muted/30 p-3">
                  <p className="text-sm font-medium">{item.event_title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.event_type} • {formatDateTime(item.created_at)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
