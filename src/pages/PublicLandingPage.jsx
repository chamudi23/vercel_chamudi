/**
 * PublicLandingPage.jsx
 * =====================
 * What an unauthenticated visitor sees at `/`.
 *
 * This is the only substantive page outside the authentication wall. It
 * describes the project and its research without exposing any record, any
 * count, or any module. Everything operational lives behind /login.
 *
 * Signed-in users are redirected to /app by the router, so this page never
 * competes with the module launcher.
 */

import { Link } from 'react-router-dom';

const MODULES = [
  {
    icon: '🗃️',
    title: 'Centralized Specimen Records',
    body: 'A single catalogue for skeletal specimens — provenance, measurements, excavation context and laboratory dating.',
  },
  {
    icon: '🧬',
    title: 'Automated Skeletal Analysis',
    body: 'Assisted estimation of the biological profile — sex, age and stature — from skeletal measurements, using established osteological standards.',
  },
  {
    icon: '🗺️',
    title: 'GIS Spatial Analysis',
    body: 'Geographic and temporal mapping of excavation sites across Sri Lanka, with clustering to reveal burial-site patterns.',
  },
  {
    icon: '🖼️',
    title: 'Image Documentation',
    body: 'Specimen photography, annotation and retrieval, linked to an interactive skeleton viewer.',
  },
];

export default function PublicLandingPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <span className="block text-xl font-bold tracking-wide text-blue-400">OAHRIS</span>
            <span className="hidden text-xs text-slate-400 sm:block">
              Osteoarchaeological Research Information System
            </span>
          </div>
          <Link
            to="/login"
            className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-500"
          >
            Sign in
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 py-20 text-center">
        <p className="text-xs uppercase tracking-[0.25em] text-emerald-400/80">
          Research Information System
        </p>
        <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-bold leading-tight text-white sm:text-5xl">
          A centralized digital platform for Sri Lankan osteoarchaeology
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-400">
          OAHRIS brings excavation data, skeletal records, spatial mapping and machine-assisted
          analysis together in one system — addressing the long-standing absence of a centralized
          digital record for osteoarchaeological research in Sri Lanka.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/login"
            className="rounded-lg bg-emerald-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-emerald-500"
          >
            Sign in to the research systems
          </Link>
          <a
            href="#about"
            className="rounded-lg border border-white/15 px-6 py-3 text-sm text-slate-200 transition hover:bg-white/5"
          >
            About the project
          </a>
        </div>
        <p className="mt-6 text-xs text-slate-500">
          Access is granted by an administrator. There is no public sign-up.
        </p>
      </section>

      {/* What the system contains */}
      <section className="border-t border-white/10 bg-slate-950/40">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-center text-2xl font-bold text-white">What the system contains</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-slate-400">
            Four integrated modules. Records themselves are available only to authorised
            researchers and students.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {MODULES.map((m) => (
              <div
                key={m.title}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-emerald-400/30"
              >
                <div className="text-3xl">{m.icon}</div>
                <h3 className="mt-4 text-lg font-semibold text-white">{m.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{m.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About / research context */}
      <section id="about" className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-12 md:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold text-white">About the research</h2>
              <p className="mt-4 text-sm leading-relaxed text-slate-400">
                Sri Lanka holds an osteoarchaeological record spanning roughly 50,000 years, from
                Upper Palaeolithic cave sites through to the Early Historic period. That record has
                been documented largely on paper and in dispersed institutional collections, which
                makes systematic comparison across sites and periods difficult.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-slate-400">
                OAHRIS provides a shared digital record, spatial and temporal analysis tools, and
                assisted interpretation, so that specimens excavated decades apart can be compared
                consistently.
              </p>
              <p className="mt-4 text-xs leading-relaxed text-slate-500">
                Analytical outputs are supportive estimates produced from established osteological
                standards. They are intended to assist, not replace, assessment by a qualified
                osteoarchaeologist.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white">Project</h2>
              <dl className="mt-4 space-y-3 text-sm">
                {[
                  ['Project ID', 'R26-ISE-006'],
                  ['Degree', 'B.Sc. (Hons) Information Technology — Information System Engineering'],
                  ['Institution', 'Sri Lanka Institute of Information Technology (SLIIT)'],
                  ['In collaboration with', 'Postgraduate Institute of Archaeology (PGIAR)'],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    className="flex flex-col gap-1 border-b border-white/5 pb-3 sm:flex-row sm:justify-between sm:gap-6"
                  >
                    <dt className="text-slate-500">{k}</dt>
                    <dd className="text-right text-slate-200">{v}</dd>
                  </div>
                ))}
              </dl>

              <h3 className="mt-8 text-sm font-semibold uppercase tracking-wider text-slate-400">
                Access
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">
                Accounts are created by a system administrator for researchers and students working
                with the collection. If you need access, contact the project supervisor or an
                administrator.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-slate-950/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-xs text-slate-500 sm:flex-row">
          <span>OAHRIS · Osteoarchaeological Research Information System</span>
          <span>Developed for academic research at SLIIT</span>
        </div>
      </footer>
    </div>
  );
}
