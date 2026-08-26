import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import { TRACKED_SPECIMEN_FIELDS, calculateSpecimenCompleteness } from "../lib/dataQuality";

const TRACKED_FIELDS = TRACKED_SPECIMEN_FIELDS;

export default function DataQualityPage() {
  const navigate = useNavigate();
  const [specimens, setSpecimens] = useState([]);
  const [measurements, setMeasurements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data: specData } = await supabase.from("specimens").select("*");
    const { data: measData } = await supabase.from("measurements").select("*");
    setSpecimens(specData || []);
    setMeasurements(measData || []);
    setLoading(false);
  }

  // ── Calculations ──

  // Completeness per specimen
  function getCompleteness(specimen) {
    return calculateSpecimenCompleteness(specimen);
  }

  const totalSpecimens = specimens.length;
  const avgCompleteness = totalSpecimens === 0 ? 0 :
    Math.round(specimens.reduce((sum, s) => sum + getCompleteness(s), 0) / totalSpecimens);

  // Missing fields summary
  const missingFieldCounts = {};
  TRACKED_FIELDS.forEach((field) => {
    missingFieldCounts[field] = specimens.filter(
      (s) => !s[field] || s[field] === ""
    ).length;
  });

  // Incomplete specimens (completeness < 50%)
  const incompleteSpecimens = specimens.filter((s) => getCompleteness(s) < 50);

  // Duplicate specimen_ids
  const idCounts = {};
  specimens.forEach((s) => {
    idCounts[s.specimen_id] = (idCounts[s.specimen_id] || 0) + 1;
  });
  const duplicates = Object.entries(idCounts)
    .filter(([, count]) => count > 1)
    .map(([id, count]) => ({ id, count }));

  // Specimens with measurements
  const specimenIdsWithMeasurements = new Set(measurements.map((m) => m.specimen_id));
  const withoutMeasurements = specimens.filter(
    (s) => !specimenIdsWithMeasurements.has(s.specimen_id)
  );

  // Anomalies — year outliers
  const yearAnomalies = specimens.filter((s) => {
    const y = parseInt(s.excavation_year);
    return s.excavation_year && (y < 1800 || y > new Date().getFullYear());
  });

  // Overall health score
  const healthScore = Math.round(
    (avgCompleteness * 0.5) +
    (duplicates.length === 0 ? 25 : 0) +
    (yearAnomalies.length === 0 ? 15 : 0) +
    (incompleteSpecimens.length / Math.max(totalSpecimens, 1) < 0.2 ? 10 : 0)
  );

  const healthColor = healthScore >= 80 ? "text-emerald-400" :
    healthScore >= 60 ? "text-yellow-400" : "text-red-400";

  const healthBg = healthScore >= 80 ? "bg-emerald-500/10 border-emerald-500/20" :
    healthScore >= 60 ? "bg-yellow-500/10 border-yellow-500/20" : "bg-red-500/10 border-red-500/20";

  const completenessColor = (pct) =>
    pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-yellow-500" : "bg-red-500";

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1a14] text-white flex items-center justify-center">
        <svg className="animate-spin w-6 h-6 mr-3 text-emerald-400" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        <span className="text-white/40">Analysing data quality...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1a14] text-white">

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
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 text-xs text-white/30 hover:text-white transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <span className="text-xs text-white/30 tracking-widest uppercase">Data Quality</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs tracking-[0.2em] uppercase text-emerald-400/80">Analytics</span>
            </div>
            <h1 className="text-3xl font-bold text-white">Data Quality Dashboard</h1>
            <p className="text-white/40 text-sm mt-1">
              Monitor data completeness, anomalies, and quality issues
            </p>
          </div>

          {/* Health Score */}
          <div className={`border rounded-2xl px-6 py-4 text-center ${healthBg}`}>
            <p className="text-xs text-white/30 uppercase tracking-wider mb-1">Health Score</p>
            <p className={`text-4xl font-bold ${healthColor}`}>{healthScore}</p>
            <p className="text-xs text-white/30 mt-1">out of 100</p>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Specimens", value: totalSpecimens, color: "text-white" },
            { label: "Avg Completeness", value: `${avgCompleteness}%`, color: avgCompleteness >= 70 ? "text-emerald-400" : "text-yellow-400" },
            { label: "Duplicates", value: duplicates.length, color: duplicates.length === 0 ? "text-emerald-400" : "text-red-400" },
            { label: "Anomalies", value: yearAnomalies.length + incompleteSpecimens.length, color: "text-yellow-400" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 text-center">
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-white/30 uppercase tracking-wider mt-2">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white/[0.03] border border-white/10 rounded-xl p-1 w-fit">
          {[
            { key: "overview", label: "Overview" },
            { key: "missing", label: "Missing Fields" },
            { key: "incomplete", label: `Incomplete (${incompleteSpecimens.length})` },
            { key: "duplicates", label: `Duplicates (${duplicates.length})` },
            { key: "anomalies", label: `Anomalies (${yearAnomalies.length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-emerald-600 text-white"
                  : "text-white/40 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">

            {/* Completeness bar */}
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
              <p className="text-xs text-white/30 uppercase tracking-widest mb-5">
                Overall Data Completeness
              </p>
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${completenessColor(avgCompleteness)}`}
                    style={{ width: `${avgCompleteness}%` }}
                  />
                </div>
                <span className="text-lg font-bold text-white w-12">{avgCompleteness}%</span>
              </div>

              {/* Field by field */}
              <div className="space-y-3">
                {TRACKED_FIELDS.map((field) => {
                  const missing = missingFieldCounts[field];
                  const filled = totalSpecimens - missing;
                  const pct = totalSpecimens === 0 ? 0 : Math.round((filled / totalSpecimens) * 100);
                  return (
                    <div key={field} className="flex items-center gap-3">
                      <span className="text-xs text-white/40 w-36 capitalize">{field.replace(/_/g, " ")}</span>
                      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${completenessColor(pct)}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-white/30 w-10 text-right">{pct}%</span>
                      {missing > 0 && (
                        <span className="text-[10px] text-red-400/60">{missing} missing</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Summary alerts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`border rounded-xl p-4 ${withoutMeasurements.length === 0 ? "bg-emerald-500/5 border-emerald-500/20" : "bg-yellow-500/5 border-yellow-500/20"}`}>
                <p className="text-xs text-white/30 uppercase tracking-wider mb-1">Without Measurements</p>
                <p className={`text-2xl font-bold ${withoutMeasurements.length === 0 ? "text-emerald-400" : "text-yellow-400"}`}>
                  {withoutMeasurements.length}
                </p>
                <p className="text-xs text-white/30 mt-1">specimens have no measurements</p>
              </div>
              <div className={`border rounded-xl p-4 ${duplicates.length === 0 ? "bg-emerald-500/5 border-emerald-500/20" : "bg-red-500/5 border-red-500/20"}`}>
                <p className="text-xs text-white/30 uppercase tracking-wider mb-1">Duplicate IDs</p>
                <p className={`text-2xl font-bold ${duplicates.length === 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {duplicates.length}
                </p>
                <p className="text-xs text-white/30 mt-1">duplicate specimen IDs found</p>
              </div>
            </div>
          </div>
        )}

        {/* Missing Fields Tab */}
        {activeTab === "missing" && (
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
            <p className="text-xs text-white/30 uppercase tracking-widest mb-5">Missing Fields Summary</p>
            <div className="space-y-4">
              {TRACKED_FIELDS.map((field) => {
                const missing = missingFieldCounts[field];
                const pct = totalSpecimens === 0 ? 0 : Math.round((missing / totalSpecimens) * 100);
                return (
                  <div key={field} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                    <div>
                      <p className="text-sm text-white/70 capitalize">{field.replace(/_/g, " ")}</p>
                      <p className="text-xs text-white/30 mt-0.5">{missing} of {totalSpecimens} records missing</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${completenessColor(100 - pct)}`}
                          style={{ width: `${100 - pct}%` }}
                        />
                      </div>
                      <span className={`text-sm font-mono ${missing === 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {pct}% missing
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Incomplete Tab */}
        {activeTab === "incomplete" && (
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10">
              <p className="text-xs text-white/30 uppercase tracking-widest">
                Specimens with less than 50% completeness
              </p>
            </div>
            {incompleteSpecimens.length === 0 ? (
              <div className="p-8 text-center text-white/30">
                <p className="text-lg mb-1">🎉 All specimens are well filled!</p>
                <p className="text-sm">No specimens below 50% completeness</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <th className="text-left px-5 py-3 text-xs text-white/30 uppercase tracking-wider">Specimen ID</th>
                    <th className="text-left px-5 py-3 text-xs text-white/30 uppercase tracking-wider">Skeleton Code</th>
                    <th className="text-left px-5 py-3 text-xs text-white/30 uppercase tracking-wider">Site</th>
                    <th className="text-left px-5 py-3 text-xs text-white/30 uppercase tracking-wider">Completeness</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {incompleteSpecimens.map((s, i) => {
                    const pct = getCompleteness(s);
                    return (
                      <tr
                        key={s.specimen_id}
                        className={`border-b border-white/5 hover:bg-white/[0.04] cursor-pointer ${i % 2 === 0 ? "" : "bg-white/[0.01]"}`}
                        onClick={() => navigate(`/specimens/${s.specimen_id}`)}
                      >
                        <td className="px-5 py-3.5 font-mono text-emerald-400 text-xs">{s.specimen_id}</td>
                        <td className="px-5 py-3.5 text-white/60">{s.skeleton_code || "—"}</td>
                        <td className="px-5 py-3.5 text-white/60">{s.site_name || "—"}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full bg-red-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs text-red-400">{pct}%</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-white/20">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Duplicates Tab */}
        {activeTab === "duplicates" && (
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10">
              <p className="text-xs text-white/30 uppercase tracking-widest">Duplicate Specimen IDs</p>
            </div>
            {duplicates.length === 0 ? (
              <div className="p-8 text-center text-white/30">
                <p className="text-lg mb-1">✅ No duplicates found!</p>
                <p className="text-sm">All specimen IDs are unique</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <th className="text-left px-5 py-3 text-xs text-white/30 uppercase tracking-wider">Specimen ID</th>
                    <th className="text-left px-5 py-3 text-xs text-white/30 uppercase tracking-wider">Count</th>
                    <th className="text-left px-5 py-3 text-xs text-white/30 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {duplicates.map((d, i) => (
                    <tr key={d.id} className={`border-b border-white/5 ${i % 2 === 0 ? "" : "bg-white/[0.01]"}`}>
                      <td className="px-5 py-3.5 font-mono text-red-400 text-xs">{d.id}</td>
                      <td className="px-5 py-3.5 text-white/60">{d.count} records</td>
                      <td className="px-5 py-3.5">
                        <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded-full border bg-red-500/10 text-red-400 border-red-500/20">
                          Duplicate
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Anomalies Tab */}
        {activeTab === "anomalies" && (
          <div className="space-y-4">
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/10">
                <p className="text-xs text-white/30 uppercase tracking-widest">Year Anomalies (outside 1800 - {new Date().getFullYear()})</p>
              </div>
              {yearAnomalies.length === 0 ? (
                <div className="p-8 text-center text-white/30">
                  <p className="text-lg mb-1">✅ No year anomalies!</p>
                  <p className="text-sm">All excavation years are within valid range</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.02]">
                      <th className="text-left px-5 py-3 text-xs text-white/30 uppercase tracking-wider">Specimen ID</th>
                      <th className="text-left px-5 py-3 text-xs text-white/30 uppercase tracking-wider">Year</th>
                      <th className="text-left px-5 py-3 text-xs text-white/30 uppercase tracking-wider">Issue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yearAnomalies.map((s, i) => (
                      <tr
                        key={s.specimen_id}
                        className={`border-b border-white/5 hover:bg-white/[0.04] cursor-pointer ${i % 2 === 0 ? "" : "bg-white/[0.01]"}`}
                        onClick={() => navigate(`/specimens/${s.specimen_id}`)}
                      >
                        <td className="px-5 py-3.5 font-mono text-emerald-400 text-xs">{s.specimen_id}</td>
                        <td className="px-5 py-3.5 text-red-400 font-mono">{s.excavation_year}</td>
                        <td className="px-5 py-3.5 text-white/40 text-xs">Year outside valid range (1800-{new Date().getFullYear()})</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
