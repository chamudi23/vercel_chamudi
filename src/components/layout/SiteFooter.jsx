import { Link } from 'react-router-dom'

const footerLinks = [
  { label: 'Home', to: '/' },
  { label: 'Specimen Records', to: '/specimens' },
  { label: 'Image Library', to: '/gallery' },
  { label: 'Skeleton Viewer', to: '/skeleton' },
]

export default function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-slate-950 px-5 py-8 text-slate-400 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-7 md:flex-row md:items-start md:justify-between">
          <div className="max-w-lg">
            <p className="text-lg font-bold text-blue-400">OAHRIS</p>
            <p className="mt-1 text-sm text-slate-300">Osteoarchaeological Research Information System</p>
            <p className="mt-3 text-sm leading-6">
              Supporting structured documentation and exploration of osteological records.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-5 gap-y-3 text-sm" aria-label="Footer navigation">
            {footerLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded text-slate-400 transition hover:text-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <p className="mt-8 border-t border-white/10 pt-5 text-xs text-slate-500">
          &copy; 2026 OAHRIS. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
