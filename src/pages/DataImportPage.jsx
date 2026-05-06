import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

const REQUIRED_COLUMNS = ["specimen_id", "skeleton_code"];

const EXPECTED_COLUMNS = [
  "specimen_id", "skeleton_code", "site_name", "district",
  "province", "excavation_year", "time_period", "preservation_state",
  "location_stored", "burial_context", "notes",
];

export default function DataImportPage() {
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [step, setStep] = useState(1); // 1=upload, 2=preview, 3=done
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState([]);
  const [errors, setErrors] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  function parseCSV(text) {
    const lines = text.trim().split("\n");
    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
    const parsed = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim().replace(/"/g, ""));
      const row = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] || "";
      });
      parsed.push(row);
    }
    return { headers, rows: parsed };
  }

  function validateRows(rows) {
    const errs = [];
    rows.forEach((row, i) => {
      const rowErrors = [];
      REQUIRED_COLUMNS.forEach((col) => {
        if (!row[col] || row[col].trim() === "") {
          rowErrors.push(`"${col}" is required`);
        }
      });
      if (row.excavation_year && isNaN(row.excavation_year)) {
        rowErrors.push(`"excavation_year" must be a number`);
      }
      if (rowErrors.length > 0) {
        errs.push({ row: i + 1, messages: rowErrors });
      }
    });
    return errs;
  }

  function handleFile(file) {
    if (!file) return;
    if (!file.name.endsWith(".csv")) {
      alert("Please upload a CSV file!");
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const { rows: parsed } = parseCSV(text);
      const validationErrors = validateRows(parsed);
      setRows(parsed);
      setErrors(validationErrors);
      setStep(2);
    };
    reader.readAsText(file);
  }

  function handleFileInput(e) {
    handleFile(e.target.files[0]);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  }

  async function handleImport() {
    if (errors.length > 0) {
      alert("Please fix errors before importing!");
      return;
    }

    setImporting(true);

    let successCount = 0;
    let failCount = 0;
    const failedRows = [];

    for (const row of rows) {
      // Check duplicate
      const { data: existing } = await supabase
        .from("specimens")
        .select("specimen_id")
        .eq("specimen_id", row.specimen_id)
        .single();

      if (existing) {
        failCount++;
        failedRows.push({ id: row.specimen_id, reason: "Duplicate ID" });
        continue;
      }

      const payload = {
        specimen_id: row.specimen_id,
        skeleton_code: row.skeleton_code,
        site_name: row.site_name || null,
        district: row.district || null,
        province: row.province || null,
        excavation_year: row.excavation_year ? parseInt(row.excavation_year) : null,
        time_period: row.time_period || null,
        preservation_state: row.preservation_state || null,
        location_stored: row.location_stored || null,
        burial_context: row.burial_context || null,
        notes: row.notes || null,
      };

      const { error } = await supabase.from("specimens").insert([payload]);

      if (error) {
        failCount++;
        failedRows.push({ id: row.specimen_id, reason: error.message });
      } else {
        successCount++;
      }
    }

    // Log import
    await supabase.from("data_import_logs").insert([{
      file_name: fileName,
      file_type: "CSV",
      import_status: failCount === 0 ? "Success" : "Partial",
      total_records: rows.length,
      successful_records: successCount,
      failed_records: failCount,
    }]);

    setImportResult({ successCount, failCount, failedRows });
    setImporting(false);
    setStep(3);
  }

  function handleReset() {
    setStep(1);
    setFileName("");
    setRows([]);
    setErrors([]);
    setImportResult(null);
    if (fileRef.current) fileRef.current.value = "";
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
        <span className="text-xs text-white/30 tracking-widest uppercase">Data Import</span>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs tracking-[0.2em] uppercase text-emerald-400/80">Bulk Upload</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Data Import</h1>
          <p className="text-white/40 text-sm mt-2">
            Upload a CSV file to import multiple specimen records at once.
          </p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-3 mb-8">
          {["Upload CSV", "Preview & Validate", "Import Complete"].map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                step > i + 1 ? "bg-emerald-500 text-white" :
                step === i + 1 ? "bg-emerald-600 text-white" :
                "bg-white/10 text-white/30"
              }`}>
                {step > i + 1 ? "✓" : i + 1}
              </div>
              <span className={`text-xs ${step === i + 1 ? "text-white" : "text-white/30"}`}>
                {label}
              </span>
              {i < 2 && <div className="w-8 h-px bg-white/10 mx-1" />}
            </div>
          ))}
        </div>

        {/* Step 1 — Upload */}
        {step === 1 && (
          <div className="space-y-6">
            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors ${
                dragOver
                  ? "border-emerald-400 bg-emerald-500/10"
                  : "border-white/10 hover:border-white/20 bg-white/[0.02]"
              }`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-12 h-12 mx-auto text-white/20 mb-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <p className="text-white/50 text-sm mb-1">
                Drag and drop your CSV file here
              </p>
              <p className="text-white/25 text-xs">or click to browse</p>
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                onChange={handleFileInput}
                className="hidden"
              />
            </div>

            {/* CSV format guide */}
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
              <p className="text-xs text-white/30 uppercase tracking-widest mb-4">
                Expected CSV Format
              </p>
              <div className="overflow-x-auto">
                <code className="text-xs text-emerald-400/70 whitespace-nowrap">
                  specimen_id, skeleton_code, site_name, district, province, excavation_year, time_period, preservation_state, location_stored, burial_context, notes
                </code>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {EXPECTED_COLUMNS.map((col) => (
                  <span
                    key={col}
                    className={`text-[10px] px-2 py-1 rounded-full border ${
                      REQUIRED_COLUMNS.includes(col)
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        : "bg-white/5 text-white/30 border-white/10"
                    }`}
                  >
                    {col} {REQUIRED_COLUMNS.includes(col) ? "*" : ""}
                  </span>
                ))}
              </div>
              <p className="text-[10px] text-white/20 mt-3">* Required fields</p>
            </div>

            {/* Download template */}
            <button
              onClick={() => {
                const csv = EXPECTED_COLUMNS.join(",") + "\nSPEC-001,SK1,Site Name,Colombo,Western,1998,Mesolithic,Good,Lab Shelf A,Primary burial,Notes here";
                const blob = new Blob([csv], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "specimen_import_template.csv";
                a.click();
              }}
              className="flex items-center gap-2 text-sm text-emerald-400/70 hover:text-emerald-400 transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download CSV Template
            </button>
          </div>
        )}

        {/* Step 2 — Preview */}
        {step === 2 && (
          <div className="space-y-6">

            {/* File info */}
            <div className="flex items-center justify-between bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4">
              <div className="flex items-center gap-3">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-emerald-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div>
                  <p className="text-sm text-white">{fileName}</p>
                  <p className="text-xs text-white/30">{rows.length} records found</p>
                </div>
              </div>
              <button
                onClick={handleReset}
                className="text-xs text-white/30 hover:text-white transition-colors"
              >
                Change file
              </button>
            </div>

            {/* Validation errors */}
            {errors.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5">
                <p className="text-xs text-red-400 uppercase tracking-wider mb-3">
                  ⚠️ {errors.length} Validation Error{errors.length > 1 ? "s" : ""} Found
                </p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {errors.map((e, i) => (
                    <div key={i} className="text-xs text-red-300/70">
                      Row {e.row}: {e.messages.join(", ")}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Preview table */}
            <div className="border border-white/10 rounded-2xl overflow-hidden">
              <div className="px-5 py-3 bg-white/[0.02] border-b border-white/10 flex items-center justify-between">
                <p className="text-xs text-white/30 uppercase tracking-wider">Preview (first 5 rows)</p>
                <span className={`text-xs px-2 py-1 rounded-full border ${
                  errors.length === 0
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-red-500/10 text-red-400 border-red-500/20"
                }`}>
                  {errors.length === 0 ? "✓ Ready to import" : `${errors.length} errors`}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/5">
                      {EXPECTED_COLUMNS.slice(0, 6).map((col) => (
                        <th key={col} className="text-left px-4 py-2.5 text-white/25 uppercase tracking-wider font-medium">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 5).map((row, i) => (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02]">
                        {EXPECTED_COLUMNS.slice(0, 6).map((col) => (
                          <td key={col} className="px-4 py-2.5 text-white/60">
                            {row[col] || <span className="text-white/20">—</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rows.length > 5 && (
                <div className="px-5 py-3 text-xs text-white/20 border-t border-white/5">
                  +{rows.length - 5} more rows not shown
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <button
                onClick={handleReset}
                className="px-5 py-2.5 text-sm text-white/40 hover:text-white border border-white/10 hover:border-white/20 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={importing || errors.length > 0}
                className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900 disabled:text-emerald-700 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2"
              >
                {importing ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Importing...
                  </>
                ) : `Import ${rows.length} Records`}
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Done */}
        {step === 3 && importResult && (
          <div className="space-y-6">
            <div className={`border rounded-2xl p-8 text-center ${
              importResult.failCount === 0
                ? "bg-emerald-500/10 border-emerald-500/20"
                : "bg-yellow-500/10 border-yellow-500/20"
            }`}>
              <div className="text-5xl mb-4">
                {importResult.failCount === 0 ? "🎉" : "⚠️"}
              </div>
              <h2 className="text-xl font-bold text-white mb-2">
                {importResult.failCount === 0 ? "Import Successful!" : "Import Completed with Errors"}
              </h2>
              <p className="text-white/50 text-sm">
                {importResult.successCount} records imported successfully
                {importResult.failCount > 0 && `, ${importResult.failCount} failed`}
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-white">{rows.length}</p>
                <p className="text-xs text-white/30 mt-1">Total Records</p>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-emerald-400">{importResult.successCount}</p>
                <p className="text-xs text-white/30 mt-1">Imported</p>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-red-400">{importResult.failCount}</p>
                <p className="text-xs text-white/30 mt-1">Failed</p>
              </div>
            </div>

            {/* Failed rows */}
            {importResult.failedRows.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5">
                <p className="text-xs text-red-400 uppercase tracking-wider mb-3">Failed Records</p>
                <div className="space-y-1">
                  {importResult.failedRows.map((f, i) => (
                    <div key={i} className="text-xs text-red-300/60">
                      {f.id} — {f.reason}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 px-5 py-2.5 text-sm text-white/40 hover:text-white border border-white/10 hover:border-white/20 rounded-xl transition-colors"
              >
                Import Another File
              </button>
              <button
                onClick={() => navigate("/specimens")}
                className="flex-1 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-xl transition-colors"
              >
                View Specimens
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
