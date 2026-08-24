/* eslint-disable react/prop-types */
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowUpRight, BookOpenCheck, Database, ImageIcon, Ruler, ScanLine, Send, ShieldCheck, UserRound } from 'lucide-react'
import { assistantClient } from '../lib/assistantClient'
import { parseAssistantIntent } from '../lib/assistantIntent'
import SkullyAvatar from '../components/assistant/SkullyAvatar'
import SkullyThinking from '../components/assistant/SkullyThinking'

const EXAMPLES = ['Show images of left femur', 'Find specimen SK001', 'How do I add a specimen?', 'How do I use the skeleton viewer?']
const RESPONSE_LABELS = { SYSTEM_HELP: 'System guidance', CLARIFICATION: 'Clarification', POLICY_REJECTION: 'Read-only policy', NOT_FOUND: 'No matching record', ERROR: 'Unable to complete request' }

function ImageCard({ image, onOpen }) {
  const details = [image.skeletonCode || image.specimenId, image.side, image.imageView, image.condition].filter(Boolean)
  return <button onClick={onOpen} className="group grid w-full grid-cols-[76px_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-white/8 bg-slate-950/55 p-2.5 text-left transition hover:border-teal-200/25 hover:bg-slate-900"><div className="flex h-16 w-[76px] items-center justify-center overflow-hidden rounded-xl border border-white/5 bg-slate-900">{image.imageUrl ? <img src={image.imageUrl} alt={image.boneType || 'Skeletal record'} className="h-full w-full object-cover" /> : <ImageIcon className="h-5 w-5 text-slate-500" />}</div><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-100">{image.boneType || 'Unlabelled bone image'}</p><p className="mt-1 truncate text-xs text-slate-400">{details.join(' · ') || 'OAHRIS image record'}</p>{image.notes && <p className="mt-1 line-clamp-1 text-xs text-slate-500">{image.notes}</p>}</div><ArrowUpRight className="h-4 w-4 text-slate-500 transition group-hover:text-teal-200" /></button>
}

function SpecimenCard({ specimen, onOpen }) {
  return <button onClick={onOpen} className="group w-full rounded-2xl border border-white/8 bg-slate-950/55 px-4 py-3 text-left transition hover:border-teal-200/25 hover:bg-slate-900"><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-sm font-semibold text-teal-100">{specimen.specimenId}</p><p className="mt-1 text-sm text-slate-200">{[specimen.boneType, specimen.side].filter(Boolean).join(' · ') || 'OAHRIS specimen record'}</p></div><ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-slate-500 transition group-hover:text-teal-200" /></div><p className="mt-2 text-xs text-slate-500">{[specimen.skeletonCode, specimen.site, specimen.district].filter(Boolean).join(' · ') || 'Recorded OAHRIS metadata'}</p></button>
}

function MeasurementList({ measurements }) {
  return <div className="overflow-hidden rounded-2xl border border-white/8 bg-slate-950/55"><div className="grid grid-cols-[1.2fr_1fr_auto] gap-3 border-b border-white/8 bg-white/[0.025] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500"><span>Bone</span><span>Measurement</span><span className="text-right">Value</span></div>{measurements.map((row) => <div key={row.measurementId} className="grid grid-cols-[1.2fr_1fr_auto] gap-3 px-4 py-3 text-sm text-slate-300"><span className="truncate">{row.boneType || 'Not recorded'}</span><span className="truncate text-slate-400">{row.measurementType || 'Not recorded'}</span><span className="text-right font-medium text-slate-100">{[row.value, row.unit].filter((value) => value !== null && value !== undefined && value !== '').join(' ') || 'Not recorded'}</span></div>)}</div>
}

function HelpCard({ topic, onNavigate }) {
  return <section className="mt-4 rounded-2xl border border-teal-200/15 bg-teal-300/[0.045] p-4"><div className="flex items-start gap-3"><span className="mt-0.5 rounded-xl bg-teal-300/10 p-2 text-teal-100"><BookOpenCheck className="h-4 w-4" /></span><div><h3 className="font-semibold text-teal-50">{topic.title}</h3><p className="mt-1 text-sm leading-6 text-slate-300">{topic.summary}</p></div></div><ol className="mt-4 space-y-2 border-l border-teal-200/15 pl-4 text-sm leading-6 text-slate-300">{topic.steps.map((step, index) => <li key={step} className="pl-1"><span className="mr-2 font-mono text-xs text-teal-200">{String(index + 1).padStart(2, '0')}</span>{step}</li>)}</ol>{topic.importantNotes?.length > 0 && <p className="mt-4 rounded-xl bg-slate-950/40 px-3 py-2 text-xs leading-5 text-teal-100/80">{topic.importantNotes.join(' ')}</p>}{topic.limitations?.length > 0 && <p className="mt-3 text-xs leading-5 text-amber-100/80">Limitations: {topic.limitations.join(' ')}</p>}{topic.routes?.map((route) => <button key={route.path} onClick={() => onNavigate(route.path)} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-teal-200/25 bg-teal-300/10 px-3 py-2 text-xs font-semibold text-teal-50 transition hover:bg-teal-300/20">{route.label}<ArrowUpRight className="h-3.5 w-3.5" /></button>)}</section>
}

function CoverageCard({ coverage }) {
  return <section className="mt-4 rounded-2xl border border-white/8 bg-slate-950/55 p-4"><div className="grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-white/6 bg-white/[0.025] p-3"><p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">Recorded categories</p><p className="mt-2 text-2xl font-semibold text-teal-100">{coverage.categoryCoveragePercentage ?? '—'}%</p></div><div className="rounded-xl border border-white/6 bg-white/[0.025] p-3"><p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">Image documentation</p><p className="mt-2 text-2xl font-semibold text-teal-100">{coverage.imageDocumentationPercentage ?? '—'}%</p></div></div><p className="mt-3 text-xs leading-5 text-slate-400">Coverage describes OAHRIS documentation, not anatomical completeness.</p></section>
}

function ResultPresentation({ data, navigate }) {
  if (!data) return null
  return <>{data.helpTopic && <HelpCard topic={data.helpTopic} onNavigate={navigate} />}{data.images && <div className="mt-4 space-y-2">{data.images.length ? data.images.map((row) => <ImageCard key={row.imageId} image={row} onOpen={() => navigate(`/image/${row.imageId}`)} />) : <p className="text-sm text-slate-400">No matching image records found.</p>}</div>}{data.specimens && <div className="mt-4 space-y-2">{data.specimens.length ? data.specimens.map((row) => <SpecimenCard key={row.specimenId} specimen={row} onOpen={() => navigate(`/specimens/${row.specimenId}`)} />) : <p className="text-sm text-slate-400">No matching specimen records found.</p>}</div>}{data.measurements && <div className="mt-4">{data.measurements.length ? <MeasurementList measurements={data.measurements} /> : <p className="text-sm text-slate-400">No measurements are recorded for this specimen.</p>}</div>}{data.coverage && <CoverageCard coverage={data.coverage} />}</>
}

function AssistantMessage({ message, navigate }) {
  const isUser = message.role === 'user'
  const legacyPresentation = message.type === 'SYSTEM_HELP' ? { helpTopic: message.topic } : message.type === 'IMAGE_RESULTS' ? { images: message.records } : message.type === 'SPECIMEN_RESULTS' ? { specimens: message.records } : message.type === 'MEASUREMENT_RESULTS' ? { measurements: message.records } : message.type === 'COVERAGE_RESULT' ? { coverage: message.data } : null
  if (isUser) return <div className="flex justify-end"><div className="max-w-[84%] rounded-2xl rounded-br-md border border-slate-300/20 bg-slate-100 px-4 py-3 text-sm leading-6 text-slate-900 shadow-sm"><p>{message.text}</p></div><UserRound className="ml-3 mt-2 h-5 w-5 shrink-0 text-slate-400" /></div>
  return <div className="flex items-start gap-3"><SkullyAvatar /><div className="min-w-0 max-w-3xl rounded-2xl rounded-tl-md border border-white/8 bg-slate-900/80 px-4 py-3.5 shadow-[0_12px_30px_rgba(2,6,23,0.2)]"><div className="mb-2 flex flex-wrap items-center gap-2"><p className="text-sm font-semibold text-slate-100">Skully</p>{RESPONSE_LABELS[message.type] && <span className="rounded-full border border-teal-200/15 bg-teal-300/[0.07] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-teal-100/85">{RESPONSE_LABELS[message.type]}</span>}</div><p className="text-sm leading-6 text-slate-300">{message.text}</p><ResultPresentation data={message.presentation || legacyPresentation} navigate={navigate} /></div></div>
}

function WelcomePanel() {
  const capabilities = [[Database, 'Find OAHRIS records'], [ImageIcon, 'Find skeletal images'], [Ruler, 'Retrieve measurements'], [ScanLine, 'Check documentation coverage'], [BookOpenCheck, 'Explain OAHRIS workflows']]
  return <section className="mx-12 mt-2 rounded-2xl border border-white/8 bg-slate-950/35 p-4 sm:mx-14"><p className="text-sm font-medium text-slate-200">Skully can help you:</p><div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{capabilities.map(([Icon, label]) => <div key={label} className="flex items-center gap-2 text-xs text-slate-400"><Icon className="h-3.5 w-3.5 text-teal-200" />{label}</div>)}</div></section>
}

function deterministicMessage(data) {
  if (data.type === 'HELP_NOT_FOUND') return { role: 'assistant', type: data.type, text: "I don't have verified OAHRIS guidance for that workflow yet." }
  const count = data.records?.length || 0
  const text = data.type === 'SYSTEM_HELP' ? data.topic.summary : data.type === 'IMAGE_RESULTS' ? `${count} matching image record${count === 1 ? '' : 's'} found.` : data.type === 'SPECIMEN_RESULTS' ? `${count} matching specimen record${count === 1 ? '' : 's'} found.` : data.type === 'MEASUREMENT_RESULTS' ? `${count} measurement record${count === 1 ? '' : 's'} found.` : `Coverage retrieved for ${data.skeletonCode}.`
  return { role: 'assistant', type: data.type, text, topic: data.topic, records: data.records || [], data }
}

export default function AIAssistantPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState([{ role: 'assistant', text: 'I can retrieve OAHRIS records or explain how to use the current system.' }])

  const runQuery = async (override) => {
    const content = (override || prompt).trim()
    if (!content || loading) return
    const intent = parseAssistantIntent(content)
    const previousUserMessage = [...messages].reverse().find((message) => message.role === 'user')?.text
    const previousAssistantMessage = [...messages].reverse().find((message) => message.role === 'assistant')?.text
    const context = previousUserMessage ? { previousUserMessage: previousUserMessage.slice(0, 500), ...(previousAssistantMessage ? { previousAssistantMessage: previousAssistantMessage.slice(0, 700) } : {}) } : undefined
    setPrompt('')
    setMessages((current) => [...current, { role: 'user', text: content }])
    setLoading(true)
    try {
      let data
      if (intent.type === 'UNSUPPORTED_QUERY') data = await assistantClient.respond(content, location.pathname, context)
      else if (intent.type === 'SYSTEM_HELP') data = await assistantClient.getSystemHelp(intent.query, location.pathname)
      else if (intent.type === 'IMAGE_RESULTS') data = await assistantClient.searchImages(intent.filters)
      else if (intent.type === 'SPECIMEN_RESULTS') data = await assistantClient.searchSpecimens(intent.filters)
      else if (intent.type === 'MEASUREMENT_RESULTS') data = await assistantClient.getMeasurements(intent.specimenId)
      else data = await assistantClient.getSkeletonCoverage(intent.skeletonCode)
      const nextMessage = intent.type === 'UNSUPPORTED_QUERY' ? { role: 'assistant', type: data.type, text: data.answer, presentation: data.presentation, sources: data.sources, meta: data.meta } : deterministicMessage(data)
      setMessages((current) => [...current, nextMessage])
    } catch (_) {
      setMessages((current) => [...current, { role: 'assistant', type: 'ERROR', text: 'OAHRIS Assistant could not complete the request. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  return <main className="min-h-[calc(100vh-73px)] bg-slate-950 px-4 py-6 text-white sm:px-6 lg:px-8"><div className="mx-auto flex min-h-[calc(100vh-121px)] max-w-5xl flex-col"><section className="rounded-3xl border border-white/8 bg-slate-900/65 px-5 py-5 shadow-[0_20px_60px_rgba(2,6,23,0.24)] sm:px-6"><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-4"><SkullyAvatar size="medium" /><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-200/80">Research Assistant</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">Skully by OAHRIS</h1><p className="mt-1 max-w-xl text-sm leading-6 text-slate-400">Osteoarchaeological research assistant for OAHRIS records, workflows, and system guidance.</p><div className="mt-3 flex flex-wrap gap-2"><span className="rounded-full border border-teal-200/20 bg-teal-300/10 px-2.5 py-1 text-xs font-medium text-teal-100">OAHRIS Model 1.1</span><span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-slate-300">Fast</span></div></div></div><div className="flex items-center gap-2 self-start rounded-xl border border-emerald-200/15 bg-emerald-300/[0.055] px-3 py-2 text-xs text-emerald-100 sm:self-auto" title="Skully can retrieve information and provide guidance but cannot modify OAHRIS records."><ShieldCheck className="h-4 w-4" /><span>Read-only assistant</span></div></div></section><section className="mt-5 flex min-h-[420px] flex-1 flex-col rounded-3xl border border-white/8 bg-slate-900/45 p-4 shadow-[0_20px_60px_rgba(2,6,23,0.18)] sm:p-6"><div className="flex-1 space-y-5">{messages.map((message, index) => <AssistantMessage key={index} message={message} navigate={navigate} />)}{messages.length === 1 && <WelcomePanel />}{loading && <SkullyThinking />}</div></section><section className="mt-4 rounded-3xl border border-white/8 bg-slate-900/75 p-3 shadow-[0_14px_40px_rgba(2,6,23,0.2)]"><div className="mb-3 flex flex-wrap gap-2">{EXAMPLES.map((example) => <button key={example} disabled={loading} onClick={() => runQuery(example)} className="rounded-full border border-white/10 bg-white/[0.025] px-3 py-1.5 text-xs text-slate-300 transition hover:border-teal-200/25 hover:bg-teal-300/[0.08] hover:text-teal-50 disabled:cursor-not-allowed disabled:opacity-50">{example}</button>)}</div><div className="flex items-end gap-3 rounded-2xl border border-white/10 bg-slate-950/70 p-2.5 transition focus-within:border-teal-200/30 focus-within:ring-2 focus-within:ring-teal-300/10"><textarea value={prompt} maxLength={1000} disabled={loading} onChange={(event) => setPrompt(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); runQuery() } }} placeholder="Ask Skully about OAHRIS records, workflows, or system guidance..." className="min-h-[48px] max-h-32 flex-1 resize-y bg-transparent px-2 py-2 text-sm leading-6 text-slate-100 outline-none placeholder:text-slate-500 disabled:cursor-not-allowed" /><button disabled={loading || !prompt.trim()} onClick={() => runQuery()} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-200 text-slate-950 transition hover:bg-teal-100 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400" aria-label="Send message">{loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-500 border-t-transparent motion-reduce:animate-none" /> : <Send className="h-4 w-4" />}</button></div><div className="mt-2 flex items-center justify-between gap-3 px-2 text-xs text-slate-500"><span>Enter to send · Shift+Enter for a new line</span><span>{prompt.length}/1000</span></div></section></div></main>
}
