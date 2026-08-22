import { useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useAppAuth } from '../../context/AppAuthContext'

// roles: null = every signed-in role sees this link
const navigation = [
  { label: 'Home', to: '/', end: true, roles: null },
  { label: 'Specimen Records', to: '/specimens', roles: null },
  { label: 'Image Library', to: '/gallery', related: ['/image/', '/upload', '/search'], roles: ['researcher', 'student'] },
  { label: 'Skeleton Viewer', to: '/skeleton', roles: ['researcher', 'student'] },
  { label: 'Data Quality', to: '/data-quality', roles: null },
  { label: 'Research Assistant', to: '/ai-assistant', roles: ['researcher'] },
  { label: 'Add Site', to: '/parami/add-site', roles: ['admin'] },
  { label: 'Approvals', to: '/admin/approvals', roles: ['admin'] },
]

function navClass({ isActive }) {
  return [
    'rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950',
    isActive
      ? 'bg-emerald-400/10 text-emerald-300'
      : 'text-slate-300 hover:bg-white/5 hover:text-white',
  ].join(' ')
}

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, role, signOut } = useAppAuth()

  const itemClass = (item) => ({ isActive }) => navClass({
    isActive: isActive || item.related?.some((path) => pathname === path || pathname.startsWith(path)),
  })

  const visibleNavigation = navigation.filter((item) => !item.roles || item.roles.includes(role))

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/95 shadow-lg shadow-black/20 backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-6 px-5 py-3 sm:px-8">
        <Link
          to="/"
          className="min-w-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          onClick={() => setMenuOpen(false)}
        >
          <span className="block text-xl font-bold tracking-wide text-blue-400">OAHRIS</span>
          <span className="hidden text-xs text-slate-400 sm:block">
            Osteoarchaeological Research Information System
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
          {visibleNavigation.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={itemClass(item)}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {user && (
          <div className="hidden items-center gap-3 lg:flex">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-400">
              {role || '...'}
            </span>
            <button
              type="button"
              onClick={handleSignOut}
              className="text-sm text-slate-400 transition-colors hover:text-white"
            >
              Sign Out
            </button>
          </div>
        )}

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-white/10 text-slate-200 transition hover:border-emerald-400/40 hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 lg:hidden"
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {menuOpen && (
        <nav id="mobile-navigation" className="border-t border-white/10 px-5 py-3 lg:hidden" aria-label="Mobile navigation">
          <div className="mx-auto grid max-w-7xl gap-1">
            {visibleNavigation.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={itemClass(item)}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}
            {user && (
              <button
                type="button"
                onClick={() => { setMenuOpen(false); handleSignOut(); }}
                className="mt-2 rounded-md px-3 py-2 text-left text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
              >
                Sign Out ({role})
              </button>
            )}
          </div>
        </nav>
      )}
    </header>
  )
}
