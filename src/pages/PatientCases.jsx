import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { listCases } from "../lib/cases";
import { Users, Search, Clock, Circle, Plus } from "lucide-react";

const SEV_COLORS = {
  EMERGENCY: "bg-red-500",
  URGENT: "bg-amber-500",
  ROUTINE: "bg-green-500",
};

const STATUS_STYLES = {
  active: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  review: "bg-amber-100 text-amber-700",
};

export default function PatientCases() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [cases, setCases] = useState([]);

  useEffect(() => {
    const loadCases = async () => {
      const storedCases = await listCases();
      setCases(storedCases);
    };

    loadCases();
  }, []);

  const filtered = cases.filter(
    (c) =>
      (filter === "All" || c.severity === filter || c.status === filter) &&
      ((c.patientName || "").toLowerCase().includes(search.toLowerCase()) ||
        (c.chiefComplaint || "").toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <AppLayout>
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="bg-white border-b border-dental-border px-5 py-3 flex items-center">
          <div className="flex-1">
            <h1 className="text-sm font-bold text-dental-text flex items-center gap-2">
              <Users size={15} className="text-dental-blue" /> Patient Cases
            </h1>
            <p className="text-xs text-dental-text-secondary">
              All clinical cases and their AI pathways
            </p>
          </div>
          <button
            onClick={() => navigate("/workspace")}
            className="btn-primary text-xs py-1.5"
          >
            <Plus size={13} /> New Case
          </button>
        </div>

        <div className="bg-white border-b border-dental-border px-5 py-2 flex gap-3 items-center">
          <div className="relative flex-1 max-w-xs">
            <Search
              size={12}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-dental-text-secondary"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search cases..."
              className="input-field pl-8 text-xs py-1.5"
            />
          </div>
          <div className="flex gap-2">
            {[
              "All",
              "EMERGENCY",
              "URGENT",
              "ROUTINE",
              "active",
              "completed",
              "review",
            ].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  filter === f
                    ? "bg-dental-blue text-white border-dental-blue"
                    : "text-dental-text-secondary border-dental-border hover:border-dental-blue"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {filtered.length === 0 && (
              <div className="card p-4 text-center">
                <p className="text-sm font-semibold text-dental-text">
                  No patient cases yet
                </p>
                <p className="text-xs text-dental-text-secondary mt-1">
                  Generate a clinical pathway from Workspace to create the first
                  case.
                </p>
              </div>
            )}
            {filtered.map((c) => (
              <div
                key={c.id}
                onClick={() => navigate(`/cases/${c.id}`)}
                className="card p-4 flex items-center gap-4 hover:shadow-panel transition-shadow cursor-pointer"
              >
                <div className="w-10 h-10 bg-dental-blue rounded-full flex items-center justify-center shrink-0">
                  <span className="text-white text-xs font-bold">
                    {c.patientName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-dental-text">
                      {c.patientName}
                    </h3>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLES[c.status]}`}
                    >
                      {c.status}
                    </span>
                  </div>
                  <p className="text-xs text-dental-text-secondary truncate mt-0.5">
                    {c.chiefComplaint}
                  </p>
                  <p className="text-[10px] text-dental-text-secondary flex items-center gap-1 mt-1">
                    <Clock size={9} />
                    {new Date(c.timestamp).toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${SEV_COLORS[c.severity]}`}
                  />
                  <span className="text-xs font-medium text-dental-text-secondary">
                    {c.severity}
                  </span>
                </div>
                <span className="text-xs font-medium text-dental-text-secondary">
                  {c.age}y · {c.sex}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
