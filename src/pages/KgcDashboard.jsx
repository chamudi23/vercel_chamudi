/**
 * KgcDashboard.jsx
 * ================
 * Overview dashboard for the Automated Skeletal Analysis module.
 *
 * All statistics are derived from the module's own `analyses` table
 * (via analysisStore → skeletalSupabase / jlqnqzlvpljntpnbdaci).
 */

import { useState, useEffect, useMemo } from 'react';
import { Users, Activity, Target, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import SkeletalHeader from '../components/KgcSkeletalHeader';
import { getAllAnalyses } from '../lib/analysisStore';
import { averageConfidence } from '../lib/analysisStats';

const COLORS = ['#3B82F6', '#EC4899', '#9CA3AF'];

const columns = [
  { key: 'caseId', label: 'Case ID' },
  { key: 'bonesType', label: 'Bones Type' },
  { key: 'location', label: 'Location' },
  { key: 'gender', label: 'Gender' },
  { key: 'foundDate', label: 'Found Date' },
];

function StatCardInline({ label, value, color, icon: Icon }) {
  return (
    <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
          {Icon && <Icon className={`w-6 h-6 ${color}`} />}
        </div>
        <div>
          <p className="text-slate-400 text-sm">{label}</p>
          <p className="text-2xl font-bold text-slate-100">{value}</p>
        </div>
      </div>
    </div>
  );
}

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch (e) {
    return dateStr;
  }
};

// Bucket an age-range string (e.g. "25 - 35", "55+", "< 6") into a group.
function ageBucket(range = '') {
  const r = String(range);
  if (/</.test(r) || /\b(6|12|18)\b/.test(r)) return '0-18';
  if (/\b(19|20|25|30)\b/.test(r)) return '19-30';
  if (/\b(31|35|40)\b/.test(r)) return '31-40';
  if (/\b(41|45|50)\b/.test(r)) return '41-50';
  if (/\+/.test(r) || /\b(51|55|60)\b/.test(r)) return '51+';
  return null;
}

export default function Dashboard() {
  const [search, setSearch] = useState('');
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getAllAnalyses().then((list) => {
      if (!active) return;
      setAnalyses(list);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  // Rows for the table
  const rows = useMemo(
    () =>
      analyses.map((a) => ({
        caseId: a.caseId,
        bonesType: a.measurements?.bonesType || a.basicInfo?.bonesType || '—',
        location: a.basicInfo?.location || '—',
        gender: a.predictions?.gender || '—',
        foundDate: a.basicInfo?.dateFound || '',
      })),
    [analyses]
  );

  // Aggregated stats
  const stats = useMemo(() => {
    const preds = analyses.map((a) => a.predictions || {});
    const avgConfidence = averageConfidence(analyses);

    const genderCounts = { Male: 0, Female: 0, Indeterminate: 0 };
    preds.forEach((p) => {
      if (genderCounts[p.gender] !== undefined) genderCounts[p.gender]++;
    });

    const buckets = { '0-18': 0, '19-30': 0, '31-40': 0, '41-50': 0, '51+': 0 };
    preds.forEach((p) => {
      const b = ageBucket(p.ageRange);
      if (b) buckets[b]++;
    });

    return {
      totalCases: analyses.length,
      withHeight: preds.filter((p) => p.height && p.height !== 'Unknown').length,
      avgConfidence,
      lastPrediction: preds[0]?.gender || '—',
      genderData: [
        { name: 'Male', value: genderCounts.Male },
        { name: 'Female', value: genderCounts.Female },
        { name: 'Indeterminate', value: genderCounts.Indeterminate },
      ].filter((d) => d.value > 0),
      ageData: Object.entries(buckets).map(([ageGroup, count]) => ({ ageGroup, count })),
    };
  }, [analyses]);

  const filteredData = rows.filter((row) =>
    Object.values(row).some((val) => String(val).toLowerCase().includes(search.toLowerCase()))
  );

  const ageData = stats.ageData;
  const genderData = stats.genderData;

  return (
    <div className="max-w-6xl mx-auto">
      <SkeletalHeader
        title="Dashboard"
        subtitle="Overview of all skeletal analysis cases, predictions, and statistics"
      />

      <div className="px-6 pb-12 space-y-6">
        {/* New Analysis Button */}
        <div className="flex justify-end">
          <Link
            to="/skeletal/analysis/new"
            className="bg-orange-500 hover:bg-orange-400 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all shadow-lg shadow-orange-500/20"
          >
            <Activity className="w-4 h-4" />
            New Analysis
          </Link>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCardInline label="Total Cases" value={loading ? '…' : stats.totalCases} color="text-blue-400" icon={Users} />
          <StatCardInline label="With Height" value={loading ? '…' : stats.withHeight} color="text-emerald-400" icon={Activity} />
          <StatCardInline label="Avg Confidence" value={loading ? '…' : `${stats.avgConfidence}%`} color="text-orange-400" icon={Target} />
          <StatCardInline label="Last Prediction" value={loading ? '…' : stats.lastPrediction} color="text-purple-400" icon={UserCheck} />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-slate-800 p-6 rounded-xl border border-slate-700">
            <h3 className="text-slate-200 font-semibold mb-4">Age Distribution (All Cases)</h3>
            <div className="h-64 w-full">
              {ageData.some((d) => d.count > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ageData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                    <XAxis dataKey="ageGroup" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      cursor={{ fill: '#374151', opacity: 0.4 }}
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #374151', borderRadius: '8px', color: '#F3F4F6' }}
                    />
                    <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                  No prediction data yet. Complete an analysis to see charts.
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <h3 className="text-slate-200 font-semibold mb-4">Gender Distribution</h3>
            <div className="h-64 w-full">
              {genderData.some((d) => d.value > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={genderData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" stroke="none">
                      {genderData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #374151', borderRadius: '8px', color: '#F3F4F6' }}
                    />
                    <Legend formatter={(value) => <span className="text-slate-300 text-sm">{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 text-sm">No prediction data yet.</div>
              )}
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between flex-wrap gap-3">
            <h3 className="text-slate-200 font-semibold">Recent Cases</h3>
            <div className="flex items-center gap-4">
              <div className="relative">
                <svg className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                <input
                  type="text"
                  placeholder="Search cases..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-slate-900 border border-slate-600 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors w-56"
                />
              </div>
              <Link to="/skeletal/cases" className="text-orange-400 text-sm hover:text-orange-300 transition-colors">
                View All →
              </Link>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  {columns.map((col) => (
                    <th key={col.key} className="text-left px-6 py-3 text-slate-400 font-medium">{col.label}</th>
                  ))}
                  <th className="text-left px-6 py-3 text-slate-400 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={columns.length + 1} className="px-6 py-8 text-center text-slate-500">Loading cases…</td></tr>
                ) : filteredData.length === 0 ? (
                  <tr><td colSpan={columns.length + 1} className="px-6 py-8 text-center text-slate-500">
                    {search ? `No cases found matching "${search}"` : 'No cases yet. Start a new analysis!'}
                  </td></tr>
                ) : filteredData.slice(0, 8).map((row) => (
                  <tr key={row.caseId} className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-3 text-slate-300 font-mono text-xs">{row.caseId}</td>
                    <td className="px-6 py-3 text-slate-300">{row.bonesType}</td>
                    <td className="px-6 py-3 text-slate-300">{row.location}</td>
                    <td className="px-6 py-3 text-slate-300">{row.gender}</td>
                    <td className="px-6 py-3 text-slate-300">{formatDate(row.foundDate)}</td>
                    <td className="px-6 py-3">
                      <Link to={`/skeletal/report/${encodeURIComponent(row.caseId)}`} className="text-blue-400 hover:text-blue-300 text-xs transition-colors">
                        View Report
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
