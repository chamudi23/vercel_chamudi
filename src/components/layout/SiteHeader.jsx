import { useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

/**
 * Primary navigation.
 *
 * `requires` marks entries that only curators (admin + researcher) or admins
 * should see. Hiding a link is a courtesy, not a control — the route guard
 * refuses the page and Row-Level Security refuses the data underneath it.
 */
const navigation = [
  { label: 'Home', to: '/app', end: true },
  { label: 'Specimen Records', to: '/specimens' },
  { label: 'Skeletal Analysis', to: '/skeletal' },
  { label: 'Spatial Analysis', to: '/parami' },
  { label: 'Image Library', to: '/gallery', related: ['/image/', '/upload', '/search'] },
  { label: 'Skeleton Viewer', to: '/skeleton' },
  { label: 'Data Quality', to: '/data-quality', requires: 'curator' },
  { label: 'Research Assistant', to: '/ai-assistant' },
  { label: 'Users', to: '/admin/users', requires: 'admin' },
]

function navClass({ isActive }) {
  return [
    'rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950',
    isActive
      ? 'bg-emerald-400/10 text-emerald-300'
      : 'text-slate-300 hover:bg-white/5 hover:text-white',
  ].join(' ')
}

const ROLE_STYLE = {
  admin: 'border-purple-500/30 bg-purple-500/10 text-purple-300',
  researcher: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  student: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
}

function UserChip({ onNavigate }) {
  const { user, profile, role, signOut } = useAuth()
  const navigate = useNavigate()

  if (!user) return null

  const name = profile?.full_name || user.email?.split('@')[0] || 'Account'

  return (
    <div className="flex items-center gap-3">
      <div className="hidden text-right sm:block">
        <span className="block max-w-[14rem] truncate text-sm text-slate-200">{name}</span>
        {role && (
          <span
            className={`mt-0.5 inline-block rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${ROLE_STYLE[role]}`}
          >
            {role}
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={async () => {
          onNavigate?.()
          await signOut()
          navigate('/', { replace: true })
        }}
        className="rounded-md border border-white/10 px-3 py-2 text-sm text-slate-300 transition hover:border-red-400/40 hover:bg-white/5 hover:text-white"
      >
        Sign out
      </button>
    </div>
  )
}

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()
  const { isAuthenticated, canWrite, isAdmin } = useAuth()

  const visible = navigation.filter((item) => {
    if (item.requires === 'admin') return isAdmin
    if (item.requires === 'curator') return canWrite
    return true
  })

  const itemClass = (item) => ({ isActive }) => navClass({
    isActive: isActive || item.related?.some((path) => pathname === path || pathname.startsWith(path)),
  })

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/95 shadow-lg shadow-black/20 backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-6 px-5 py-3 sm:px-8">
        <Link
          to={isAuthenticated ? '/app' : '/'}
          className="min-w-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          onClick={() => setMenuOpen(false)}
        >
          <span className="block text-xl font-bold tracking-wide text-blue-400">OAHRIS</span>
          <span className="hidden text-xs text-slate-400 sm:block">
            Osteoarchaeological Research Information System
          </span>
        </Link>

        {isAuthenticated && (
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
            {visible.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={itemClass(item)}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <UserChip onNavigate={() => setMenuOpen(false)} />
          ) : (
            <Link
              to="/login"
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
            >
              Sign in
            </Link>
          )}

          {isAuthenticated && (
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
          )}
        </div>
      </div>

      {menuOpen && isAuthenticated && (
        <nav id="mobile-navigation" className="border-t border-white/10 px-5 py-3 lg:hidden" aria-label="Mobile navigation">
          <div className="mx-auto grid max-w-7xl gap-1">
            {visible.map((item) => (
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
          </div>
        </nav>
      )}
    </header>
  )
}
