import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { PageHeader } from "../components/common/page-header";
import { useAuth } from "../contexts/auth-context";
import { saveTreatmentPlan } from "../lib/data-client";
import { buildTreatmentPlan } from "../lib/gemini";
import type { TreatmentPlanResult } from "../types";

export function TreatmentPlanPage() {
  const { profile } = useAuth();
  const [form, setForm] = useState({
    patientName: "",
    gender: "",
    urgency: "Routine",
    chiefComplaint: "",
    diagnoses: "",
    medicalHistory: "",
  });
  const [result, setResult] = useState<TreatmentPlanResult | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Treatment Plan"
        title="Build phased treatment plans"
        description="Keeps planning fast and readable with a simple two-panel workflow."
      />
      <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
        <Card>
          <CardContent className="space-y-3">
            <Input
              placeholder="Patient name"
              value={form.patientName}
              onChange={(event) =>
                setForm({ ...form, patientName: event.target.value })
              }
            />
            <select
              className="flex h-10 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
              value={form.gender}
              onChange={(event) =>
                setForm({ ...form, gender: event.target.value })
              }
            >
              <option value="">Gender</option>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
              <option>Prefer not to say</option>
            </select>
            <select
              className="flex h-10 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
              value={form.urgency}
              onChange={(event) =>
                setForm({ ...form, urgency: event.target.value })
              }
            >
              <option>Emergency</option>
              <option>Urgent</option>
              <option>Routine</option>
            </select>
            <Textarea
              placeholder="Chief complaint"
              value={form.chiefComplaint}
              onChange={(event) =>
                setForm({ ...form, chiefComplaint: event.target.value })
              }
            />
            <Textarea
              placeholder="Diagnoses"
              value={form.diagnoses}
              onChange={(event) =>
                setForm({ ...form, diagnoses: event.target.value })
              }
            />
            <Textarea
              placeholder="Medical history"
              value={form.medicalHistory}
              onChange={(event) =>
                setForm({ ...form, medicalHistory: event.target.value })
              }
            />
            <Button
              className="w-full"
              onClick={async () => setResult(await buildTreatmentPlan(form))}
            >
              Generate plan
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              onClick={async () => {
                if (!profile || !result) return;
                await saveTreatmentPlan(profile, {
                  patientName: form.patientName,
                  patientGender: form.gender || undefined,
                  urgency: form.urgency,
                  plan: result,
                });
                toast.success("Treatment plan saved");
              }}
            >
              Save plan
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-4">
            <h2 className="text-lg font-semibold">Plan preview</h2>
            {result ? (
              result.phases.map((item) => (
                <div
                  key={item.phase}
                  className="rounded-xl border border-border p-4"
                >
                  <p className="font-medium">
                    Phase {item.phase}: {item.name}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.rationale}
                  </p>
                  <div className="mt-3 space-y-2">
                    {item.procedures.map((procedure, index) => (
                      <div key={index} className="text-sm">
                        {procedure.procedure}:{" "}
                        <span className="text-muted-foreground">
                          {procedure.detail}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Generate a phased plan to preview it here.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
