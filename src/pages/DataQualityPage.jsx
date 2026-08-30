/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import { TRACKED_SPECIMEN_FIELDS, calculateSpecimenCompleteness } from "../lib/dataQuality";
import { hasStoredImage } from "../lib/imageDocumentationDashboard";
import { auditDataQuality, QUALITY_CATEGORIES, QUALITY_SEVERITIES } from "../utils/dataQualityRules";

const TRACKED_FIELDS = TRACKED_SPECIMEN_FIELDS;
const TRACKED_FIELD_METADATA = {
  site_name: { label: "Site name", type: "Text" },
  district: { label: "District", type: "Select" },
  province: { label: "Province", type: "Select" },
  excavation_year: { label: "Excavation year", type: "Whole number" },
  time_period: { label: "Time period", type: "Select" },
  preservation_state: { label: "Preservation state", type: "Select" },
  location_stored: { label: "Storage location", type: "Text" },
  burial_context: { label: "Burial context", type: "Text" },
  notes: { label: "Notes", type: "Text area" },
};
const FORM_COMPLETENESS_FIELDS = [
  { source: "specimen", field: "specimen_id", label: "Specimen ID", type: "Text" },
  { source: "specimen", field: "skeleton_code", label: "Skeleton code", type: "Text" },
  { source: "specimen", field: "bone_type", label: "Bone category", type: "Select" },
  { source: "specimen", field: "side", label: "Side", type: "Select" },
  ...Object.entries(TRACKED_FIELD_METADATA).map(([field, metadata]) => ({ source: "specimen", field, ...metadata })),
  { source: "specimen", field: "age_estimate", label: "Age estimate", type: "Text" },
  { source: "specimen", field: "sex_estimate", label: "Sex estimate", type: "Select" },
  { source: "specimen", field: "height_estimate", label: "Height estimate", type: "Decimal number (cm)" },
  { source: "measurement", field: "measurement_type", label: "Measurement type", type: "Select" },
  { source: "measurement", field: "value", label: "Measurement value", type: "Decimal number" },
  { source: "measurement", field: "unit", label: "Measurement unit", type: "Select" },
  { source: "measurement", field: "notes", label: "Measurement notes", type: "Text" },
  { source: "excavation", field: "excavation_date", label: "Excavation date", type: "Date" },
  { source: "excavation", field: "depth_found", label: "Depth found", type: "Decimal number (m)" },
  { source: "excavation", field: "excavator_name", label: "Excavator name", type: "Text" },
  { source: "excavation", field: "excavation_notes", label: "Excavation notes", type: "Text area" },
  { source: "dating", field: "dating_method", label: "Dating method", type: "Select" },
  { source: "dating", field: "date_result", label: "Date result", type: "Text" },
  { source: "dating", field: "date_range_min", label: "Date range minimum", type: "Whole number (BP)" },
  { source: "dating", field: "date_range_max", label: "Date range maximum", type: "Whole number (BP)" },
  { source: "dating", field: "lab_name", label: "Lab name", type: "Text" },
  { source: "dating", field: "result_notes", label: "Result notes", type: "Text" },
];
const STATUS_STYLES = {
  valid: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
  warning: "bg-amber-500/10 text-amber-300 border-amber-500/30",
  error: "bg-red-500/10 text-red-300 border-red-500/30",
};
const STATUS_DOT = { valid: "bg-emerald-400", warning: "bg-amber-400", error: "bg-red-400" };

function isProvided(value) {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

function StatusBadge({ status }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${STATUS_STYLES[status]}`}><span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[status]}`} />{status}</span>;
}

function QualityIssueList({ issues, ruleColor = "text-emerald-200", compact = false }) {
  if (!issues.length) return null;
  return (
    <ul className={`mt-4 ${compact ? "space-y-2" : "space-y-3"}`}>
      {issues.map((issue, index) => (
        <li key={`${issue.ruleId}-${index}`} className="rounded-xl border border-white/10 bg-black/10 p-3 text-xs text-white/70">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`font-mono ${ruleColor}`}>{issue.ruleId}</span>
            <span className={issue.status === "error" ? "text-red-300" : "text-amber-300"}>{issue.severity}</span>
            {!compact && <span className="text-white/35">{issue.category}</span>}
          </div>
          <p className="mt-2 font-medium text-white/80">{issue.ruleName}</p>
          <p className="mt-1 leading-5">{issue.message}</p>
          {!compact && (
            <dl className="mt-2 grid gap-1 text-[11px] sm:grid-cols-2">
              <div><dt className="inline text-white/30">Actual: </dt><dd className="inline">{issue.actualValue}</dd></div>
              <div><dt className="inline text-white/30">Expected: </dt><dd className="inline">{issue.expectedValue}</dd></div>
            </dl>
          )}
          <p className="mt-2 text-[11px] text-emerald-100/65"><span className="text-white/30">Recommendation: </span>{issue.recommendation}</p>
        </li>
      ))}
    </ul>
  );
}

export default function DataQualityPage() {
  const navigate = useNavigate();
  const [specimens, setSpecimens] = useState([]);
  const [measurements, setMeasurements] = useState([]);
  const [sites, setSites] = useState([]);
  const [excavationRecords, setExcavationRecords] = useState([]);
  const [labDatingRecords, setLabDatingRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [deletingRecord, setDeletingRecord] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [qualitySearch, setQualitySearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    setLoadError("");
    const [specimenResult, measurementResult, siteResult, excavationResult, datingResult] = await Promise.all([
      supabase.from("specimens").select("*"),
      supabase.from("measurements").select("*"),
      supabase.from("sites").select("id, site_id, site_name, district, province, latitude, longitude, site_type, excavation_year, time_period, risk_level, description, protected_status, image_url, created_at"),
      supabase.from("excavation_records").select("*"),
      supabase.from("laboratory_dating_results").select("*"),
    ]);
    const failed = [specimenResult, measurementResult, siteResult, excavationResult, datingResult]
      .map((result) => result.error?.message)
      .filter(Boolean);
    setSpecimens(specimenResult.data || []);
    setMeasurements(measurementResult.data || []);
    setSites(siteResult.data || []);
    setExcavationRecords(excavationResult.data || []);
    setLabDatingRecords(datingResult.data || []);
    setLoadError(failed.join(" "));
    setLastUpdated(new Date());
    setLoading(false);
  }

  // ── Calculations ──

  // Completeness per specimen
  function getCompleteness(specimen) {
    return calculateSpecimenCompleteness(specimen);
  }

  const totalSpecimens = specimens.length;

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

  const measurementsBySpecimen = new Map();
  measurements.forEach((measurement) => {
    const rows = measurementsBySpecimen.get(measurement.specimen_id) || [];
    rows.push(measurement);
    measurementsBySpecimen.set(measurement.specimen_id, rows);
  });
  const excavationBySpecimen = new Map(excavationRecords.map((record) => [record.specimen_id, record]));
  const labDatingBySpecimen = new Map(labDatingRecords.map((record) => [record.specimen_id, record]));
  const getFormFieldCompleteness = (definition) => {
    const applicableSpecimens = definition.boneType
      ? specimens.filter((specimen) => specimen.bone_type === definition.boneType)
      : specimens;
    const filled = applicableSpecimens.filter((specimen) => {
      if (definition.source === "specimen") return isProvided(specimen[definition.field]);
      if (definition.source === "measurement") return (measurementsBySpecimen.get(specimen.specimen_id) || []).some((row) => isProvided(row[definition.field]));
      if (definition.source === "excavation") return isProvided(excavationBySpecimen.get(specimen.specimen_id)?.[definition.field]);
      if (definition.source === "dating") return isProvided(labDatingBySpecimen.get(specimen.specimen_id)?.[definition.field]);
      return false;
    }).length;
    const total = applicableSpecimens.length;
    return { filled, total, pct: total === 0 ? null : Math.round((filled / total) * 100) };
  };
  const applicableFormFieldPercentages = FORM_COMPLETENESS_FIELDS
    .map(getFormFieldCompleteness)
    .map(({ pct }) => pct)
    .filter((pct) => pct !== null);
  const avgCompleteness = applicableFormFieldPercentages.length === 0
    ? 0
    : Math.round(applicableFormFieldPercentages.reduce((sum, pct) => sum + pct, 0) / applicableFormFieldPercentages.length);

  // The dashboard intentionally audits specimens, measurements, and canonical
  // Sites records. It does not query or inspect skeletal_inputs.
  const {
    audits: qualityAudits,
    siteAudits,
    orphanIssues,
    qualityCounts,
    siteQualityCounts,
    severityCounts,
    categoryScores,
    ruleCounts,
    allIssues,
  } = auditDataQuality({ specimens, measurements, sites });
  const linkedSiteNames = new Set(sites.map((site) => String(site.site_name || "").trim().toLowerCase()).filter(Boolean));
  const linkedSpecimens = specimens.filter((specimen) => linkedSiteNames.has(String(specimen.site_name || "").trim().toLowerCase())).length;
  const siteLinkRate = totalSpecimens === 0 ? 0 : Math.round((linkedSpecimens / totalSpecimens) * 100);
  const siteRecordsNeedingReview = siteAudits.filter((audit) => audit.status !== "valid");
  const normalizedSearch = qualitySearch.trim().toLowerCase();
  const filteredQualityAudits = qualityAudits.filter(({ specimen, issues }) => {
    const matchesSearch = !normalizedSearch || [specimen.specimen_id, specimen.skeleton_code, specimen.bone_type, specimen.site_name]
      .some((value) => String(value || "").toLowerCase().includes(normalizedSearch));
    const matchesSeverity = severityFilter === "ALL" || issues.some((issue) => issue.severity === severityFilter);
    const matchesCategory = categoryFilter === "ALL" || issues.some((issue) => issue.category === categoryFilter);
    return matchesSearch && matchesSeverity && matchesCategory;
  });

  function exportQualityReport() {
    const escapeCsv = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const header = ["record_type", "record_id", "rule_id", "severity", "category", "problem", "actual", "expected", "recommendation"];
    const rows = allIssues.map((issue) => [issue.recordType, issue.recordId, issue.ruleId, issue.severity, issue.category, issue.message, issue.actualValue, issue.expectedValue, issue.recommendation]);
    const csv = [header, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `oahris-data-quality-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function deleteSpecimenRecord(specimen) {
    const specimenId = String(specimen.specimen_id || "").trim();
    if (!specimenId || deletingRecord) return;
    const confirmed = window.confirm(`Delete specimen ${specimenId}? This permanently removes the specimen and its related measurements, excavation details, dating results, skeletal inputs, and quality logs. Specimens with stored image evidence cannot be deleted here.`);
    if (!confirmed) return;

    setDeletingRecord(specimenId);
    setActionError("");

    // Preserve image evidence: a specimen must not disappear while uploaded files
    // still reference it. Empty legacy image rows can be removed safely.
    const { data: imageRecords, error: imageLoadError } = await supabase
      .from("bone_images")
      .select("image_id, image_url, file_url")
      .eq("specimen_id", specimenId);

    if (imageLoadError) {
      setActionError(`Could not verify images for ${specimenId}: ${imageLoadError.message}`);
      setDeletingRecord("");
      return;
    }

    if ((imageRecords || []).some(hasStoredImage)) {
      setActionError(`Could not delete ${specimenId}: this specimen has stored image evidence. Remove or reassign its images first.`);
      setDeletingRecord("");
      return;
    }

    const metadataOnlyImageIds = (imageRecords || []).map((record) => record.image_id).filter(Boolean);
    if (metadataOnlyImageIds.length) {
      const { error: imageCleanupError } = await supabase.from("bone_images").delete().in("image_id", metadataOnlyImageIds);
      if (imageCleanupError) {
        setActionError(`Could not remove image metadata for ${specimenId}: ${imageCleanupError.message}`);
        setDeletingRecord("");
        return;
      }
    }

    // Foreign keys protect the specimen while child records exist, so remove each
    // owned data set before deleting the parent record.
    const relatedTables = [
      ["measurements", "measurements"],
      ["excavation_records", "excavation details"],
      ["laboratory_dating_results", "dating results"],
      ["skeletal_inputs", "skeletal inputs"],
      ["data_quality_log", "quality logs"],
    ];

    for (const [table, label] of relatedTables) {
      const { error: cleanupError } = await supabase.from(table).delete().eq("specimen_id", specimenId);
      if (cleanupError) {
        setActionError(`Could not remove ${label} for ${specimenId}: ${cleanupError.message}`);
        setDeletingRecord("");
        return;
      }
    }

    const { error: specimenDeleteError } = await supabase.from("specimens").delete().eq("specimen_id", specimenId);
    if (specimenDeleteError) {
      setActionError(`Could not delete ${specimenId}: ${specimenDeleteError.message}`);
      setDeletingRecord("");
      return;
    }

    setDeletingRecord("");
    await fetchData();
  }

  // Overall health score
  // Keep the existing score dimensions and add a small, transparent penalty for
  // non-blocking rule warnings. This is a QA score, never an AI confidence score.
  const reviewPenalty = Math.min(10, (severityCounts.MEDIUM * 1) + (severityCounts.LOW * 0.25) + (severityCounts.INFO * 0.1));
  const healthScore = Math.max(0, Math.round(
    (avgCompleteness * 0.5) +
    (duplicates.length === 0 ? 25 : 0) +
    (qualityCounts.error + siteQualityCounts.error === 0 ? 15 : 0) +
    (incompleteSpecimens.length / Math.max(totalSpecimens, 1) < 0.2 ? 10 : 0) -
    reviewPenalty
  ));

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
            type="button"
            onClick={exportQualityReport}
            disabled={allIssues.length === 0}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/45 transition-colors hover:border-emerald-500/30 hover:text-emerald-200 disabled:cursor-not-allowed disabled:opacity-30"
          >
            Export CSV
          </button>
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
              Explainable rule-based validation for specimens, measurements, and Sites records
            </p>
            <p className="mt-2 text-[11px] text-white/25">
              {lastUpdated ? `Last refreshed ${lastUpdated.toLocaleString()}` : "Not refreshed"} · No skeletal input data is read
            </p>
          </div>

          {/* Health Score */}
          <div className={`border rounded-2xl px-6 py-4 text-center ${healthBg}`}>
            <p className="text-xs text-white/30 uppercase tracking-wider mb-1">Health Score</p>
            <p className={`text-4xl font-bold ${healthColor}`}>{healthScore}</p>
            <p className="text-xs text-white/30 mt-1">out of 100</p>
          </div>
        </div>

        {loadError && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-200">
            Some quality sources could not be loaded: {loadError}
          </div>
        )}

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {[
            { label: "Total Specimens", value: totalSpecimens, color: "text-white" },
            { label: "Canonical Sites", value: sites.length, color: "text-cyan-300" },
            { label: "Avg Completeness", value: `${avgCompleteness}%`, color: avgCompleteness >= 70 ? "text-emerald-400" : "text-yellow-400" },
            { label: "Site Link Rate", value: `${siteLinkRate}%`, color: siteLinkRate >= 80 ? "text-emerald-400" : "text-amber-400" },
            { label: "Need Review", value: qualityCounts.warning + siteQualityCounts.warning, color: "text-amber-400" },
            { label: "Invalid", value: qualityCounts.error + siteQualityCounts.error, color: qualityCounts.error + siteQualityCounts.error ? "text-red-400" : "text-emerald-400" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 text-center">
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-white/30 uppercase tracking-wider mt-2">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="mb-6 flex w-full gap-1 overflow-x-auto rounded-xl border border-white/10 bg-white/[0.03] p-1">
          {[
            { key: "overview", label: "Overview" },
            { key: "missing", label: "Missing Fields" },
            { key: "incomplete", label: `Incomplete (${incompleteSpecimens.length})` },
            { key: "duplicates", label: `Duplicates (${duplicates.length})` },
            { key: "quality", label: `Quality (${qualityCounts.error + qualityCounts.warning})` },
            { key: "sites", label: `Sites (${siteRecordsNeedingReview.length})` },
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
                {FORM_COMPLETENESS_FIELDS.map((definition, index) => {
                  const { filled, total, pct } = getFormFieldCompleteness(definition);
                  const missing = total - filled;
                  return (
                    <div key={`${definition.source}-${definition.boneType || "all"}-${definition.field}-${index}`} className="flex items-center gap-3">
                      <div className="w-40 shrink-0">
                        <p className="text-xs text-white/60">{definition.label}{definition.boneType ? ` (${definition.boneType})` : ""}</p>
                        <p className="mt-0.5 text-[10px] uppercase tracking-wider text-white/25">{definition.type}</p>
                      </div>
                      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${completenessColor(pct ?? 0)}`}
                          style={{ width: `${pct ?? 0}%` }}
                        />
                      </div>
                      <span className="text-xs text-white/30 w-16 text-right">{pct === null ? "N/A" : `${pct}%`}</span>
                      {missing > 0 && (
                        <span className="text-[10px] text-red-400/60">{missing} missing</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Summary alerts */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
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
              <div className={`border rounded-xl p-4 ${siteRecordsNeedingReview.length === 0 ? "bg-emerald-500/5 border-emerald-500/20" : "bg-amber-500/5 border-amber-500/20"}`}>
                <p className="text-xs text-white/30 uppercase tracking-wider mb-1">Sites Needing Review</p>
                <p className={`text-2xl font-bold ${siteRecordsNeedingReview.length === 0 ? "text-emerald-400" : "text-amber-400"}`}>{siteRecordsNeedingReview.length}</p>
                <p className="text-xs text-white/30 mt-1">from canonical Sites records</p>
              </div>
              <div className={`border rounded-xl p-4 ${siteLinkRate >= 80 ? "bg-emerald-500/5 border-emerald-500/20" : "bg-cyan-500/5 border-cyan-500/20"}`}>
                <p className="text-xs text-white/30 uppercase tracking-wider mb-1">Specimen/Site Links</p>
                <p className={`text-2xl font-bold ${siteLinkRate >= 80 ? "text-emerald-400" : "text-cyan-300"}`}>{linkedSpecimens}/{totalSpecimens}</p>
                <p className="text-xs text-white/30 mt-1">matched by site name in Sites</p>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <p className="text-xs uppercase tracking-widest text-white/30">Most Frequent Rules</p>
                <div className="mt-4 space-y-3">
                  {ruleCounts.slice(0, 5).map(({ ruleId, count, issue }) => (
                    <button key={ruleId} type="button" onClick={() => { setSeverityFilter("ALL"); setCategoryFilter(issue.category); setActiveTab("quality"); }} className="flex w-full items-center justify-between gap-4 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 text-left hover:bg-white/[0.05]">
                      <div><p className="font-mono text-xs text-emerald-200">{ruleId}</p><p className="mt-1 text-xs text-white/45">{issue.ruleName}</p></div>
                      <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-white/65">{count}</span>
                    </button>
                  ))}
                  {ruleCounts.length === 0 && <p className="text-sm text-emerald-200/70">No rules are currently triggered.</p>}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <p className="text-xs uppercase tracking-widest text-white/30">Evidence Sources</p>
                <div className="mt-4 space-y-4">
                  {[
                    ["Specimens", specimens.length, "Core record and context"],
                    ["Measurements", measurements.length, "Metric validation"],
                    ["Canonical sites", sites.length, "Sites table details"],
                    ["Excavation records", excavationRecords.length, "Completeness only"],
                    ["Dating results", labDatingRecords.length, "Completeness only"],
                  ].map(([label, count, note]) => (
                    <div key={label} className="flex items-center justify-between border-b border-white/5 pb-3 last:border-0 last:pb-0">
                      <div><p className="text-sm text-white/70">{label}</p><p className="mt-0.5 text-[11px] text-white/25">{note}</p></div>
                      <span className="font-mono text-sm text-cyan-200">{count}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-4 rounded-lg border border-emerald-500/15 bg-emerald-500/5 px-3 py-2 text-[11px] text-emerald-100/55">skeletal_inputs is intentionally excluded from this dashboard.</p>
              </div>
            </div>

            {/* Explainable rule-category scores. Each starts at 100 and is
                reduced only by issues in that category. */}
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
              <p className="text-xs text-white/30 uppercase tracking-widest mb-5">Rule-based Quality Dimensions</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(categoryScores).map(([category, score]) => (
                  <div key={category} className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-xs leading-5 text-white/55">{category}</p>
                      <span className={`font-mono text-sm ${score >= 80 ? "text-emerald-400" : score >= 60 ? "text-amber-400" : "text-red-400"}`}>{score}%</span>
                    </div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/5">
                      <div className={`h-full rounded-full ${completenessColor(score)}`} style={{ width: `${score}%` }} />
                    </div>
                  </div>
                ))}
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

        {/* Quality Tab */}
        {activeTab === "quality" && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3 text-xs text-white/50">
              <span className="flex items-center gap-2"><StatusBadge status="valid" /> {qualityCounts.valid} normal record{qualityCounts.valid === 1 ? "" : "s"}</span>
              <span className="flex items-center gap-2"><StatusBadge status="warning" /> {qualityCounts.warning} need review</span>
              <span className="flex items-center gap-2"><StatusBadge status="error" /> {qualityCounts.error} invalid</span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {Object.entries(severityCounts).map(([severity, count]) => (
                <div key={severity} className="rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3">
                  <p className="text-[10px] uppercase tracking-wider text-white/35">{severity}</p>
                  <p className="mt-1 text-xl font-semibold text-white/80">{count}</p>
                </div>
              ))}
            </div>
            <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.025] p-4 md:grid-cols-3">
              <input value={qualitySearch} onChange={(event) => setQualitySearch(event.target.value)} placeholder="Search specimen, skeleton, bone, or site" className="rounded-xl border border-white/10 bg-[#0f1a14] px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-emerald-500" />
              <select value={severityFilter} onChange={(event) => setSeverityFilter(event.target.value)} className="rounded-xl border border-white/10 bg-[#0f1a14] px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500">
                <option value="ALL">All severities</option>
                {QUALITY_SEVERITIES.map((severity) => <option key={severity} value={severity}>{severity}</option>)}
              </select>
              <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="rounded-xl border border-white/10 bg-[#0f1a14] px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500">
                <option value="ALL">All categories</option>
                {QUALITY_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </div>
            {orphanIssues.length > 0 && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5">
                <p className="text-sm font-medium text-red-200">Unlinked related records</p>
                <ul className="mt-3 space-y-2 text-xs text-red-100/75">
                  {orphanIssues.map((issue, index) => <li key={`${issue.ruleId}-${index}`}><span className="font-mono text-red-300">{issue.ruleId}</span> · {issue.message} Reference: {issue.actualValue}</li>)}
                </ul>
              </div>
            )}
            {actionError && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{actionError}</div>}
            {filteredQualityAudits.map(({ specimen, status, issues }, index) => (
              <article
                key={`${specimen.specimen_id}-${index}`}
                className={`block w-full rounded-2xl border p-5 text-left ${STATUS_STYLES[status]}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-sm text-white">{specimen.specimen_id}</p>
                    <p className="mt-1 text-xs text-white/50">{specimen.bone_type || "No bone category"} · {specimen.skeleton_code || "No skeleton code"}</p>
                  </div>
                  <StatusBadge status={status} />
                </div>
                {issues.length ? (
                  <QualityIssueList issues={issues} />
                ) : <p className="mt-4 text-xs text-emerald-200">All checked values are normal.</p>}
                <div className="mt-4 flex justify-end gap-2 border-t border-white/10 pt-4">
                  <button type="button" onClick={() => navigate(`/specimens/${specimen.specimen_id}`)} className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-200 hover:bg-emerald-500/20">Edit record</button>
                  <button type="button" disabled={deletingRecord === specimen.specimen_id} onClick={() => deleteSpecimenRecord(specimen)} className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-200 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40">{deletingRecord === specimen.specimen_id ? "Deleting..." : "Delete record"}</button>
                </div>
              </article>
            ))}
            {filteredQualityAudits.length === 0 && <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-8 text-center text-sm text-white/35">No specimen records match the current quality filters.</div>}
          </div>
        )}

        {/* Canonical Sites quality */}
        {activeTab === "sites" && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                ["Valid", siteQualityCounts.valid, "text-emerald-400"],
                ["Review", siteQualityCounts.warning, "text-amber-400"],
                ["Invalid", siteQualityCounts.error, "text-red-400"],
              ].map(([label, value, color]) => <div key={label} className="rounded-xl border border-white/10 bg-white/[0.025] p-4 text-center"><p className={`text-2xl font-semibold ${color}`}>{value}</p><p className="mt-1 text-[10px] uppercase tracking-wider text-white/30">{label}</p></div>)}
            </div>
            {siteAudits.map(({ site, status, issues }, index) => (
              <button type="button" key={site.site_id || site.id || index} onClick={() => site.site_id && navigate(`/minuri/sites/${site.site_id}`)} className={`block w-full rounded-2xl border p-5 text-left transition-colors hover:bg-white/[0.04] ${STATUS_STYLES[status]}`}>
                <div className="flex items-start justify-between gap-4">
                  <div><p className="font-mono text-sm text-white">{site.site_id || "No site ID"}</p><p className="mt-1 text-xs text-white/50">{site.site_name || "No site name"} · {[site.district, site.province].filter(Boolean).join(", ") || "No location"}</p></div>
                  <StatusBadge status={status} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-white/35"><span>{site.site_type || "No classification"}</span><span>·</span><span>{site.time_period || "No period"}</span><span>·</span><span>{site.risk_level ? `${site.risk_level} risk` : "No risk level"}</span></div>
                {issues.length > 0 ? <QualityIssueList issues={issues} ruleColor="text-cyan-200" compact /> : <p className="mt-4 text-xs text-emerald-200">All Sites record checks passed.</p>}
              </button>
            ))}
            {siteAudits.length === 0 && <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-8 text-center text-sm text-white/35">No records were returned from Sites.</div>}
          </div>
        )}

      </div>
    </div>
  );
}
