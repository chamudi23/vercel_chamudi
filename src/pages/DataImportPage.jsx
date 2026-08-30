import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import { CONTROLLED_BONE_CATEGORIES, normalizeBoneCategory, validateCategorySide } from "../utils/pp1ImageModule";
import { DATING_METHODS, PRESERVATION_STATES, validateExcavationAndDating } from "../utils/specimenMetadata";

const REQUIRED = ["specimen_id", "skeleton_code", "bone_type", "side"];
const SPECIMEN = ["specimen_id", "skeleton_code", "bone_type", "side", "site_name", "district", "province", "time_period", "preservation_state", "location_stored", "notes", "age_estimate", "sex_estimate", "height_estimate"];
const MEASUREMENT = ["measurement_type", "measurement_value", "measurement_unit", "measurement_notes"];
const EXCAVATION = ["excavation_date", "depth_found", "excavator_name", "excavation_notes"];
const DATING = ["dating_method", "date_result", "date_range_min", "date_range_max", "lab_name", "result_notes"];
const COLUMNS = [...SPECIMEN, ...MEASUREMENT, ...EXCAVATION, ...DATING];
const NUMBERS = ["height_estimate", "measurement_value", "depth_found", "date_range_min", "date_range_max"];
const SEXES = ["Male", "Female", "Unknown"];
const UNITS = ["mm", "cm", "m"];
const CSV_GUIDE = [
  ["Required identifiers", "specimen_id, skeleton_code, bone_type, and side must be completed for every row. IDs must be unique."],
  ["Bone and side", "Use a bone category from the specimen form. Side must be Left, Right, Midline, or Unknown where that category allows it."],
  ["Controlled values", `Preservation: ${PRESERVATION_STATES.join(", ")}. Sex: ${SEXES.join(", ")}. Units: ${UNITS.join(", ")}.`],
  ["Numbers", "height_estimate, measurement_value, depth_found, and date ranges must be zero or positive numbers. Do not add units inside numeric cells."],
  ["Dates", "Use YYYY-MM-DD for excavation_date, for example 2026-01-15."],
  ["Measurements", "Provide measurement_type and measurement_value together. Leave all measurement fields blank when no measurement is available."],
  ["Excavation and dating", "These sections are optional. A dating_method is required before a laboratory dating record can be created."],
  ["Text containing commas", "Keep comma-containing text inside double quotes. The downloaded template already uses CSV-safe formatting."],
];

function parseCSV(text) {
  const records = [];
  let record = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') { field += '"'; i += 1; } else quoted = !quoted;
    } else if (char === "," && !quoted) { record.push(field.trim()); field = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[i + 1] === "\n") i += 1;
      record.push(field.trim()); if (record.some(Boolean)) records.push(record); record = []; field = "";
    } else field += char;
  }
  record.push(field.trim()); if (record.some(Boolean)) records.push(record);
  if (!records.length) return { headers: [], rows: [] };
  const headers = records[0].map((value) => value.replace(/^\uFEFF/, "").trim().toLowerCase());
  return { headers, rows: records.slice(1).map((values, index) => ({ __row: index + 2, ...Object.fromEntries(headers.map((header, column) => [header, values[column] || ""])) })) };
}

function validate(rows, headers) {
  const result = [];
  const missing = REQUIRED.filter((column) => !headers.includes(column));
  if (missing.length) result.push({ row: "Header", messages: [`Missing required columns: ${missing.join(", ")}`] });
  const ids = new Set();
  rows.forEach((row) => {
    const messages = [];
    REQUIRED.forEach((column) => { if (!row[column]?.trim()) messages.push(`${column} is required`); });
    const id = row.specimen_id?.trim().toLowerCase();
    if (id && ids.has(id)) messages.push("Duplicate specimen_id in this file");
    if (id) ids.add(id);
    const category = normalizeBoneCategory(row.bone_type);
    if (row.bone_type && !category) messages.push("Unsupported bone_type");
    if (category) { const issue = validateCategorySide(row.bone_type, row.side); if (issue) messages.push(issue); }
    if (row.preservation_state && !PRESERVATION_STATES.includes(row.preservation_state)) messages.push(`preservation_state must be ${PRESERVATION_STATES.join(", ")}`);
    if (row.sex_estimate && !SEXES.includes(row.sex_estimate)) messages.push(`sex_estimate must be ${SEXES.join(", ")}`);
    if (row.measurement_unit && !UNITS.includes(row.measurement_unit)) messages.push(`measurement_unit must be ${UNITS.join(", ")}`);
    if (row.measurement_value && !row.measurement_type) messages.push("measurement_type is required with a measurement_value");
    if (row.measurement_type && !row.measurement_value) messages.push("measurement_value is required with a measurement_type");
    NUMBERS.forEach((column) => { if (row[column] !== "" && (!Number.isFinite(Number(row[column])) || Number(row[column]) < 0)) messages.push(`${column} must be a non-negative number`); });
    if (row.dating_method && !DATING_METHODS.includes(row.dating_method)) messages.push(`dating_method must be ${DATING_METHODS.join(", ")}`);
    const metadata = validateExcavationAndDating(Object.fromEntries(EXCAVATION.map((key) => [key, row[key]])), Object.fromEntries(DATING.map((key) => [key, row[key]])));
    Object.values(metadata).filter(Boolean).forEach((issue) => { if (!messages.includes(issue)) messages.push(issue); });
    if (messages.length) result.push({ row: row.__row, messages });
  });
  return result;
}

const numberOrNull = (value) => value === "" ? null : Number(value);
const id = (prefix) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
const cell = (value) => /[",\r\n]/.test(String(value)) ? `"${String(value).replace(/"/g, '""')}"` : String(value);

export default function DataImportPage() {
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [step, setStep] = useState(1);
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState([]);
  const [errors, setErrors] = useState([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [bone, setBone] = useState("all");
  const [side, setSide] = useState("all");
  const invalidRows = useMemo(() => new Set(errors.filter((error) => Number.isInteger(error.row)).map((error) => error.row)), [errors]);
  const choices = (key) => [...new Set(rows.map((row) => row[key]).filter(Boolean))].sort();
  const filtered = useMemo(() => rows.filter((row) => {
    const invalid = invalidRows.has(row.__row), query = search.trim().toLowerCase();
    return !(status === "valid" && invalid) && !(status === "invalid" && !invalid) && (bone === "all" || row.bone_type === bone) && (side === "all" || row.side === side) && (!query || COLUMNS.some((key) => row[key]?.toLowerCase().includes(query)));
  }), [rows, invalidRows, search, status, bone, side]);

  function reset() {
    setStep(1); setFileName(""); setRows([]); setErrors([]); setResult(null); setSearch(""); setStatus("all"); setBone("all"); setSide("all");
    if (fileRef.current) fileRef.current.value = "";
  }
  function load(file) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) return window.alert("Please upload a CSV file.");
    const reader = new FileReader();
    reader.onload = (event) => { const parsed = parseCSV(String(event.target.result || "")); const issues = validate(parsed.rows, parsed.headers); if (!parsed.rows.length) issues.push({ row: "File", messages: ["No data rows found"] }); setFileName(file.name); setRows(parsed.rows); setErrors(issues); setStep(2); };
    reader.readAsText(file);
  }
  function downloadTemplate() {
    const example = ["SPEC-001", "SK-001", CONTROLLED_BONE_CATEGORIES[0]?.label || "Femur", "Left", "Site Name", "Colombo", "Western", "Mesolithic", PRESERVATION_STATES[0] || "Good", "Lab Shelf A", "Optional notes", "Adult", "Unknown", "170", "Maximum Length", "420", "mm", "Landmark notes", "2026-01-15", "2.5", "Ms. Lakshmi", "Primary burial", DATING_METHODS[0] || "Radiocarbon", "2450 BP", "2400", "2500", "National Archaeology Lab", "Calibrated"];
    const url = URL.createObjectURL(new Blob([`${COLUMNS.map(cell).join(",")}\r\n${example.map(cell).join(",")}\r\n`], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "specimen_import_template.csv"; link.click(); URL.revokeObjectURL(url);
  }
  async function importRows() {
    if (errors.length || !rows.length) return;
    setImporting(true);
    const { data: auth } = await supabase.auth.getUser();
    let success = 0; const failed = [];
    for (const row of rows) {
      const specimenId = row.specimen_id.trim();
      try {
        const { data: duplicate, error: lookupError } = await supabase.from("specimens").select("specimen_id").eq("specimen_id", specimenId).maybeSingle();
        if (lookupError) throw lookupError; if (duplicate) throw new Error("Duplicate specimen ID");
        const payload = Object.fromEntries(SPECIMEN.map((key) => [key, row[key] || null]));
        payload.specimen_id = specimenId; payload.skeleton_code = row.skeleton_code.trim(); payload.bone_type = normalizeBoneCategory(row.bone_type)?.label || row.bone_type.trim(); payload.side = row.side.trim(); payload.height_estimate = numberOrNull(row.height_estimate);
        const { error: specimenError } = await supabase.from("specimens").insert([payload]); if (specimenError) throw specimenError;
        if (row.measurement_type) { const { error } = await supabase.from("measurements").insert([{ measurement_id: id("M"), specimen_id: specimenId, bone_type: payload.bone_type, measurement_type: row.measurement_type, value: Number(row.measurement_value), unit: row.measurement_unit || "mm", notes: row.measurement_notes || "" }]); if (error) throw new Error(`Measurement: ${error.message}`); }
        if (EXCAVATION.some((key) => row[key])) { const { error } = await supabase.from("excavation_records").insert([{ excavation_id: id("EX"), specimen_id: specimenId, excavation_date: row.excavation_date || null, depth_found: numberOrNull(row.depth_found), excavator_name: row.excavator_name || "", excavation_notes: row.excavation_notes || "", created_by: auth?.user?.id || null }]); if (error) throw new Error(`Excavation: ${error.message}`); }
        if (row.dating_method) { const { error } = await supabase.from("laboratory_dating_results").insert([{ lab_id: id("LAB"), specimen_id: specimenId, dating_method: row.dating_method, date_result: row.date_result || "", date_range_min: numberOrNull(row.date_range_min), date_range_max: numberOrNull(row.date_range_max), lab_name: row.lab_name || "", result_notes: row.result_notes || "" }]); if (error) throw new Error(`Lab dating: ${error.message}`); }
        success += 1;
      } catch (error) { failed.push({ id: specimenId || `Row ${row.__row}`, reason: error.message }); }
    }
    await supabase.from("data_import_logs").insert([{ file_name: fileName, file_type: "CSV", import_status: failed.length ? (success ? "Partial" : "Failed") : "Success", total_records: rows.length, successful_records: success, failed_records: failed.length }]);
    setResult({ success, failed }); setImporting(false); setStep(3);
  }
  const control = "rounded-xl border border-white/10 bg-[#0f1a14] px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none";
  return <div className="min-h-screen bg-[#0f1a14] text-white">
    <style>{`select option { background:#0f1a14; color:white }`}</style>
    <header className="flex items-center justify-between border-b border-white/10 px-6 py-4"><button onClick={() => navigate("/minuri")} className="text-sm text-white/50 hover:text-white">← Back to Module</button><span className="text-xs uppercase tracking-widest text-white/30">Data Import</span></header>
    <main className="mx-auto max-w-6xl px-6 py-10"><div className="mb-8"><p className="mb-2 text-xs uppercase tracking-[0.2em] text-emerald-400/80">Bulk registration</p><h1 className="text-3xl font-bold">Import Specimens</h1><p className="mt-2 text-sm text-white/40">Uses the specimen form fields and validation.</p></div>
      <ol className="mb-8 grid grid-cols-3 gap-2">{["Upload CSV", "Preview & Validate", "Import Complete"].map((label, index) => <li key={label} className={`rounded-xl border px-3 py-2 text-xs ${step === index + 1 ? "border-emerald-400/70 bg-emerald-500/15 text-emerald-100" : step > index + 1 ? "border-emerald-500/30 text-emerald-300" : "border-white/10 text-white/35"}`}><span className="mr-2 font-bold">{step > index + 1 ? "✓" : index + 1}</span>{label}</li>)}</ol>
      {step === 1 && <section className="space-y-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6"><div onDragOver={(event) => { event.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={(event) => { event.preventDefault(); setDragOver(false); load(event.dataTransfer.files[0]); }} onClick={() => fileRef.current?.click()} className={`cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center ${dragOver ? "border-emerald-400 bg-emerald-500/10" : "border-white/10"}`}><p className="text-4xl text-white/25">⇧</p><p className="mt-3 text-sm text-white/60">Drop a CSV here, or click to browse</p><p className="mt-1 text-xs text-white/30">One row creates one specimen and up to one measurement</p><input ref={fileRef} type="file" accept=".csv,text/csv" onChange={(event) => load(event.target.files[0])} className="hidden" /></div><div className="rounded-xl border border-white/10 p-5"><p className="text-sm text-white/55">The updated template covers skeleton and bone, site, condition, biological estimates, measurement, excavation, and lab dating.</p><div className="mt-4 flex flex-wrap gap-2">{COLUMNS.map((column) => <span key={column} className={`rounded-full border px-2 py-1 text-[10px] ${REQUIRED.includes(column) ? "border-emerald-500/30 text-emerald-300" : "border-white/10 text-white/35"}`}>{column}{REQUIRED.includes(column) && " *"}</span>)}</div><div className="mt-6 border-t border-white/10 pt-5"><div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="text-sm font-medium text-white/85">CSV completion guide</h2><p className="mt-1 text-xs text-white/35">CSV files cannot provide dropdowns, so use these accepted formats and values.</p></div><span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[10px] uppercase tracking-wider text-emerald-300">Before upload</span></div><dl className="grid gap-3 md:grid-cols-2">{CSV_GUIDE.map(([title, description]) => <div key={title} className="rounded-xl border border-white/10 bg-white/[0.025] p-3.5"><dt className="text-xs font-medium text-emerald-200">{title}</dt><dd className="mt-1.5 text-xs leading-5 text-white/45">{description}</dd></div>)}</dl><div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs leading-5 text-amber-100/70"><span className="font-medium text-amber-200">Important:</span> Do not rename or remove header columns. Keep optional columns in the file and leave their cells empty when they do not apply.</div></div></div><button onClick={downloadTemplate} className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm">Download updated CSV template</button></section>}
      {step === 2 && <section className="space-y-6"><div className="flex justify-between rounded-xl border border-white/10 bg-white/[0.03] p-5"><div><p className="text-sm">{fileName}</p><p className="text-xs text-white/35">{rows.length} records · {invalidRows.size} invalid</p></div><button onClick={reset} className="text-xs text-white/45">Change file</button></div>{errors.length > 0 && <div className="max-h-48 overflow-auto rounded-xl border border-red-500/30 bg-red-500/10 p-5">{errors.map((error, index) => <p key={index} className="mb-2 text-xs text-red-200/75">{Number.isInteger(error.row) ? `CSV row ${error.row}` : error.row}: {error.messages.join("; ")}</p>)}</div>}<div className="grid gap-3 rounded-xl border border-white/10 p-4 sm:grid-cols-2 lg:grid-cols-4"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search any field…" className={control}/><select value={status} onChange={(event) => setStatus(event.target.value)} className={control}><option value="all">All validation states</option><option value="valid">Valid rows</option><option value="invalid">Invalid rows</option></select><select value={bone} onChange={(event) => setBone(event.target.value)} className={control}><option value="all">All bone categories</option>{choices("bone_type").map((value) => <option key={value}>{value}</option>)}</select><select value={side} onChange={(event) => setSide(event.target.value)} className={control}><option value="all">All sides</option>{choices("side").map((value) => <option key={value}>{value}</option>)}</select></div><div className="max-h-[34rem] overflow-auto rounded-2xl border border-white/10"><table className="min-w-full text-xs"><thead className="sticky top-0 bg-[#13231a]"><tr>{["status", ...SPECIMEN.slice(0, 10), ...MEASUREMENT.slice(0, 3)].map((column) => <th key={column} className="whitespace-nowrap px-4 py-3 text-left uppercase text-white/30">{column}</th>)}</tr></thead><tbody>{filtered.slice(0, 100).map((row) => <tr key={row.__row} className="border-t border-white/5"><td className={`px-4 py-3 ${invalidRows.has(row.__row) ? "text-red-300" : "text-emerald-300"}`}>{invalidRows.has(row.__row) ? "Issue" : "Valid"}</td>{[...SPECIMEN.slice(0, 10), ...MEASUREMENT.slice(0, 3)].map((column) => <td key={column} className="max-w-48 truncate whitespace-nowrap px-4 py-3 text-white/60">{row[column] || "—"}</td>)}</tr>)}</tbody></table>{!filtered.length && <p className="p-8 text-center text-sm text-white/35">No matching rows.</p>}</div><div className="flex justify-between"><button onClick={reset} className="rounded-xl border border-white/10 px-5 py-2.5 text-sm text-white/50">Cancel</button><button onClick={importRows} disabled={importing || errors.length > 0 || !rows.length} className="rounded-xl bg-emerald-600 px-7 py-2.5 text-sm disabled:bg-emerald-900 disabled:text-emerald-600">{importing ? "Importing…" : `Import all ${rows.length} records`}</button></div></section>}
      {step === 3 && result && <section className="space-y-6"><div className={`rounded-2xl border p-8 text-center ${result.failed.length ? "border-amber-500/30 bg-amber-500/10" : "border-emerald-500/30 bg-emerald-500/10"}`}><p className="text-4xl">{result.failed.length ? "⚠" : "✓"}</p><h2 className="mt-3 text-xl font-semibold">{result.failed.length ? "Import completed with issues" : "Import successful"}</h2><p className="mt-2 text-sm text-white/50">{result.success} imported · {result.failed.length} failed</p></div>{result.failed.length > 0 && <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-5">{result.failed.map((failure, index) => <p key={index} className="mb-2 text-xs text-red-200/75">{failure.id} — {failure.reason}</p>)}</div>}<div className="flex gap-3"><button onClick={reset} className="flex-1 rounded-xl border border-white/10 px-5 py-2.5 text-sm">Import another</button><button onClick={() => navigate("/specimens")} className="flex-1 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm">View specimens</button></div></section>}
    </main>
  </div>;
}
