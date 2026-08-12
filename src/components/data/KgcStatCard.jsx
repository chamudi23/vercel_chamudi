export default function StatCard({ title, value, subtitle, subtitleColor = 'text-brand-blue', icon: Icon }) {
  return (
    <div className="bg-dark-card p-6 rounded-2xl flex items-center gap-6 shadow-sm border border-dark-border/50">
      <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shrink-0">
        {Icon && <Icon className="w-8 h-8 text-brand-blue" />}
      </div>
      <div>
        <h3 className="text-text-secondary text-sm font-medium">{title}</h3>
        <p className="text-white text-3xl font-bold mt-1 mb-1">{value}</p>
        <p className={`text-xs ${subtitleColor}`}>{subtitle}</p>
      </div>
    </div>
  );
}
