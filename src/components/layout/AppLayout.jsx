/* eslint-disable react/prop-types */
import Breadcrumbs from './Breadcrumbs'
import SiteFooter from './SiteFooter'
import SiteHeader from './SiteHeader'

export default function AppLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-900 text-slate-100">
      <SiteHeader />
      <Breadcrumbs />
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </div>
  )
}
