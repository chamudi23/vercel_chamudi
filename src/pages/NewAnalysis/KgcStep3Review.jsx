/**
 * KgcStep3Review.jsx
 * ==================
 * Step 3 of 3: Review measurements, generate predictions, and finalize analysis.
 * 
 * Workflow:
 * 1. Review all collected data from Step 1 & 2
 * 2. Generate biological profile predictions using bass/anthropometric formulas
 * 3. Save predictions to kgc_predictions table
 * 4. Update case status from 'in_progress' → 'completed' in Supabase
 * 5. Display final report with similar cases for comparison
 * 
 * Prediction Logic: References Bass, W.M. (2005) Human Osteology, 5th edition
 * - Sex determination from dimorphic traits (brow ridge, mastoid, pelvis shape)
 * - Age estimation from fusion/degeneration (cranial suture, pubic symphysis)
 * - Stature calculation using Trotter & Gleser formulae
 */

import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import SkeletalHeader from '../../components/KgcSkeletalHeader';
import { useAnalysis } from '../../context/AnalysisContext';
import { savePrediction, updateCaseStatus, fetchSimilarCases } from '../../services/supabaseService';

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

// Prediction logic based on Bass, W.M. (2005) Human Osteology, 5th ed.
// Stature formulae: Trotter & Gleser "Mongoloid" male as presented by Bass
// (closest available Bass formula for South Asian / Sri Lankan populations)
function computePredictions(measurements) {
  const { bonesType, ...data } = measurements;
  let gender = 'Indeterminate';
  let ageRange = 'Unknown';
  let height = 'Unknown';
  let confidence = 0;
  let factors = 0;

  if (bonesType === 'Skull') {
    // Gender from brow ridge & mastoid
    if (data.browRidge === 'prominent' || data.browRidge === 'thick') gender = 'Male';
    else if (data.browRidge === 'smooth' || data.browRidge === 'less-developed') gender = 'Female';
    else gender = 'Indeterminate';

    if (data.mastoidSize === 'more-30mm') gender = 'Male';
    else if (data.mastoidSize === 'less-25mm') gender = 'Female';

    // Age from jaw shape & cranial suture
    if (data.cranialSuture === 'open') ageRange = '18 - 25';
    else if (data.cranialSuture === 'partially-open') ageRange = '25 - 35';
    else if (data.cranialSuture === 'moderate-closure') ageRange = '35 - 45';
    else if (data.cranialSuture === 'mostly-closed') ageRange = '45 - 55';
    else if (data.cranialSuture === 'completely-closed') ageRange = '55+';

    factors = Object.keys(data).filter(k => data[k]).length;
    confidence = Math.min(95, 70 + factors * 6);

  } else if (bonesType === 'Pelvis') {
    if (data.subpubicAngle === 'wide') gender = 'Female';
    else if (data.subpubicAngle === 'narrow') gender = 'Male';

    if (data.sciaticNotch === 'wide') gender = 'Female';
    else if (data.sciaticNotch === 'narrow') gender = 'Male';

    if (data.pubicSymphysis === 'smooth-flat') ageRange = '18 - 25';
    else if (data.pubicSymphysis === 'moderate-flat-ridges') ageRange = '25 - 40';
    else if (data.pubicSymphysis === 'rough-granular') ageRange = '40 - 55';
    else if (data.pubicSymphysis === 'degenerated-eroded') ageRange = '55+';

    factors = Object.keys(data).filter(k => data[k]).length;
    confidence = Math.min(95, 72 + factors * 7);

  } else if (bonesType === 'Lower Limb') {
    if (data.femurHeadDiameter) {
      const d = parseFloat(data.femurHeadDiameter);
      gender = d > 43 ? 'Male' : d < 41 ? 'Female' : 'Indeterminate';
    }
    if (data.femurLength) {
      const cmLen = parseFloat(data.femurLength) / 10;
      height = `${(2.15 * cmLen + 72.57).toFixed(1)} cm`;
    }
    if (data.growthPlate === 'unfused') ageRange = '< 18';
    else if (data.growthPlate === 'partially-fused') ageRange = '18 - 25';
    else if (data.growthPlate === 'fused') ageRange = '25+';

    factors = Object.keys(data).filter(k => data[k]).length;
    confidence = Math.min(95, 68 + factors * 8);

  } else if (bonesType === 'Upper Limb') {
    if (data.boneRobusticity === 'robust') gender = 'Male';
    else if (data.boneRobusticity === 'gracile') gender = 'Female';

    if (data.humerusLength) {
      const cmLen = parseFloat(data.humerusLength) / 10;
      height = `${(2.68 * cmLen + 83.19).toFixed(1)} cm`;
    }

    factors = Object.keys(data).filter(k => data[k]).length;
    confidence = Math.min(90, 65 + factors * 10);

  } else if (bonesType === 'Thorax') {
    if (data.ribShape === 'smooth') ageRange = '18 - 30';
    else if (data.ribShape === 'scalloped') ageRange = '30 - 50';
    else if (data.ribShape === 'irregular') ageRange = '50+';

    factors = Object.keys(data).filter(k => data[k]).length;
    confidence = Math.min(85, 60 + factors * 10);

  } else if (bonesType === 'Teeth') {
    if (data.teethType === 'deciduous') ageRange = '< 6';
    else if (data.teethType === 'mixed') ageRange = '6 - 12';
    else if (data.teethType === 'permanent') {
      if (data.dentalWear === 'none') ageRange = '12 - 20';
      else if (data.dentalWear === 'mild') ageRange = '20 - 35';
      else if (data.dentalWear === 'moderate') ageRange = '35 - 50';
      else if (data.dentalWear === 'severe') ageRange = '50+';
    }
    factors = Object.keys(data).filter(k => data[k]).length;
    confidence = Math.min(90, 65 + factors * 8);
  }

  return { gender, ageRange, height, confidence: confidence.toFixed(1) + '%' };
}

export default function Step3Review() {
  const navigate = useNavigate();
  const { analysisData, currentCaseId, setPredictions } = useAnalysis();
  const steps = ['Basic Information', 'Skeletal Measurements', 'Review & Predict'];
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [similarCases, setSimilarCases] = useState([]);

  const { basicInfo, measurements } = analysisData;

  // Compute predictions from measurements
  const predictions = computePredictions(measurements);

  // Build a summary of measurements entered
  const { bonesType, ...measurementFields } = measurements;

  // Fetch similar cases from Supabase
  useEffect(() => {
    if (bonesType) {
      fetchSimilarCases(bonesType, currentCaseId, 5).then(({ data }) => {
        setSimilarCases(data || []);
      });
    }
  }, [bonesType, currentCaseId]);

  const handleGenerateReport = async () => {
    setSaving(true);
    setSaveError(null);

    try {
      // 1. Save predictions to Supabase
      const { error: predErr } = await savePrediction(currentCaseId, predictions);
      if (predErr) throw new Error(`Prediction save failed: ${predErr.message}`);

      // 2. Update case status to 'completed'
      const { error: statusErr } = await updateCaseStatus(currentCaseId, 'completed');
      if (statusErr) throw new Error(`Status update failed: ${statusErr.message}`);

      // 3. Save predictions to context & navigate
      setPredictions(predictions);
      navigate('/skeletal/report');
    } catch (err) {
      console.error('Step 3 save error:', err);
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch { return dateStr; }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <SkeletalHeader title="Prediction Results" subtitle="Step 3 of 3 — Review predicted biological profile" />
      <div className="px-6 pb-12">
        <div className="flex items-center justify-center gap-4 mb-10">
          {steps.map((step, i) => (
            <div key={step} className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold border-2 ${i === 2 ? 'bg-orange-500 border-orange-500 text-white' : 'bg-blue-500 border-blue-500 text-white'}`}>{i + 1}</div>
              <span className={`text-sm font-medium ${i === 2 ? 'text-orange-400' : 'text-slate-300'}`}>{step}</span>
              {i < 2 && <div className="w-12 h-px bg-slate-600" />}
            </div>
          ))}
        </div>

        {/* Error banner */}
        {saveError && (
          <div className="mb-6 bg-red-900/30 border border-red-700/50 text-red-300 px-4 py-3 rounded-lg text-sm">
            <strong>Error:</strong> {saveError}
          </div>
        )}

        <div className="space-y-6">
          {/* Prediction Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { l: 'Gender', v: predictions.gender },
              { l: 'Age Range', v: predictions.ageRange },
              { l: 'Height', v: predictions.height },
              { l: 'Confidence', v: predictions.confidence, c: 'text-emerald-400' },
            ].map(s => (
              <div key={s.l} className="bg-slate-800 border border-slate-700 p-6 rounded-xl text-center">
                <span className="text-slate-400 text-sm">{s.l}</span>
                <p className={`text-2xl font-bold mt-2 ${s.c || 'text-slate-100'}`}>{s.v}</p>
              </div>
            ))}
          </div>

          {/* Basic Info Review */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <h3 className="text-slate-200 font-semibold mb-4 border-b border-slate-700 pb-2">Basic Information</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div><span className="text-slate-400">Case ID:</span> <span className="text-slate-100 ml-2 font-medium">{basicInfo.caseId || '—'}</span></div>
              <div><span className="text-slate-400">Investigator:</span> <span className="text-slate-100 ml-2 font-medium">{basicInfo.userName || '—'}</span></div>
              <div><span className="text-slate-400">Location:</span> <span className="text-slate-100 ml-2 font-medium">{basicInfo.location || '—'}</span></div>
              <div><span className="text-slate-400">Bone Type:</span> <span className="text-slate-100 ml-2 font-medium">{basicInfo.bonesType || '—'}</span></div>
              <div><span className="text-slate-400">Date Found:</span> <span className="text-slate-100 ml-2 font-medium">{basicInfo.dateFound || '—'}</span></div>
              <div><span className="text-slate-400">Analysis Date:</span> <span className="text-slate-100 ml-2 font-medium">{basicInfo.analysisDate || '—'}</span></div>
            </div>
          </div>

          {/* Measurements Review */}
          {Object.keys(measurementFields).length > 0 && (
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <h3 className="text-slate-200 font-semibold mb-4 border-b border-slate-700 pb-2">Measurements Entered ({bonesType})</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                {Object.entries(measurementFields).map(([key, val]) => (
                  <div key={key}>
                    <span className="text-slate-400">{key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}:</span>
                    <span className="text-slate-100 ml-2 font-medium">{getLabel(val)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Similar Cases — from Supabase */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-700"><h3 className="text-slate-200 font-semibold">Similar Cases</h3></div>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-700">
                <th className="text-left px-6 py-3 text-slate-400 font-medium">Case ID</th>
                <th className="text-left px-6 py-3 text-slate-400 font-medium">Bones Type</th>
                <th className="text-left px-6 py-3 text-slate-400 font-medium">Location</th>
                <th className="text-left px-6 py-3 text-slate-400 font-medium">Date</th>
              </tr></thead>
              <tbody>
                {similarCases.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-6 text-center text-slate-500">No similar cases found yet</td></tr>
                ) : similarCases.map((r) => (
                  <tr key={r.case_id} className="border-b border-slate-700 hover:bg-slate-700/50">
                    <td className="px-6 py-3 text-slate-300">{r.case_id}</td>
                    <td className="px-6 py-3 text-slate-300">{r.bone_type}</td>
                    <td className="px-6 py-3 text-slate-300">{r.location}</td>
                    <td className="px-6 py-3 text-slate-300">{formatDate(r.date_found)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between pt-4">
            <button onClick={() => navigate('/skeletal/dashboard')} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors">Back To Dashboard</button>
            <button
              onClick={handleGenerateReport}
              disabled={saving}
              className="bg-orange-500 hover:bg-orange-400 disabled:bg-orange-500/50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              {saving && (
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" /><path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="opacity-75" /></svg>
              )}
              {saving ? 'Saving…' : 'Generate Report →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
