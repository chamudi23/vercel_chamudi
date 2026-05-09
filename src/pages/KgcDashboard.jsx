import { useState } from 'react';
import { Users, Activity, Target, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import SkeletalHeader from '../components/KgcSkeletalHeader';

const mockAgeData = [
  { ageGroup: '0-18', count: 18 },
  { ageGroup: '19-30', count: 68 },
  { ageGroup: '31-40', count: 48 },
  { ageGroup: '41-50', count: 30 },
  { ageGroup: '51+', count: 22 },
];

const mockGenderData = [
  { name: 'Male', value: 60 },
  { name: 'Female', value: 40 },
];

const COLORS = ['#3B82F6', '#9CA3AF'];

const mockTableColumns = [
  { key: 'caseId', label: 'Case ID' },
  { key: 'name', label: 'Name' },
  { key: 'bonesType', label: 'Bones Type' },
  { key: 'location', label: 'Location' },
  { key: 'foundDate', label: 'Found Date' },
];

const mockTableData = [
  { caseId: 'C001', name: 'A N Perera', bonesType: 'Skull', location: 'Kottawa', foundDate: '2026-02-01' },
  { caseId: 'C002', name: 'K Silva', bonesType: 'Pelvis', location: 'Anuradhapura', foundDate: '2026-02-05' },
  { caseId: 'C003', name: 'R Fernando', bonesType: 'Femur', location: 'Polonnaruwa', foundDate: '2026-02-10' },
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
          <p className={`text-2xl font-bold text-slate-100`}>{value}</p>
        </div>
      </div>
    </div>
  );
}

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (e) {
    return dateStr;
  }
};

export default function Dashboard() {
  const [search, setSearch] = useState('');

  const filteredData = mockTableData.filter(row =>
    Object.values(row).some(val => val.toLowerCase().includes(search.toLowerCase()))
  );
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
          <StatCardInline label="Total Cases" value="158" color="text-blue-400" icon={Users} />
          <StatCardInline label="Recent Analysis" value="89" color="text-emerald-400" icon={Activity} />
          <StatCardInline label="Avg Accuracy" value="98.8%" color="text-orange-400" icon={Target} />
          <StatCardInline label="Last Prediction" value="Female" color="text-purple-400" icon={UserCheck} />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-slate-800 p-6 rounded-xl border border-slate-700">
            <h3 className="text-slate-200 font-semibold mb-4">Age Distribution (All Cases)</h3>
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
                  <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <h3 className="text-slate-200 font-semibold mb-4">Gender Distribution</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={mockGenderData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" stroke="none">
                    {mockGenderData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #374151', borderRadius: '8px', color: '#F3F4F6' }}
                  />
                  <Legend
                    formatter={(value) => <span className="text-slate-300 text-sm">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
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
                  {mockTableColumns.map((col) => (
                    <th key={col.key} className="text-left px-6 py-3 text-slate-400 font-medium">{col.label}</th>
                  ))}
                  <th className="text-left px-6 py-3 text-slate-400 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr><td colSpan={mockTableColumns.length + 1} className="px-6 py-8 text-center text-slate-500">No cases found matching "{search}"</td></tr>
                ) : filteredData.map((row, i) => (
                  <tr key={i} className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors">
                    {mockTableColumns.map((col) => (
                      <td key={col.key} className="px-6 py-3 text-slate-300">
                        {col.key === 'foundDate' ? formatDate(row[col.key]) : row[col.key]}
                      </td>
                    ))}
                    <td className="px-6 py-3">
                      <Link to="/skeletal/report" className="text-blue-400 hover:text-blue-300 text-xs transition-colors">
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
