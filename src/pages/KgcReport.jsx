/**
 * KgcReport.jsx
 * =============
 * Displays the final skeletal analysis report with predictions.
 * Shows biological profile (age, sex, height) based on measurements.
 * 
 * - Renders collected measurements from the 3-step analysis wizard
 * - Displays predicted biological profile (age range, sex, height)
 * - Shows similar cases for comparison (fetched from Supabase)
 * - Allows downloading/sending report
 * - References: Bass, W.M. (2005) Human Osteology, 5th ed.
 */

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import SkeletalHeader from '../components/KgcSkeletalHeader';
import { useAnalysis } from '../context/AnalysisContext';
import { fetchSimilarCases } from '../services/supabaseService';

// Helper: get human-readable label for a measurement value
const labelMap = {
  'smooth': 'Smooth', 'less-developed': 'Less Developed', 'moderate': 'Moderate', 'prominent': 'Prominent', 'thick': 'Thick',
  'less-25mm': '< 25mm', '25-30mm': '25 - 30mm', 'more-30mm': '> 30mm',
  'u-shaped': 'U Shaped', 'v-shaped': 'V Shaped', 'robust': 'Robust', 'rounded': 'Rounded',
  'open': 'Open', 'partially-open': 'Partially Open', 'moderate-closure': 'Moderate Closure', 'mostly-closed': 'Mostly Closed', 'completely-closed': 'Completely Closed',
  'wide': 'Wide', 'narrow': 'Narrow',
  'smooth-flat': 'Smooth / Flat', 'moderate-flat-ridges': 'Moderate / Flat Ridges', 'rough-granular': 'Rough / Granular', 'degenerated-eroded': 'Degenerated / Eroded',
  'fused': 'Fused', 'partially-fused': 'Partially Fused', 'unfused': 'Unfused',
  'gracile': 'Gracile',
  'scalloped': 'Scalloped Edges', 'irregular': 'Irregular / Porous',
  'deciduous': 'Deciduous (Baby)', 'permanent': 'Permanent', 'mixed': 'Mixed',
  'none': 'None', 'mild': 'Mild', 'severe': 'Severe',
  'early': 'Early', 'partial': 'Partial', 'complete': 'Complete',
};

function getLabel(val) {
  return labelMap[val] || val || '—';
}

// Pretty-print a camelCase key
function formatKey(key) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
}

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch { return dateStr; }
};

/**
 * Generate a professional PDF-ready HTML report and trigger browser print/save.
 * Uses zero external dependencies — pure HTML + CSS in a new window.
 */
function downloadReport({ basicInfo, measurements, predictions, bonesType, measurementFields, similarCases }) {
  const caseId = basicInfo.caseId || 'UNKNOWN';
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  // Build measurement rows
  const measurementRows = Object.entries(measurementFields)
    .map(([key, val]) => `<tr><td>${formatKey(key)}</td><td>${getLabel(val)}</td></tr>`)
    .join('');

  // Build similar cases rows
  const similarRows = (similarCases || []).length > 0
    ? (similarCases || []).map(c =>
        `<tr><td>${c.case_id}</td><td>${c.bone_type}</td><td>${c.location}</td><td>${formatDate(c.date_found)}</td></tr>`
      ).join('')
    : '<tr><td colspan="4" style="text-align:center;color:#999;">No similar cases found</td></tr>';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>OAHRIS Report — ${caseId}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', -apple-system, sans-serif; color: #1e293b; background: #fff; padding: 40px; max-width: 800px; margin: 0 auto; }
  .header { border-bottom: 3px solid #f97316; padding-bottom: 16px; margin-bottom: 28px; }
  .header h1 { font-size: 22px; color: #0f172a; margin-bottom: 2px; }
  .header .subtitle { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1.5px; }
  .header .case-id { font-size: 14px; color: #f97316; font-weight: 600; margin-top: 6px; }
  .meta { display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8; margin-bottom: 24px; }
  h2 { font-size: 14px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid #e2e8f0; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; }
  .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  table th { background: #f1f5f9; color: #475569; font-weight: 600; text-align: left; padding: 8px 12px; border-bottom: 1px solid #e2e8f0; }
  table td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; color: #334155; }
  .pred-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 28px; }
  .pred-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; text-align: center; }
  .pred-card .label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
  .pred-card .value { font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 4px; }
  .pred-card.confidence .value { color: #059669; }
  .footer { margin-top: 36px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #94a3b8; text-align: center; }
  @media print {
    body { padding: 20px; }
    .no-print { display: none !important; }
  }
</style>
</head>
<body>

<div class="header">
  <div class="subtitle">OAHRIS — Automated Skeletal Analysis</div>
  <h1>Biological Profile Prediction Report</h1>
  <div class="case-id">Case ${caseId}</div>
</div>

<div class="meta">
  <span>Generated: ${today}</span>
  <span>Methodology: Bass, W.M. (2005) Human Osteology, 5th Ed.</span>
</div>

<h2>Prediction Results</h2>
<div class="pred-grid">
  <div class="pred-card"><div class="label">Predicted Sex</div><div class="value">${predictions.gender || '—'}</div></div>
  <div class="pred-card"><div class="label">Age Range</div><div class="value">${predictions.ageRange || '—'}</div></div>
  <div class="pred-card"><div class="label">Est. Height</div><div class="value">${predictions.height || '—'}</div></div>
  <div class="pred-card confidence"><div class="label">Confidence</div><div class="value">${predictions.confidence || '—'}</div></div>
</div>

<div class="grid">
  <div class="card">
    <h2>Case Information</h2>
    <table>
      <tr><td style="color:#64748b;">Case ID</td><td><strong>${caseId}</strong></td></tr>
      <tr><td style="color:#64748b;">Investigator</td><td>${basicInfo.userName || '—'}</td></tr>
      <tr><td style="color:#64748b;">Bone Type</td><td>${bonesType || basicInfo.bonesType || '—'}</td></tr>
      <tr><td style="color:#64748b;">Location</td><td>${basicInfo.location || '—'}</td></tr>
      <tr><td style="color:#64748b;">Date Found</td><td>${basicInfo.dateFound || '—'}</td></tr>
      <tr><td style="color:#64748b;">Analysis Date</td><td>${basicInfo.analysisDate || '—'}</td></tr>
    </table>
  </div>

  <div class="card">
    <h2>Measurements — ${bonesType || basicInfo.bonesType || 'N/A'}</h2>
    <table>${measurementRows || '<tr><td colspan="2" style="color:#999;">No measurements recorded</td></tr>'}</table>
  </div>
</div>

<h2>Similar Cases</h2>
<table>
  <thead><tr><th>Case ID</th><th>Bone Type</th><th>Location</th><th>Date Found</th></tr></thead>
  <tbody>${similarRows}</tbody>
</table>

<div class="footer">
  OAHRIS — Osteoarchaeological Human Remains Identification System &nbsp;|&nbsp; Module: Automated Skeletal Analysis (KGC) &nbsp;|&nbsp; IT22299802 — Chamudi
</div>

<script>window.onload = function() { window.print(); }</script>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  // Clean up after a delay
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

export default function Report() {
  const { analysisData, currentCaseId } = useAnalysis();
  const { basicInfo, measurements, predictions } = analysisData;
  const [similarCases, setSimilarCases] = useState([]);

  // Extract measurement fields (exclude bonesType)
  const { bonesType, ...measurementFields } = measurements;

  // Fetch similar cases from Supabase
  useEffect(() => {
    const bt = bonesType || basicInfo.bonesType;
    if (bt) {
      fetchSimilarCases(bt, currentCaseId, 5).then(({ data }) => {
        setSimilarCases(data || []);
      });
    }
  }, [bonesType, basicInfo.bonesType, currentCaseId]);

  const mockAgeData = [
    { ageGroup: '0-18', count: 5 },
    { ageGroup: '19-30', count: 45 },
    { ageGroup: '31-40', count: 20 },
    { ageGroup: '41-50', count: 10 },
    { ageGroup: '51+', count: 2 },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <SkeletalHeader
        title={`Prediction Report ${basicInfo.caseId || '#0001'}`}
        subtitle="Detailed biological profile prediction results"
      />

      <div className="px-6 pb-12 space-y-6">
        {/* Action buttons */}
        <div className="flex gap-3">
          <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
            ✉️ Send Mail
          </button>
          <button
            onClick={() => downloadReport({ basicInfo, measurements, predictions, bonesType, measurementFields, similarCases })}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            ⬇️ Download Report
          </button>
        </div>

        {/* Info + Result cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <h3 className="text-slate-200 font-semibold text-lg border-b border-slate-700 pb-2 mb-4">Basic Information & Features</h3>
            <div className="grid grid-cols-2 gap-y-4 text-sm">
              <div className="text-slate-400">Case ID:</div><div className="text-slate-100 font-medium">{basicInfo.caseId || '—'}</div>
              <div className="text-slate-400">Investigator:</div><div className="text-slate-100 font-medium">{basicInfo.userName || '—'}</div>
              <div className="text-slate-400">Location:</div><div className="text-slate-100 font-medium">{basicInfo.location || '—'}</div>
              <div className="text-slate-400">Date Found:</div><div className="text-slate-100 font-medium">{basicInfo.dateFound || '—'}</div>
              <div className="text-slate-400">Bone Type:</div><div className="text-slate-100 font-medium">{bonesType || basicInfo.bonesType || '—'}</div>
              <div className="text-slate-400">Analysis Date:</div><div className="text-slate-100 font-medium">{basicInfo.analysisDate || '—'}</div>
              {/* Show measurement features */}
              {Object.entries(measurementFields).map(([key, val]) => (
                <React.Fragment key={key}>
                  <div className="text-slate-400">{formatKey(key)}:</div>
                  <div className="text-slate-100 font-medium">{getLabel(val)}</div>
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <h3 className="text-slate-200 font-semibold text-lg border-b border-slate-700 pb-2 mb-4">Prediction Result</h3>
            <div className="space-y-5 mt-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Gender</span>
                <span className="text-slate-100 text-xl font-bold">{predictions.gender || '—'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Age Range</span>
                <span className="text-slate-100 text-xl font-bold">{predictions.ageRange || '—'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Height</span>
                <span className="text-slate-100 text-xl font-bold">{predictions.height || '—'}</span>
              </div>
              <div className="mt-6 p-4 bg-emerald-900/30 rounded-lg border border-emerald-700/30">
                <div className="flex justify-between items-center">
                  <span className="text-emerald-400 font-medium">Confidence Level</span>
                  <span className="text-emerald-400 text-2xl font-bold">{predictions.confidence || '—'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Cases + Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-700">
              <h3 className="text-slate-200 font-semibold">Similar Cases</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left px-6 py-3 text-slate-400 font-medium">Case ID</th>
                    <th className="text-left px-6 py-3 text-slate-400 font-medium">Bones Type</th>
                    <th className="text-left px-6 py-3 text-slate-400 font-medium">Location</th>
                    <th className="text-left px-6 py-3 text-slate-400 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {similarCases.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-6 text-center text-slate-500">No similar cases found</td></tr>
                  ) : similarCases.map((row) => (
                    <tr key={row.case_id} className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors">
                      <td className="px-6 py-3 text-slate-300">{row.case_id}</td>
                      <td className="px-6 py-3 text-slate-300">{row.bone_type}</td>
                      <td className="px-6 py-3 text-slate-300">{row.location}</td>
                      <td className="px-6 py-3 text-slate-300">{formatDate(row.date_found)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <h3 className="text-slate-200 font-semibold mb-4">Age Distribution</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockAgeData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="ageGroup" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: '#374151', opacity: 0.4 }}
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #374151', borderRadius: '8px', color: '#F3F4F6' }}
                  />
                  <Bar dataKey="count" fill="#F97316" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
