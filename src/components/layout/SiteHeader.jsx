import { useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { LogOut, Menu, X } from 'lucide-react'
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
  { label: 'GIS', to: '/parami' },
  { label: 'Image Library', to: '/gallery', related: ['/image/', '/upload', '/search'] },
  { label: 'Skeleton Viewer', to: '/skeleton' },
  { label: 'Data Quality', to: '/data-quality', requires: 'curator' },
  { label: 'Users', to: '/admin/users', requires: 'admin' },
]

function navClass({ isActive }) {
  return [
    'inline-flex items-center rounded-lg px-2.5 py-2 text-[13px] font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 min-[1100px]:px-1.5 min-[1100px]:text-[12px] min-[1280px]:px-2 min-[1280px]:text-[13px]',
    isActive
      ? 'bg-emerald-400/10 text-emerald-300'
      : 'text-slate-300 hover:bg-emerald-400/[0.07] hover:text-slate-100',
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
    <div className="flex items-center gap-2.5">
      <div className="hidden min-w-0 text-right sm:block">
        <span className="block max-w-[9.5rem] truncate text-sm font-medium text-slate-200">{name}</span>
        {role && (
          <span
            className={`mt-0.5 inline-block rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${ROLE_STYLE[role]}`}
          >
            {role}
          </span>
        )}
      </div>
      <div className="hidden h-7 w-px bg-white/10 sm:block" aria-hidden="true" />
      <button
        type="button"
        onClick={async () => {
          onNavigate?.()
          await signOut()
          navigate('/', { replace: true })
        }}
        className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-sm text-slate-300 transition hover:border-emerald-400/35 hover:bg-emerald-400/[0.07] hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
      >
        <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Sign out</span>
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
    <header className="sticky top-0 z-50 border-b border-white/[0.09] bg-slate-950/95 shadow-md shadow-black/20 backdrop-blur-xl">
      <div className="mx-auto flex min-h-[4.75rem] max-w-[120rem] items-center gap-2.5 px-5 py-2 sm:px-6">
        <Link
          to={isAuthenticated ? '/app' : '/'}
          className="shrink-0 rounded-md leading-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 min-[1100px]:w-48"
          onClick={() => setMenuOpen(false)}
        >
          <span className="block text-lg font-extrabold tracking-[0.08em] text-emerald-300">OAHRIS</span>
          <span className="mt-0.5 hidden text-[11px] tracking-wide sm:block">
            <span className="text-slate-400">Osteoarchaeological Research</span>{' '}
            <span className="text-emerald-300">Information System</span>
          </span>
        </Link>

        {isAuthenticated && (
          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 border-l border-white/[0.07] pl-2.5 min-[1100px]:flex" aria-label="Primary navigation">
            {visible.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={itemClass(item)}>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        )}

        <div className="ml-auto flex shrink-0 items-center gap-2.5">
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
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-slate-200 transition hover:border-emerald-400/40 hover:bg-emerald-400/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 min-[1100px]:hidden"
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
        <nav id="mobile-navigation" className="border-t border-white/10 px-5 py-3 min-[1100px]:hidden" aria-label="Mobile navigation">
          <div className="mx-auto grid max-w-[120rem] gap-1 sm:grid-cols-2">
            {visible.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={itemClass(item)}
                onClick={() => setMenuOpen(false)}
              >
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </header>
  )
}
