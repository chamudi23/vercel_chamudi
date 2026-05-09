import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import SkeletalHeader from '../components/KgcSkeletalHeader';
import { useAnalysis } from '../context/AnalysisContext';

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

export default function Report() {
  const { analysisData } = useAnalysis();
  const { basicInfo, measurements, predictions } = analysisData;

  // Extract measurement fields (exclude bonesType)
  const { bonesType, ...measurementFields } = measurements;

  const mockSimilarCasesData = [
    { caseId: 'C089', name: 'Unknown', bonesType: 'Skull', location: 'Texas', foundDate: '2023-01-15' },
    { caseId: 'C102', name: 'Unknown', bonesType: 'Skull', location: 'Nevada', foundDate: '2023-04-22' },
  ];

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
          <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
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
                  {mockSimilarCasesData.map((row, i) => (
                    <tr key={i} className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors">
                      <td className="px-6 py-3 text-slate-300">{row.caseId}</td>
                      <td className="px-6 py-3 text-slate-300">{row.bonesType}</td>
                      <td className="px-6 py-3 text-slate-300">{row.location}</td>
                      <td className="px-6 py-3 text-slate-300">{row.foundDate}</td>
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
