/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import { TRACKED_SPECIMEN_FIELDS, calculateSpecimenCompleteness } from "../lib/dataQuality";
import { PP1_BONE_LABELS, validateCategorySide } from "../utils/pp1ImageModule";
import { getRelevantSkeletalInputFields, SKELETAL_INPUT_FIELD_DEFINITIONS } from "../utils/skeletalInputFields";
import { DISTRICTS, PRESERVATION_STATES, PROVINCES, TIME_PERIODS } from "../utils/specimenMetadata";

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
  ...Object.entries(SKELETAL_INPUT_FIELD_DEFINITIONS).flatMap(([boneType, fields]) => fields
    .filter(({ type }) => type !== "hidden")
    .map(({ field, label, type, unit }) => ({ source: "skeletal", field, label, type: unit ? `${type === "number" ? "Decimal number" : type} (${unit})` : type === "select" ? "Select" : type === "number" ? "Decimal number" : "Text", boneType }))),
];
const MEASUREMENT_TYPES = new Set(["Maximum Length", "Minimum Length", "Maximum Width", "Minimum Width", "Maximum Diameter", "Minimum Diameter", "Circumference", "Height", "Depth", "Thickness", "Other"]);
const MEASUREMENT_UNITS = new Set(["mm", "cm", "m"]);
const STATUS_STYLES = {
  valid: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
  warning: "bg-amber-500/10 text-amber-300 border-amber-500/30",
  error: "bg-red-500/10 text-red-300 border-red-500/30",
};
const STATUS_DOT = { valid: "bg-emerald-400", warning: "bg-amber-400", error: "bg-red-400" };

function isProvided(value) {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

function measurementInCentimetres(value, unit) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return null;
  if (unit === "mm") return numericValue / 10;
  if (unit === "m") return numericValue * 100;
  return numericValue;
}

function StatusBadge({ status }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${STATUS_STYLES[status]}`}><span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[status]}`} />{status}</span>;
}

export default function DataQualityPage() {
  const navigate = useNavigate();
  const [specimens, setSpecimens] = useState([]);
  const [measurements, setMeasurements] = useState([]);
  const [skeletalInputs, setSkeletalInputs] = useState([]);
  const [excavationRecords, setExcavationRecords] = useState([]);
  const [labDatingRecords, setLabDatingRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data: specData } = await supabase.from("specimens").select("*");
    const [{ data: measData }, { data: skeletalData }, { data: excavationData }, { data: labDatingData }] = await Promise.all([
      supabase.from("measurements").select("*"),
      supabase.from("skeletal_inputs").select("*"),
      supabase.from("excavation_records").select("*"),
      supabase.from("laboratory_dating_results").select("*"),
    ]);
    setSpecimens(specData || []);
    setMeasurements(measData || []);
    setSkeletalInputs(skeletalData || []);
    setExcavationRecords(excavationData || []);
    setLabDatingRecords(labDatingData || []);
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

  // Anomalies — year outliers
  const measurementsBySpecimen = new Map();
  measurements.forEach((measurement) => {
    const rows = measurementsBySpecimen.get(measurement.specimen_id) || [];
    rows.push(measurement);
    measurementsBySpecimen.set(measurement.specimen_id, rows);
  });
  const skeletalInputsBySpecimen = new Map();
  skeletalInputs.forEach((input) => {
    const rows = skeletalInputsBySpecimen.get(input.specimen_id) || [];
    rows.push(input);
    skeletalInputsBySpecimen.set(input.specimen_id, rows);
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
      return (skeletalInputsBySpecimen.get(specimen.specimen_id) || []).some((row) => isProvided(row[definition.field]));
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

  const auditSpecimen = (specimen) => {
    const issues = [];
    const add = (status, field, message) => issues.push({ status, field, message });
    const year = Number(specimen.excavation_year);
    if ((idCounts[specimen.specimen_id] || 0) > 1) add("error", "Specimen ID", "Duplicate specimen ID.");
    if (isProvided(specimen.bone_type) && !PP1_BONE_LABELS.includes(specimen.bone_type)) add("error", "Bone category", `Invalid bone category: ${specimen.bone_type}.`);
    const sideError = isProvided(specimen.bone_type) ? validateCategorySide(specimen.bone_type, specimen.side) : "";
    if (sideError) add("error", "Side", sideError);
    [["District", specimen.district, DISTRICTS], ["Province", specimen.province, PROVINCES], ["Time period", specimen.time_period, TIME_PERIODS], ["Preservation state", specimen.preservation_state, PRESERVATION_STATES]].forEach(([field, value, options]) => {
      if (isProvided(value) && !options.includes(value)) add("error", field, `Invalid option: ${value}.`);
    });
    if (isProvided(specimen.excavation_year) && (!Number.isInteger(year) || year > new Date().getFullYear())) add("error", "Excavation year", "Must be a whole year that is not in the future.");
    else if (isProvided(specimen.excavation_year) && year < 1800) add("warning", "Excavation year", "Earlier than 1800; verify the recorded year.");

    const missingFields = TRACKED_FIELDS.filter((field) => !isProvided(specimen[field]));
    if (missingFields.length) add("warning", "Completeness", `${missingFields.length} tracked field${missingFields.length === 1 ? " is" : "s are"} missing.`);
    const specimenMeasurements = measurementsBySpecimen.get(specimen.specimen_id) || [];
    if (!specimenMeasurements.length) add("warning", "Measurements", "No measurements recorded.");
    specimenMeasurements.forEach((measurement) => {
      const value = Number(measurement.value);
      const label = measurement.measurement_type || "Measurement";
      if (!isProvided(measurement.bone_type) || !PP1_BONE_LABELS.includes(measurement.bone_type)) add("error", label, "Invalid or missing bone category.");
      if (!MEASUREMENT_TYPES.has(measurement.measurement_type)) add("error", label, "Invalid or missing measurement type.");
      if (!MEASUREMENT_UNITS.has(measurement.unit)) add("error", label, "Invalid measurement unit.");
      if (!Number.isFinite(value) || value < 0) add("error", label, "Measurement must be a non-negative number.");
      else if (value === 0 || measurementInCentimetres(value, measurement.unit) > 300) add("warning", label, "Unusual measurement; verify the value and unit.");
    });
    (skeletalInputsBySpecimen.get(specimen.specimen_id) || []).forEach((input) => {
      getRelevantSkeletalInputFields(specimen.bone_type).forEach(({ field, label, type, options }) => {
        if (!isProvided(input[field])) return;
        if (type === "select" && !options.includes(input[field])) add("error", label, `Invalid option: ${input[field]}.`);
        if (type === "number" && (!Number.isFinite(Number(input[field])) || Number(input[field]) < 0)) add("error", label, "Must be a non-negative number.");
      });
    });
    const status = issues.some((issue) => issue.status === "error") ? "error" : issues.length ? "warning" : "valid";
    return { specimen, status, issues };
  };
  const qualityAudits = specimens.map(auditSpecimen);
  const qualityCounts = qualityAudits.reduce((counts, audit) => ({ ...counts, [audit.status]: counts[audit.status] + 1 }), { valid: 0, warning: 0, error: 0 });
  const yearAnomalies = qualityAudits.filter((audit) => audit.issues.some((issue) => issue.field === "Excavation year"));

  // Overall health score
  const healthScore = Math.round(
    (avgCompleteness * 0.5) +
    (duplicates.length === 0 ? 25 : 0) +
    (qualityCounts.error === 0 ? 15 : 0) +
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
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: "Total Specimens", value: totalSpecimens, color: "text-white" },
            { label: "Avg Completeness", value: `${avgCompleteness}%`, color: avgCompleteness >= 70 ? "text-emerald-400" : "text-yellow-400" },
            { label: "Valid", value: qualityCounts.valid, color: "text-emerald-400" },
            { label: "Warnings", value: qualityCounts.warning, color: qualityCounts.warning ? "text-amber-400" : "text-emerald-400" },
            { label: "Errors", value: qualityCounts.error, color: qualityCounts.error ? "text-red-400" : "text-emerald-400" },
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
            { key: "quality", label: `Quality (${qualityCounts.error + qualityCounts.warning})` },
            { key: "anomalies", label: `Year checks (${yearAnomalies.length})` },
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

        {/* Quality Tab */}
        {activeTab === "quality" && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3 text-xs text-white/50">
              <span className="flex items-center gap-2"><StatusBadge status="valid" /> {qualityCounts.valid} normal record{qualityCounts.valid === 1 ? "" : "s"}</span>
              <span className="flex items-center gap-2"><StatusBadge status="warning" /> {qualityCounts.warning} need review</span>
              <span className="flex items-center gap-2"><StatusBadge status="error" /> {qualityCounts.error} invalid</span>
            </div>
            {qualityAudits.map(({ specimen, status, issues }, index) => (
              <button
                type="button"
                key={`${specimen.specimen_id}-${index}`}
                onClick={() => navigate(`/specimens/${specimen.specimen_id}`)}
                className={`block w-full rounded-2xl border p-5 text-left transition-colors hover:bg-white/[0.04] ${STATUS_STYLES[status]}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-sm text-white">{specimen.specimen_id}</p>
                    <p className="mt-1 text-xs text-white/50">{specimen.bone_type || "No bone category"} · {specimen.skeleton_code || "No skeleton code"}</p>
                  </div>
                  <StatusBadge status={status} />
                </div>
                {issues.length ? (
                  <ul className="mt-4 space-y-1.5 text-xs text-white/70">
                    {issues.map((issue, issueIndex) => <li key={`${issue.field}-${issueIndex}`}><span className={issue.status === "error" ? "text-red-300" : "text-amber-300"}>{issue.field}:</span> {issue.message}</li>)}
                  </ul>
                ) : <p className="mt-4 text-xs text-emerald-200">All checked values are normal.</p>}
              </button>
            ))}
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
                    {yearAnomalies.map(({ specimen: s, status, issues }, i) => (
                      <tr
                        key={s.specimen_id}
                        className={`border-b border-white/5 hover:bg-white/[0.04] cursor-pointer ${i % 2 === 0 ? "" : "bg-white/[0.01]"}`}
                        onClick={() => navigate(`/specimens/${s.specimen_id}`)}
                      >
                        <td className="px-5 py-3.5 font-mono text-emerald-400 text-xs">{s.specimen_id}</td>
                        <td className={`px-5 py-3.5 font-mono ${status === "error" ? "text-red-400" : "text-amber-400"}`}>{s.excavation_year}</td>
                        <td className="px-5 py-3.5 text-white/40 text-xs">{issues.find((issue) => issue.field === "Excavation year")?.message}</td>
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
