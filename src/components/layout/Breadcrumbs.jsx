import { Link, matchPath, useLocation } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

const routeTrails = [
  { pattern: '/specimens/add', trail: [['Specimen Records', '/specimens'], ['Add Specimen']] },
  { pattern: '/specimens/import', trail: [['Specimen Records', '/specimens'], ['Import Records']] },
  { pattern: '/specimens/:id', trail: [['Specimen Records', '/specimens'], ['Specimen Details']] },
  { pattern: '/specimens', trail: [['Specimen Records']] },
  { pattern: '/image/:imageId', trail: [['Image Library', '/gallery'], ['Image Details']] },
  { pattern: '/upload', trail: [['Image Library', '/gallery'], ['Upload Image']] },
  { pattern: '/gallery', trail: [['Image Library']] },
  { pattern: '/search', trail: [['Image Library']] },
  { pattern: '/skeleton', trail: [['Skeleton Viewer']] },
  { pattern: '/data-quality', trail: [['Data Quality']] },
  { pattern: '/ai-assistant', trail: [['Research Assistant']] },
  { pattern: '/analysis', trail: [['Research Assistant']] },
  { pattern: '/image-documentation', trail: [['Image Documentation']] },
  { pattern: '/module', trail: [['Image Documentation']] },
  { pattern: '/data-management', trail: [['Specimen Record Management']] },
  { pattern: '/minuri/sites/:siteId', trail: [['Specimen Record Management', '/minuri'], ['Sites', '/minuri/sites'], ['Site Details']] },
  { pattern: '/minuri/sites', trail: [['Specimen Record Management', '/minuri'], ['Sites']] },
  { pattern: '/minuri/storage-locations/add', trail: [['Specimen Record Management', '/minuri'], ['Storage Locations', '/minuri/storage-locations'], ['Add Location']] },
  { pattern: '/minuri/storage-locations/edit/:locationId', trail: [['Specimen Record Management', '/minuri'], ['Storage Locations', '/minuri/storage-locations'], ['Edit Location']] },
  { pattern: '/minuri/storage-locations', trail: [['Specimen Record Management', '/minuri'], ['Storage Locations']] },
  { pattern: '/minuri', trail: [['Specimen Record Management']] },
  { pattern: '/parami/site/:siteId', trail: [['Spatial Analysis', '/parami'], ['Site Details']] },
  { pattern: '/parami/similar-findings', trail: [['Spatial Analysis', '/parami'], ['Similar Findings']] },
  { pattern: '/parami/home', trail: [['Spatial Analysis']] },
  { pattern: '/spatial-analysis', trail: [['Spatial Analysis']] },
  { pattern: '/parami', trail: [['Spatial Analysis']] },
]

export default function Breadcrumbs() {
  const { pathname } = useLocation()

  if (pathname === '/') return null

  const match = routeTrails.find((route) => matchPath({ path: route.pattern, end: true }, pathname))
  if (!match) return null

  const items = [['Home', '/'], ...match.trail]

  return (
    <nav className="border-b border-white/5 bg-slate-900/95 px-5 py-3 sm:px-8" aria-label="Breadcrumb">
      <ol className="mx-auto flex max-w-7xl flex-wrap items-center gap-1.5 text-sm text-slate-400">
        {items.map(([label, to], index) => {
          const current = index === items.length - 1
          return (
            <li key={`${label}-${index}`} className="flex items-center gap-1.5">
              {index > 0 && <ChevronRight className="h-3.5 w-3.5 text-slate-600" aria-hidden="true" />}
              {current ? (
                <span className="text-slate-200" aria-current="page">{label}</span>
              ) : (
                <Link
                  to={to}
                  className="rounded transition hover:text-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                >
                  {label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
