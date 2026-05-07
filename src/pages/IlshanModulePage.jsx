import { Link } from 'react-router-dom'

const cards = [
  {
    to: '/upload',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7 text-purple-400">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
      </svg>
    ),
    title: 'Upload Image',
    desc: 'Upload a skeletal bone image with full specimen metadata',
  },
  {
    to: '/gallery',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7 text-purple-400">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 9.75h18M3 6a.75.75 0 01.75-.75h16.5A.75.75 0 0121 6v12a.75.75 0 01-.75.75H3.75A.75.75 0 013 18V6z" />
      </svg>
    ),
    title: 'Image Gallery',
    desc: 'Browse and search all uploaded skeletal images',
  },
  {
    to: '/skeleton',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7 text-purple-400">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
      </svg>
    ),
    title: 'Skeleton Viewer',
    desc: 'Click bones on the skeleton diagram to view linked images',
  },
  {
    to: '/ai-assistant',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7 text-purple-400">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
      </svg>
    ),
    title: 'AI Assistant',
    desc: 'Ask questions about skeletal records in natural language',
  },
]

function IlshanModulePage() {
  return (
    <div className="max-w-4xl mx-auto p-8">

      {/* Header */}
      <div className="mb-8">
        <p className="text-purple-400 text-xs font-medium uppercase tracking-widest mb-2">
          IT21824210 — Ilshan's Module
        </p>
        <h2 className="text-2xl font-bold text-slate-100">
          Skeletal Image Documentation
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Image documentation, annotation, retrieval and visualization
        </p>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-2 gap-6">
        {cards.map(card => (
          <Link
            key={card.to}
            to={card.to}
            className="bg-slate-800 rounded-xl p-6 hover:bg-slate-700 transition-all border border-slate-700 hover:border-purple-500 group"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-900/40 border border-purple-800/40 flex items-center justify-center mb-4">
              {card.icon}
            </div>
            <h3 className="text-lg font-semibold text-slate-100">
              {card.title}
            </h3>
            <p className="text-slate-400 text-sm mt-1">
              {card.desc}
            </p>
            <p className="text-purple-400 text-xs mt-4 group-hover:translate-x-1 transition-transform">
              Open →
            </p>
          </Link>
        ))}
      </div>

    </div>
  )
}

export default IlshanModulePage
