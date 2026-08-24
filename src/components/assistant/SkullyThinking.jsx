import SkullyAvatar from './SkullyAvatar'

export default function SkullyThinking() {
  return <div className="flex items-center gap-3 px-1 py-2" aria-live="polite" aria-label="Skully is thinking"><SkullyAvatar /><div className="rounded-2xl border border-teal-200/10 bg-slate-900/80 px-4 py-3"><div className="flex items-center gap-2"><p className="text-sm font-medium text-slate-100">Skully is thinking</p><span className="flex items-center gap-1 text-teal-200"><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current motion-reduce:animate-none" /><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:150ms] motion-reduce:animate-none" /><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:300ms] motion-reduce:animate-none" /></span></div><p className="mt-1 text-xs text-slate-400">Checking OAHRIS records and guidance…</p></div></div>
}
