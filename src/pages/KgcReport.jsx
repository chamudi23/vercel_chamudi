import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import SkeletalHeader from '../components/KgcSkeletalHeader';
import KgcSimilarCases from '../components/KgcSimilarCases';
import KgcAgeDistribution from '../components/KgcAgeDistribution';
import { useAnalysis } from '../context/AnalysisContext';
import { getAnalysis } from '../lib/analysisStore';
import { sendReportEmail } from '../lib/emailReport';
import { SENDER_EMAIL } from '../lib/emailConfig';

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
  'Incisors': 'Incisors', 'Cranines': 'Cranines', 'Premolar': 'Premolar', 'Molar': 'Molar',
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

export default function Report() {
  const { caseId } = useParams();
  const { analysisData } = useAnalysis();
  const [stored, setStored] = useState(undefined); // undefined = loading, null = not found

  // Send-mail modal state
  const [mailOpen, setMailOpen] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null); // { ok: bool, msg: string }

  // Load the requested case from Supabase (or use the live analysis if no id).
  useEffect(() => {
    let active = true;
    if (!caseId) {
      setStored(null);
      return;
    }
    setStored(undefined);
    getAnalysis(caseId).then((rec) => {
      if (active) setStored(rec);
    });
    return () => {
      active = false;
    };
  }, [caseId]);

  const loading = Boolean(caseId) && stored === undefined;
  const source = (caseId ? stored : analysisData) || {};
  const basicInfo = source.basicInfo || {};
  const measurements = source.measurements || {};
  const predictions = source.predictions || {};
  const { bonesType, ...measurementFields } = measurements;
  const notFound = Boolean(caseId) && stored === null;

  // Result of the single catalogue read performed by KgcSimilarCases below;
  // null until it resolves. Shared so the age chart needs no query of its own.
  const [catalogue, setCatalogue] = useState(null);

  /* ---------------- Build the PDF (shared by download + email) --------- */
  const pdfFileName = () => `Report-${basicInfo.caseId || caseId || 'analysis'}.pdf`;

  const buildPdfDoc = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const left = 48;
    let y = 60;
    const line = (h = 18) => (y += h);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(20, 20, 20);
    doc.text('Skeletal Analysis — Prediction Report', left, y);
    line(10);
    doc.setDrawColor(230, 130, 40);
    doc.setLineWidth(2);
    doc.line(left, y, 547, y);
    line(28);

    const section = (title) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(230, 130, 40);
      doc.text(title, left, y);
      line(20);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(40, 40, 40);
    };
    const row = (k, v) => {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(90, 90, 90);
      doc.text(`${k}:`, left, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(20, 20, 20);
      doc.text(String(v ?? '—'), left + 160, y);
      line();
    };

    section('Basic Information');
    row('Case ID', basicInfo.caseId || caseId || '—');
    row('Investigator', basicInfo.userName);
    row('Location', basicInfo.location);
    row('Date Found', basicInfo.dateFound);
    row('Bone Type', bonesType || basicInfo.bonesType);
    row('Analysis Date', basicInfo.analysisDate);
    line(10);

    if (Object.keys(measurementFields).length) {
      section('Measurements');
      Object.entries(measurementFields).forEach(([k, val]) => row(formatKey(k), getLabel(val)));
      line(10);
    }

    section('Prediction Result');
    row('Gender', predictions.gender);
    row('Age Range', predictions.ageRange);
    row('Height', predictions.height);
    row('Confidence', predictions.confidence);
    line(24);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(130, 130, 130);
    doc.text('OAHRIS — Automated Skeletal Analysis System. Estimates are supportive and should be', left, y);
    line(12);
    doc.text('confirmed by a trained professional.', left, y);

    return doc;
  };

  const handleDownload = () => buildPdfDoc().save(pdfFileName());

  /* ---------------- Send Mail (opens recipient modal) ---------------- */
  const openMail = () => {
    setSendResult(null);
    setRecipient(basicInfo.email || ''); // prefill with the case email if any
    setMailOpen(true);
  };

  const buildMessage = () =>
    [
      'Skeletal Analysis — Prediction Report',
      '',
      `Case ID: ${basicInfo.caseId || caseId || '—'}`,
      `Investigator: ${basicInfo.userName || '—'}`,
      `Location: ${basicInfo.location || '—'}`,
      `Date Found: ${basicInfo.dateFound || '—'}`,
      `Bone Type: ${bonesType || basicInfo.bonesType || '—'}`,
      `Analysis Date: ${basicInfo.analysisDate || '—'}`,
      '',
      'Prediction Result',
      `  Gender: ${predictions.gender || '—'}`,
      `  Age Range: ${predictions.ageRange || '—'}`,
      `  Height: ${predictions.height || '—'}`,
      `  Confidence: ${predictions.confidence || '—'}`,
      '',
      `Sent from ${SENDER_EMAIL} · OAHRIS — Automated Skeletal Analysis System.`,
    ].join('\n');

  const handleSend = async () => {
    const to = recipient.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      setSendResult({ ok: false, msg: 'Please enter a valid email address.' });
      return;
    }
    setSending(true);
    setSendResult(null);

    const { error } = await sendReportEmail(to, {
      caseId: basicInfo.caseId || caseId || '—',
      investigator: basicInfo.userName || '—',
      location: basicInfo.location || '—',
      boneType: bonesType || basicInfo.bonesType || '—',
      gender: predictions.gender || '—',
      ageRange: predictions.ageRange || '—',
      height: predictions.height || '—',
      confidence: predictions.confidence || '—',
      message: buildMessage(),
    });
    setSending(false);
    if (error) {
      setSendResult({ ok: false, msg: error.message });
    } else {
      setSendResult({ ok: true, msg: `Report sent to ${to} from ${SENDER_EMAIL} (a copy was kept via BCC).` });
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <SkeletalHeader title="Prediction Report" subtitle="Loading case from the database…" />
        <div className="px-6 py-24 text-center text-slate-500 text-sm">Loading report…</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <SkeletalHeader
        title={`Prediction Report ${basicInfo.caseId || caseId || '#0001'}`}
        subtitle="Detailed biological profile prediction results"
      />

      <div className="px-6 pb-12 space-y-6">
        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={openMail}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            ✉️ Send Mail
          </button>
          <button
            onClick={handleDownload}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            ⬇️ Download Report
          </button>
        </div>

        {notFound && (
          <div className="bg-amber-900/20 border border-amber-700/40 text-amber-300 rounded-lg px-4 py-3 text-sm">
            Case <span className="font-mono font-semibold">{caseId}</span> was not found in the database. It may not
            have been saved yet, or the analyses table may not exist. See setup notes if this persists.
          </div>
        )}

        {/* Info + Result cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <h3 className="text-slate-200 font-semibold text-lg border-b border-slate-700 pb-2 mb-4">Basic Information & Features</h3>
            <div className="grid grid-cols-2 gap-y-4 text-sm">
              <div className="text-slate-400">Case ID:</div><div className="text-slate-100 font-medium">{basicInfo.caseId || caseId || '—'}</div>
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
          {/* Similar Cases — live from the Centralized Specimen Record
              Management catalogue (read-only; see lib/similarCases.js) */}
          <KgcSimilarCases
            basicInfo={basicInfo}
            measurements={measurements}
            predictions={predictions}
            compact
            onResult={setCatalogue}
          />

          {/* Age distribution of the same scanned specimens. Fed from the
              panel's result above, so the pair costs one catalogue read. */}
          <KgcAgeDistribution
            distribution={catalogue?.ageDistribution}
            analysisType={catalogue?.analysisType || measurements.bonesType || ''}
            loading={catalogue === null}
          />
        </div>
      </div>

      {/* ---------------- Send Mail modal ---------------- */}
      {mailOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => !sending && setMailOpen(false)}
        >
          <div
            className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-100 text-lg font-semibold">Email this report</h3>
              <button
                onClick={() => !sending && setMailOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
                aria-label="Close"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Sender (fixed) */}
            <div className="mb-4 flex items-center gap-2 text-xs text-slate-400 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2">
              <span className="uppercase tracking-wider text-[10px] text-slate-500">From</span>
              <span className="font-mono text-emerald-400">{SENDER_EMAIL}</span>
            </div>

            {/* Recipient */}
            <label className="text-slate-400 text-sm mb-1.5 block">Recipient email address</label>
            <input
              type="email"
              autoFocus
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !sending && handleSend()}
              placeholder="name@example.com"
              disabled={sending}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-colors disabled:opacity-60"
            />

            {/* Result message */}
            {sendResult && (
              <div
                className={`mt-3 rounded-lg px-3 py-2 text-sm border ${
                  sendResult.ok
                    ? 'bg-emerald-900/20 border-emerald-700/40 text-emerald-300'
                    : 'bg-red-900/20 border-red-700/40 text-red-300'
                }`}
              >
                {sendResult.ok ? '✓ ' : ''}
                {sendResult.msg}
              </div>
            )}

            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setMailOpen(false)}
                disabled={sending}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white border border-slate-600 hover:border-slate-500 transition-colors disabled:opacity-60"
              >
                {sendResult?.ok ? 'Close' : 'Cancel'}
              </button>
              {!sendResult?.ok && (
                <button
                  onClick={handleSend}
                  disabled={sending}
                  className="px-5 py-2 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {sending && (
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" /><path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="opacity-75" /></svg>
                  )}
                  {sending ? 'Sending…' : 'Send'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
