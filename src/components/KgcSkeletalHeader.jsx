import { useNavigate } from 'react-router-dom';

export default function SkeletalHeader({ title, subtitle }) {
  const navigate = useNavigate();

  return (
    <>
      {/* Top nav bar — matches Minuri's pattern */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <button
          onClick={() => navigate("/skeletal")}
          className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Module Overview
        </button>
        <span className="text-xs text-white/30 tracking-widest uppercase">IT22299802 — Chamudi</span>
      </div>

      {/* Page header */}
      <div className="px-6 pt-8 pb-6">
        <p className="text-orange-400 text-xs font-medium uppercase tracking-widest mb-2">
          Automated Skeletal Analysis
        </p>
        <h2 className="text-2xl font-bold text-slate-100">{title}</h2>
        {subtitle && (
          <p className="text-slate-400 text-sm mt-1">{subtitle}</p>
        )}
      </div>
    </>
  );
}
