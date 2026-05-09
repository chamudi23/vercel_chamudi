import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function AgeDistributionChart({ data }) {
  return (
    <div className="bg-dark-card p-6 rounded-2xl border border-dark-border/50 h-80">
      <h3 className="text-white font-medium mb-6">Age Distribution (All Cases)</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
            <XAxis dataKey="ageGroup" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} label={{ value: 'Cases', angle: -90, position: 'insideLeft', fill: '#9CA3AF', fontSize: 12 }} />
            <Tooltip
              cursor={{ fill: '#374151', opacity: 0.4 }}
              contentStyle={{ backgroundColor: '#1E222D', border: '1px solid #374151', borderRadius: '8px', color: '#F3F4F6' }}
            />
            <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
