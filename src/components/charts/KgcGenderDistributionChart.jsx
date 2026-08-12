import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export default function GenderDistributionChart({ data }) {
  const COLORS = ['#3B82F6', '#D1D5DB']; // Blue for Male, Gray for Female according to mockup

  const renderLegend = (props) => {
    const { payload } = props;
    return (
      <ul className="flex flex-col gap-2 absolute right-0 bottom-4">
        {payload.map((entry, index) => (
          <li key={`item-${index}`} className="flex items-center gap-2 text-sm text-white">
            <span
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: entry.color }}
            />
            {entry.value}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="bg-dark-card p-6 rounded-2xl border border-dark-border/50 h-80 relative flex items-center justify-center">
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={100}
              paddingAngle={0}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ backgroundColor: '#1E222D', border: '1px solid #374151', borderRadius: '8px', color: '#F3F4F6' }}
              itemStyle={{ color: '#F3F4F6' }}
            />
            <Legend content={renderLegend} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
