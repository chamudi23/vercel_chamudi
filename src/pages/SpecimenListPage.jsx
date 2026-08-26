import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

const TIME_PERIODS = [
  "All", "Mesolithic", "Neolithic", "Bronze Age", "Iron Age",
  "Protohistoric", "Early Historic", "Medieval", "Unknown",
];

export default function SpecimenListPage() {
  const navigate = useNavigate();
  const [specimens, setSpecimens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterSpecimenId, setFilterSpecimenId] = useState("");
  const [filterSkeletonCode, setFilterSkeletonCode] = useState("");
  const [filterBoneType, setFilterBoneType] = useState("All");
  const [filterSite, setFilterSite] = useState("");
  const [filterPeriod, setFilterPeriod] = useState("All");

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

  const boneTypeOptions = [
    "All",
    ...new Set(specimens.map((s) => s.bone_type).filter(Boolean).sort()),
  ];

  const filtered = specimens.filter((s) => {
    const matchSpecimenId =
      !filterSpecimenId ||
      s.specimen_id?.toLowerCase().includes(filterSpecimenId.toLowerCase());
    const matchSkeletonCode =
      !filterSkeletonCode ||
      s.skeleton_code?.toLowerCase().includes(filterSkeletonCode.toLowerCase());
    const matchBoneType = filterBoneType === "All" || s.bone_type === filterBoneType;
    const matchSite =
      !filterSite || s.site_name?.toLowerCase().includes(filterSite.toLowerCase());
    const matchPeriod = filterPeriod === "All" || s.time_period === filterPeriod;

    return matchSpecimenId && matchSkeletonCode && matchBoneType && matchSite && matchPeriod;
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6">
          <div className="space-y-1.5">
            <label className="block text-[10px] uppercase tracking-[0.18em] text-white/40">Specimen ID</label>
            <input
              type="text"
              placeholder="Filter by ID"
              value={filterSpecimenId}
              onChange={(e) => setFilterSpecimenId(e.target.value)}
              className="w-full bg-[#0f1a14] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] uppercase tracking-[0.18em] text-white/40">Skeleton Code</label>
            <input
              type="text"
              placeholder="Filter by code"
              value={filterSkeletonCode}
              onChange={(e) => setFilterSkeletonCode(e.target.value)}
              className="w-full bg-[#0f1a14] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] uppercase tracking-[0.18em] text-white/40">Bone Category</label>
            <select
              value={filterBoneType}
              onChange={(e) => setFilterBoneType(e.target.value)}
              className={selectClass + " w-full"}
            >
              {boneTypeOptions.map((boneType) => (
                <option key={boneType} value={boneType}>
                  {boneType === "All" ? "All Categories" : boneType}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] uppercase tracking-[0.18em] text-white/40">Site</label>
            <input
              type="text"
              placeholder="Filter by site"
              value={filterSite}
              onChange={(e) => setFilterSite(e.target.value)}
              className="w-full bg-[#0f1a14] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] uppercase tracking-[0.18em] text-white/40">Time Period</label>
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
              className={selectClass + " w-full"}
            >
              {TIME_PERIODS.map((t) => (
                <option key={t} value={t}>{t === "All" ? "All Periods" : t}</option>
              ))}
            </select>
          </div>
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
                  <th className="text-left px-5 py-3 text-xs text-white/30 uppercase tracking-wider font-medium">Bone Category</th>
                  <th className="text-left px-5 py-3 text-xs text-white/30 uppercase tracking-wider font-medium">Site</th>
                  <th className="text-left px-5 py-3 text-xs text-white/30 uppercase tracking-wider font-medium">Time Period</th>
                  <th className="text-left px-5 py-3 text-xs text-white/30 uppercase tracking-wider font-medium">Storage Location</th>
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
                    <td className="px-5 py-3.5 text-white/70">{s.bone_type || "—"}</td>
                    <td className="px-5 py-3.5 text-white/70">{s.site_name || "—"}</td>
                    <td className="px-5 py-3.5 text-white/50">{s.time_period || "—"}</td>
                    <td className="px-5 py-3.5 text-white/50">{s.location_stored || "—"}</td>
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
