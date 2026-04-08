import { useState } from "react";
import AppLayout from "../components/AppLayout";
import { checkDrugInteractions } from "../lib/gemini";
import { DENTAL_DRUGS } from "../lib/data";
import {
  Search,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  Plus,
  Info,
} from "lucide-react";

const SEVERITY_STYLES = {
  Major: "bg-red-100 text-red-700 border-red-200",
  Moderate: "bg-amber-100 text-amber-700 border-amber-200",
  Minor: "bg-green-100 text-green-700 border-green-200",
};

export default function DrugReference() {
  const [search, setSearch] = useState("");
  const [selectedDrug, setSelectedDrug] = useState(null);
  const [existingMeds, setExistingMeds] = useState("");
  const [plannedDrugs, setPlannedDrugs] = useState("");
  const [interactions, setInteractions] = useState(null);
  const [interLoading, setInterLoading] = useState(false);
  const [interError, setInterError] = useState(null);
  const [activeTab, setActiveTab] = useState("reference"); // 'reference' | 'checker'

  const filtered = DENTAL_DRUGS.filter(
    (d) =>
      d.genericName.toLowerCase().includes(search.toLowerCase()) ||
      d.brandNames.some((b) =>
        b.toLowerCase().includes(search.toLowerCase()),
      ) ||
      d.class.toLowerCase().includes(search.toLowerCase()),
  );

  const handleCheck = async () => {
    if (!existingMeds.trim() || !plannedDrugs.trim()) return;
    setInterLoading(true);
    setInterError(null);
    setInteractions(null);
    try {
      const result = await checkDrugInteractions(existingMeds, plannedDrugs);
      setInteractions(result);
    } catch (err) {
      setInterError(
        err.message === "GEMINI_KEY_MISSING"
          ? "Gemini API key required for interaction checking."
          : `Error: ${err.message}`,
      );
    } finally {
      setInterLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="bg-white border-b border-dental-border px-5 py-3">
          <h1 className="text-sm font-bold text-dental-text">
            Drug Reference + Interaction Checker
          </h1>
          <p className="text-xs text-dental-text-secondary">
            Evidence-based dental prescribing guide for the Indian market
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b border-dental-border px-5 flex gap-1">
          {[
            ["reference", "Drug Reference"],
            ["checker", "Interaction Checker"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                activeTab === key
                  ? "border-dental-blue text-dental-blue"
                  : "border-transparent text-dental-text-secondary hover:text-dental-text"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === "reference" ? (
          <div className="flex-1 overflow-hidden flex">
            {/* Drug List */}
            <div className="w-64 border-r border-dental-border flex flex-col bg-white">
              <div className="p-3 border-b border-dental-border">
                <div className="relative">
                  <Search
                    size={13}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-dental-text-secondary"
                  />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search drugs..."
                    className="input-field pl-8 text-xs"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-dental-border">
                {filtered.map((drug) => (
                  <button
                    key={drug.id}
                    onClick={() => setSelectedDrug(drug)}
                    className={`w-full px-4 py-3 text-left transition-colors ${
                      selectedDrug?.id === drug.id
                        ? "bg-dental-blue-light"
                        : "hover:bg-dental-surface"
                    }`}
                  >
                    <p
                      className={`text-xs font-semibold ${selectedDrug?.id === drug.id ? "text-dental-blue" : "text-dental-text"}`}
                    >
                      {drug.genericName}
                    </p>
                    <p className="text-[10px] text-dental-text-secondary">
                      {drug.class}
                    </p>
                    <p className="text-[10px] text-dental-text-secondary mt-0.5">
                      {drug.brandNames.slice(0, 3).join(", ")}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Drug Detail */}
            <div className="flex-1 overflow-y-auto p-5">
              {selectedDrug ? (
                <div className="space-y-4 max-w-2xl animate-fade-in">
                  <div>
                    <h2 className="text-base font-bold text-dental-text">
                      {selectedDrug.genericName}
                    </h2>
                    <p className="text-xs text-dental-text-secondary mt-0.5">
                      {selectedDrug.class}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {selectedDrug.brandNames.map((b) => (
                        <span key={b} className="tag-pill">
                          {b}
                        </span>
                      ))}
                    </div>
                  </div>

                  {[
                    {
                      label: "Mechanism of Action",
                      value: selectedDrug.mechanism,
                    },
                    {
                      label: "Common Dental Use",
                      value: selectedDrug.commonDentalUse,
                    },
                  ].map(({ label, value }) => (
                    <div key={label} className="card p-3">
                      <p className="text-[10px] font-bold text-dental-text-secondary uppercase tracking-wide mb-1">
                        {label}
                      </p>
                      <p className="text-xs text-dental-text">{value}</p>
                    </div>
                  ))}

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      {
                        label: "Dental Dose (Adult)",
                        value: selectedDrug.dentalDose,
                        color: "border-dental-blue",
                      },
                      {
                        label: "Paediatric Dose",
                        value: selectedDrug.paediatricDose,
                        color: "border-green-400",
                      },
                      {
                        label: "Renal Adjustment",
                        value: selectedDrug.renalAdjustment,
                        color: "border-amber-400",
                      },
                      {
                        label: "Hepatic Adjustment",
                        value: selectedDrug.hepaticAdjustment,
                        color: "border-purple-400",
                      },
                    ].map(({ label, value, color }) => (
                      <div
                        key={label}
                        className={`card p-3 border-l-4 ${color}`}
                      >
                        <p className="text-[10px] font-bold text-dental-text-secondary uppercase tracking-wide mb-1">
                          {label}
                        </p>
                        <p className="text-xs text-dental-text">{value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="card p-3 border-l-4 border-red-400">
                      <p className="text-[10px] font-bold text-red-600 uppercase tracking-wide mb-2">
                        Contraindications
                      </p>
                      <ul className="space-y-1">
                        {selectedDrug.contraindications.map((c) => (
                          <li
                            key={c}
                            className="text-xs text-dental-text flex items-start gap-1.5"
                          >
                            <X
                              size={10}
                              className="text-red-500 shrink-0 mt-0.5"
                            />
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="card p-3 border-l-4 border-amber-400">
                      <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wide mb-2">
                        Side Effects
                      </p>
                      <ul className="space-y-1">
                        {selectedDrug.sideEffects.map((s) => (
                          <li
                            key={s}
                            className="text-xs text-dental-text flex items-start gap-1.5"
                          >
                            <AlertCircle
                              size={10}
                              className="text-amber-500 shrink-0 mt-0.5"
                            />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-dental-text-secondary">
                  <div className="text-center">
                    <Search size={32} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Select a drug from the list</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Interaction Checker
          <div className="flex-1 overflow-y-auto p-5">
            <div className="max-w-2xl space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-2">
                <Info size={14} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  Enter the patient's existing systemic medications and your
                  planned dental prescription. The AI will check for
                  interactions.
                </p>
              </div>

              <div className="card p-4 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-dental-text block mb-1.5">
                    Patient's Existing Medications
                  </label>
                  <textarea
                    value={existingMeds}
                    onChange={(e) => setExistingMeds(e.target.value)}
                    placeholder="e.g., Warfarin 5mg OD, Metformin 500mg BD, Amlodipine 5mg OD, sertraline 50mg OD..."
                    className="input-field resize-none text-xs"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-dental-text block mb-1.5">
                    Planned Dental Prescription
                  </label>
                  <textarea
                    value={plannedDrugs}
                    onChange={(e) => setPlannedDrugs(e.target.value)}
                    placeholder="e.g., Ibuprofen 400mg TDS, Amoxicillin 500mg TDS, Lignocaine with adrenaline 2%..."
                    className="input-field resize-none text-xs"
                    rows={3}
                  />
                </div>
                <button
                  onClick={handleCheck}
                  disabled={
                    !existingMeds.trim() || !plannedDrugs.trim() || interLoading
                  }
                  className="btn-primary w-full justify-center"
                >
                  {interLoading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Checking
                      interactions...
                    </>
                  ) : (
                    "Check Drug Interactions"
                  )}
                </button>
              </div>

              {interError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                  <p className="text-xs text-red-700">{interError}</p>
                </div>
              )}

              {interactions && (
                <div className="space-y-3 animate-slide-in">
                  {/* Summary Banner */}
                  <div
                    className={`rounded-xl p-4 border ${
                      interactions.safeToAdminister === false
                        ? "bg-red-50 border-red-200"
                        : interactions.interactions?.length > 0
                          ? "bg-amber-50 border-amber-200"
                          : "bg-green-50 border-green-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {interactions.safeToAdminister === false ? (
                        <AlertTriangle size={15} className="text-red-600" />
                      ) : interactions.interactions?.length > 0 ? (
                        <AlertCircle size={15} className="text-amber-600" />
                      ) : (
                        <CheckCircle size={15} className="text-green-600" />
                      )}
                      <p
                        className={`text-sm font-bold ${
                          interactions.safeToAdminister === false
                            ? "text-red-700"
                            : interactions.interactions?.length > 0
                              ? "text-amber-700"
                              : "text-green-700"
                        }`}
                      >
                        {interactions.safeToAdminister === false
                          ? "Caution — Significant Interactions Detected"
                          : interactions.interactions?.length > 0
                            ? "Interactions Found — Review Before Prescribing"
                            : "No Significant Interactions Detected"}
                      </p>
                    </div>
                    <p className="text-xs text-dental-text">
                      {interactions.summary}
                    </p>
                  </div>

                  {/* Interaction Cards */}
                  {interactions.interactions?.map((inter, i) => (
                    <div
                      key={i}
                      className={`card p-4 border-l-4 ${
                        inter.severity === "Major"
                          ? "border-red-500"
                          : inter.severity === "Moderate"
                            ? "border-amber-500"
                            : "border-green-500"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-dental-text">
                            {inter.drug1}
                          </p>
                          <span className="text-dental-text-secondary">×</span>
                          <p className="text-xs font-bold text-dental-text">
                            {inter.drug2}
                          </p>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${SEVERITY_STYLES[inter.severity]}`}
                        >
                          {inter.severity}
                        </span>
                      </div>
                      <div className="space-y-1.5 text-xs text-dental-text-secondary">
                        <p>
                          <strong className="text-dental-text">Effect:</strong>{" "}
                          {inter.effect}
                        </p>
                        <p>
                          <strong className="text-dental-text">
                            Mechanism:
                          </strong>{" "}
                          {inter.mechanism}
                        </p>
                        <p
                          className={`font-semibold ${
                            inter.recommendation === "avoid"
                              ? "text-red-600"
                              : inter.recommendation === "monitor"
                                ? "text-amber-600"
                                : "text-green-600"
                          }`}
                        >
                          Action:{" "}
                          {inter.recommendation
                            ?.replace(/-/g, " ")
                            .toUpperCase()}
                          {inter.alternative
                            ? ` — Consider: ${inter.alternative}`
                            : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
