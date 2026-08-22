import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

const TIME_PERIODS = [
  "All", "Mesolithic", "Neolithic", "Bronze Age", "Iron Age",
  "Protohistoric", "Early Historic", "Medieval", "Unknown",
];

const PRESERVATION_STATES = [
  "All", "Excellent", "Good", "Fair", "Poor", "Fragmentary",
];

export default function SpecimenListPage() {
  const navigate = useNavigate();
  const [specimens, setSpecimens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterPeriod, setFilterPeriod] = useState("All");
  const [filterPreservation, setFilterPreservation] = useState("All");
  const [filterDistrict, setFilterDistrict] = useState("");

  useEffect(() => {
    fetchSpecimens();
  }, []);

  async function fetchSpecimens() {
    setLoading(true);
    const { data, error } = await supabase
      .from("specimens")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setSpecimens(data || []);
    setLoading(false);
  }

  const filtered = specimens.filter((s) => {
    const matchSearch =
      !search ||
      s.specimen_id?.toLowerCase().includes(search.toLowerCase()) ||
      s.skeleton_code?.toLowerCase().includes(search.toLowerCase()) ||
      s.site_name?.toLowerCase().includes(search.toLowerCase());
    const matchPeriod = filterPeriod === "All" || s.time_period === filterPeriod;
    const matchPreservation = filterPreservation === "All" || s.preservation_state === filterPreservation;
    const matchDistrict = !filterDistrict || s.district?.toLowerCase().includes(filterDistrict.toLowerCase());
    return matchSearch && matchPeriod && matchPreservation && matchDistrict;
  });

  function exportCSV() {
    const headers = [
      "specimen_id", "skeleton_code", "site_name", "district",
      "province", "excavation_year", "time_period", "preservation_state",
      "location_stored", "burial_context", "notes",
    ];
    const rows = filtered.map((s) =>
      headers.map((h) => `"${(s[h] ?? "").toString().replace(/"/g, '""')}"`).join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "specimens_export.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const badgeColor = (state) => {
    const map = {
      Excellent: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      Good: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      Fair: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
      Poor: "bg-orange-500/20 text-orange-300 border-orange-500/30",
      Fragmentary: "bg-red-500/20 text-red-300 border-red-500/30",
    };
    return map[state] || "bg-white/10 text-white/40 border-white/10";
  };

  const selectClass = "bg-[#0f1a14] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors";

  return (
    <div className="min-h-screen bg-[#0f1a14] text-white">
      <style>{`select option { background-color: #0f1a14; color: white; }`}</style>

      {/* Top bar */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <button
          onClick={() => navigate("/minuri")}
          className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Module
        </button>
        <span className="text-xs text-white/30 tracking-widest uppercase">Specimen List</span>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs tracking-[0.2em] uppercase text-emerald-400/80">Records</span>
            </div>
            <h1 className="text-3xl font-bold text-white">Specimen Records</h1>
            <p className="text-white/40 text-sm mt-1">
              {filtered.length} of {specimens.length} specimens
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-white/60 hover:text-white transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </button>
            <button
              onClick={() => navigate("/specimens/add")}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-sm text-white font-medium transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Specimen
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
          <input
            type="text"
            placeholder="Search ID, code, site..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[#0f1a14] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          <select
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value)}
            className={selectClass}
          >
            {TIME_PERIODS.map((t) => (
              <option key={t} value={t}>{t === "All" ? "All Time Periods" : t}</option>
            ))}
          </select>
          <select
            value={filterPreservation}
            onChange={(e) => setFilterPreservation(e.target.value)}
            className={selectClass}
          >
            {PRESERVATION_STATES.map((s) => (
              <option key={s} value={s}>{s === "All" ? "All Preservation States" : s}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Filter by district..."
            value={filterDistrict}
            onChange={(e) => setFilterDistrict(e.target.value)}
            className="bg-[#0f1a14] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-white/30">
            <svg className="animate-spin w-6 h-6 mr-3" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            Loading specimens...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-white/30">
            <p className="text-lg mb-2">No specimens found</p>
            <p className="text-sm">Try adjusting your filters or add a new specimen</p>
            <button
              onClick={() => navigate("/specimens/add")}
              className="mt-4 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-sm text-white transition-colors"
            >
              Add First Specimen
            </button>
          </div>
        ) : (
          <div className="border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  <th className="text-left px-5 py-3 text-xs text-white/30 uppercase tracking-wider font-medium">Specimen ID</th>
                  <th className="text-left px-5 py-3 text-xs text-white/30 uppercase tracking-wider font-medium">Skeleton Code</th>
                  <th className="text-left px-5 py-3 text-xs text-white/30 uppercase tracking-wider font-medium">Site</th>
                  <th className="text-left px-5 py-3 text-xs text-white/30 uppercase tracking-wider font-medium">District</th>
                  <th className="text-left px-5 py-3 text-xs text-white/30 uppercase tracking-wider font-medium">Time Period</th>
                  <th className="text-left px-5 py-3 text-xs text-white/30 uppercase tracking-wider font-medium">Year</th>
                  <th className="text-left px-5 py-3 text-xs text-white/30 uppercase tracking-wider font-medium">Preservation</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  <tr
                    key={s.specimen_id}
                    onClick={() => navigate(`/specimens/${s.specimen_id}`)}
                    className={`border-b border-white/5 hover:bg-white/[0.04] cursor-pointer transition-colors ${i % 2 === 0 ? "" : "bg-white/[0.01]"}`}
                  >
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-emerald-400 text-xs">{s.specimen_id}</span>
                    </td>
                    <td className="px-5 py-3.5 text-white/70">{s.skeleton_code || "—"}</td>
                    <td className="px-5 py-3.5 text-white/70">{s.site_name || "—"}</td>
                    <td className="px-5 py-3.5 text-white/50">{s.district || "—"}</td>
                    <td className="px-5 py-3.5 text-white/50">{s.time_period || "—"}</td>
                    <td className="px-5 py-3.5 text-white/50">{s.excavation_year || "—"}</td>
                    <td className="px-5 py-3.5">
                      {s.preservation_state ? (
                        <span className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded-full border ${badgeColor(s.preservation_state)}`}>
                          {s.preservation_state}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-white/20">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
