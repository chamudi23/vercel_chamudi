/* eslint-disable react/prop-types */
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowUpRight, BookOpenCheck, Database, ImageIcon, Ruler, ScanLine, Send, ShieldCheck, UserRound } from 'lucide-react'
import { assistantClient } from '../lib/assistantClient'
import { parseAssistantIntent } from '../lib/assistantIntent'
import { deterministicAssistantMessage, selectAssistantPresentation } from '../lib/assistantPresentation'
import { executeAssistantIntent } from '../lib/assistantRequestRouter'
import SkullyAvatar from '../components/assistant/SkullyAvatar'
import SkullyThinking from '../components/assistant/SkullyThinking'

const EXAMPLES = ['Show images of left femur', 'Find specimen SK001', 'How do I add a specimen?', 'How do I use the skeleton viewer?']
const RESPONSE_LABELS = { SYSTEM_HELP: 'System guidance', SITE_RESULTS: 'Site records', SITE_RESULT: 'Site record', SPECIMEN_CONTEXT: 'Stored context', IMAGE_RESULT: 'Image detail', SKELETAL_ANALYSIS_RESULT: 'Stored analysis', DATA_QUALITY_RESULT: 'Data quality', CLARIFICATION: 'Clarification', POLICY_REJECTION: 'Read-only policy', ACCESS_DENIED: 'Access restricted', NOT_FOUND: 'No matching record', ERROR: 'Unable to complete request' }

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

function DetailGrid({ rows }) {
  return <div className="mt-3 grid gap-2 sm:grid-cols-2">{rows.filter(([, value]) => value !== undefined).map(([label, value]) => <div key={label} className="rounded-xl border border-white/6 bg-slate-950/45 px-3 py-2"><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p><p className="mt-1 text-sm text-slate-200">{value === null || value === '' ? 'Not recorded' : String(value)}</p></div>)}</div>
}

function SiteResultCard({ result, navigate }) {
  if (!result) return null
  if (result.status === 'ambiguous') return <section className="mt-4 rounded-2xl border border-amber-200/15 bg-amber-300/[0.04] p-4 text-sm text-amber-100/80">Multiple sites share that name. Use an exact site ID; Skully did not guess.</section>
  if (result.status === 'reference_only') return <section className="mt-4 rounded-2xl border border-amber-200/15 bg-amber-300/[0.04] p-4"><p className="font-semibold text-amber-50">{result.requestedSiteName || 'Referenced site name'}</p><p className="mt-1 text-sm leading-6 text-amber-100/75">This name appears in specimen records, but it does not resolve to a unique stored site record.</p><DetailGrid rows={[["Linked specimen references", result.linkedSpecimens?.length], ["Site linkage", result.siteLinkageStatus]]} /></section>
  const site = result.site || result
  return <section className="mt-4 rounded-2xl border border-white/8 bg-slate-950/55 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-slate-100">{site.siteName || 'Archaeological site'}</p><p className="mt-1 text-xs text-slate-400">{[site.district, site.province, site.timePeriod].filter(Boolean).join(' · ') || 'Stored OAHRIS site record'}</p></div>{site.siteId && <button onClick={() => navigate(`/parami/site/${encodeURIComponent(site.siteId)}`)} className="text-xs font-semibold text-teal-200">Open site</button>}</div><DetailGrid rows={[["Site type", site.siteType], ["Risk level", site.riskLevel], ["Protected status", site.protectedStatus], ["Linked specimens", result.linkedSpecimens?.length], ["Specimen linkage", result.siteLinkageStatus]]} /></section>
}

function ContextCard({ context }) {
  const site = context.siteResolution || {}
  return <section className="mt-4 rounded-2xl border border-white/8 bg-slate-950/55 p-4"><p className="font-semibold text-slate-100">Specimen context · {context.specimen?.specimenId}</p><DetailGrid rows={[["Site resolution", site.status], ["Site", site.site?.siteName || context.specimen?.siteName], ["Excavation date", context.excavation?.excavationDate], ["Excavation phase", context.excavation?.excavationPhase], ["Dating method", context.laboratoryDating?.method], ["Dating result", context.laboratoryDating?.result], ["BP range", context.laboratoryDating ? [context.laboratoryDating.rangeMinBp, context.laboratoryDating.rangeMaxBp].filter((value) => value !== null).join('–') : null], ["Laboratory", context.laboratoryDating?.laboratory]]} /></section>
}

function ImageDetailCard({ image, navigate }) {
  if (!image) return null
  return <section className="mt-4 rounded-2xl border border-white/8 bg-slate-950/55 p-4"><div className="flex gap-4">{image.imageUrl && <img src={image.imageUrl} alt={image.boneType || 'OAHRIS image'} className="h-24 w-24 rounded-xl object-cover" />}<div className="min-w-0"><p className="font-mono text-sm font-semibold text-teal-100">{image.imageId}</p><p className="mt-1 text-sm text-slate-300">{[image.boneType, image.side, image.imageView].filter(Boolean).join(' · ')}</p><button onClick={() => navigate(`/image/${encodeURIComponent(image.imageId)}`)} className="mt-3 text-xs font-semibold text-teal-200">Open image detail</button></div></div><DetailGrid rows={[["Condition", image.condition], ["Image type", image.imageType], ["Tags", image.tags?.join(', ')], ["Stored annotations", image.annotations?.length], ["Notes", image.notes]]} /></section>
}

function AnalysisResultCard({ analysis, navigate }) {
  if (!analysis) return null
  const predictions = analysis.storedPredictions || {}
  return <section className="mt-4 rounded-2xl border border-orange-200/15 bg-orange-300/[0.04] p-4"><p className="font-semibold text-orange-50">Stored skeletal analysis · {analysis.caseId}</p><p className="mt-1 text-xs text-orange-100/60">{analysis.resultLabel}</p><DetailGrid rows={[["Bone/type", analysis.recordedInputs?.bonesType || analysis.basicInfo?.bonesType], ["Date", analysis.basicInfo?.analysisDate || analysis.createdAt], ["Recorded sex/gender", predictions.gender || predictions.sex], ["Recorded age range", predictions.ageRange], ["Recorded height/stature", predictions.height || predictions.stature], ["Stored confidence", predictions.confidence]]} /> <button onClick={() => navigate(`/skeletal/report/${encodeURIComponent(analysis.caseId)}`)} className="mt-3 text-xs font-semibold text-orange-200">Open stored report</button></section>
}

function DataQualityCard({ result }) {
  if (!result) return null
  const check = result.currentCompleteness || {}
  return <section className="mt-4 rounded-2xl border border-emerald-200/15 bg-emerald-300/[0.04] p-4"><p className="font-semibold text-emerald-50">Data quality · {result.specimenId}</p><DetailGrid rows={[["Completeness", `${check.percentage ?? 0}%`], ["Status", check.status], ["Measurements present", check.hasMeasurements ? 'Yes' : 'No'], ["Missing tracked fields", check.missingTrackedFields?.join(', ') || 'None'], ["Stored measurement-analysis logs", result.storedMeasurementAnalysisLogs?.length || 0]]} /><p className="mt-3 text-xs text-slate-400">This is a deterministic completeness check plus stored logs. Skully did not run an anomaly or classification model.</p></section>
}

function ResultPresentation({ data, navigate }) {
  if (!data) return null
  return <>{data.helpTopic && <HelpCard topic={data.helpTopic} onNavigate={navigate} />}{data.images?.length > 0 && <div className="mt-4 space-y-2">{data.images.map((row) => <ImageCard key={row.imageId} image={row} onOpen={() => navigate(`/image/${row.imageId}`)} />)}</div>}{data.specimens?.length > 0 && <div className="mt-4 space-y-2">{data.specimens.map((row) => <SpecimenCard key={row.specimenId} specimen={row} onOpen={() => navigate(`/specimens/${row.specimenId}`)} />)}</div>}{data.sites?.length > 0 && <div className="space-y-2">{data.sites.map((site) => <SiteResultCard key={site.siteId} result={site} navigate={navigate} />)}</div>}{data.site && <SiteResultCard result={data.site} navigate={navigate} />}{data.specimenContext && <ContextCard context={data.specimenContext} />}{data.imageDetail && <ImageDetailCard image={data.imageDetail} navigate={navigate} />}{data.skeletalAnalysis && <AnalysisResultCard analysis={data.skeletalAnalysis} navigate={navigate} />}{data.dataQuality && <DataQualityCard result={data.dataQuality} />}{data.measurements?.length > 0 && <div className="mt-4"><MeasurementList measurements={data.measurements} /></div>}{data.coverage && <CoverageCard coverage={data.coverage} />}</>
}

function AssistantMessage({ message, navigate }) {
  const isUser = message.role === 'user'
  if (isUser) return <div className="flex justify-end"><div className="max-w-[84%] rounded-2xl rounded-br-md border border-slate-300/20 bg-slate-100 px-4 py-3 text-sm leading-6 text-slate-900 shadow-sm"><p>{message.text}</p></div><UserRound className="ml-3 mt-2 h-5 w-5 shrink-0 text-slate-400" /></div>
  return <div className="flex items-start gap-3"><SkullyAvatar /><div className="min-w-0 max-w-3xl rounded-2xl rounded-tl-md border border-white/8 bg-slate-900/80 px-4 py-3.5 shadow-[0_12px_30px_rgba(2,6,23,0.2)]"><div className="mb-2 flex flex-wrap items-center gap-2"><p className="text-sm font-semibold text-slate-100">Skully</p>{RESPONSE_LABELS[message.type] && <span className="rounded-full border border-teal-200/15 bg-teal-300/[0.07] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-teal-100/85">{RESPONSE_LABELS[message.type]}</span>}</div><p className="text-sm leading-6 text-slate-300">{message.text}</p><ResultPresentation data={selectAssistantPresentation(message)} navigate={navigate} /></div></div>
}

function WelcomePanel() {
  const capabilities = [[Database, 'Find OAHRIS records'], [ImageIcon, 'Find skeletal images'], [Ruler, 'Retrieve measurements'], [ScanLine, 'Check documentation coverage'], [BookOpenCheck, 'Explain OAHRIS workflows']]
  return <section className="mx-12 mt-2 rounded-2xl border border-white/8 bg-slate-950/35 p-4 sm:mx-14"><p className="text-sm font-medium text-slate-200">Skully can help you:</p><div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{capabilities.map(([Icon, label]) => <div key={label} className="flex items-center gap-2 text-xs text-slate-400"><Icon className="h-3.5 w-3.5 text-teal-200" />{label}</div>)}</div></section>
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
      const data = await executeAssistantIntent(intent, { content, currentRoute: location.pathname, context }, assistantClient)
      const nextMessage = intent.type === 'UNSUPPORTED_QUERY' ? { role: 'assistant', type: data.type, text: data.answer, presentation: data.presentation, sources: data.sources, meta: data.meta } : deterministicAssistantMessage(data)
      setMessages((current) => [...current, nextMessage])
    } catch (error) {
      const restricted = error?.code === 'ACCESS_DENIED'
      const sessionExpired = error?.code === 'AUTH_REQUIRED' || error?.code === 'AUTH_SESSION_INVALID'
      const text = restricted || sessionExpired ? error.message : 'OAHRIS Assistant could not complete the request. Please try again.'
      setMessages((current) => [...current, { role: 'assistant', type: restricted ? 'ACCESS_DENIED' : 'ERROR', text }])
    } finally {
      setLoading(false)
    }
  }

  return <main className="min-h-[calc(100vh-73px)] bg-slate-950 px-4 py-6 text-white sm:px-6 lg:px-8"><div className="mx-auto flex min-h-[calc(100vh-121px)] max-w-5xl flex-col"><section className="rounded-3xl border border-white/8 bg-slate-900/65 px-5 py-5 shadow-[0_20px_60px_rgba(2,6,23,0.24)] sm:px-6"><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-4"><SkullyAvatar size="medium" /><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-200/80">Research Assistant</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">Skully by OAHRIS</h1><p className="mt-1 max-w-xl text-sm leading-6 text-slate-400">Osteoarchaeological research assistant for OAHRIS records, workflows, and system guidance.</p><div className="mt-3 flex flex-wrap gap-2"><span className="rounded-full border border-teal-200/20 bg-teal-300/10 px-2.5 py-1 text-xs font-medium text-teal-100">OAHRIS Model 1.1</span><span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-slate-300">Fast</span></div></div></div><div className="flex items-center gap-2 self-start rounded-xl border border-emerald-200/15 bg-emerald-300/[0.055] px-3 py-2 text-xs text-emerald-100 sm:self-auto" title="Skully can retrieve information and provide guidance but cannot modify OAHRIS records."><ShieldCheck className="h-4 w-4" /><span>Read-only assistant</span></div></div></section><section className="mt-5 flex min-h-[420px] flex-1 flex-col rounded-3xl border border-white/8 bg-slate-900/45 p-4 shadow-[0_20px_60px_rgba(2,6,23,0.18)] sm:p-6"><div className="flex-1 space-y-5">{messages.map((message, index) => <AssistantMessage key={index} message={message} navigate={navigate} />)}{messages.length === 1 && <WelcomePanel />}{loading && <SkullyThinking />}</div></section><section className="mt-4 rounded-3xl border border-white/8 bg-slate-900/75 p-3 shadow-[0_14px_40px_rgba(2,6,23,0.2)]"><div className="mb-3 flex flex-wrap gap-2">{EXAMPLES.map((example) => <button key={example} disabled={loading} onClick={() => runQuery(example)} className="rounded-full border border-white/10 bg-white/[0.025] px-3 py-1.5 text-xs text-slate-300 transition hover:border-teal-200/25 hover:bg-teal-300/[0.08] hover:text-teal-50 disabled:cursor-not-allowed disabled:opacity-50">{example}</button>)}</div><div className="flex items-end gap-3 rounded-2xl border border-white/10 bg-slate-950/70 p-2.5 transition focus-within:border-teal-200/30 focus-within:ring-2 focus-within:ring-teal-300/10"><textarea value={prompt} maxLength={1000} disabled={loading} onChange={(event) => setPrompt(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); runQuery() } }} placeholder="Ask Skully about OAHRIS records, workflows, or system guidance..." className="min-h-[48px] max-h-32 flex-1 resize-y bg-transparent px-2 py-2 text-sm leading-6 text-slate-100 outline-none placeholder:text-slate-500 disabled:cursor-not-allowed" /><button disabled={loading || !prompt.trim()} onClick={() => runQuery()} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-200 text-slate-950 transition hover:bg-teal-100 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400" aria-label="Send message">{loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-500 border-t-transparent motion-reduce:animate-none" /> : <Send className="h-4 w-4" />}</button></div><div className="mt-2 flex items-center justify-between gap-3 px-2 text-xs text-slate-500"><span>Enter to send · Shift+Enter for a new line</span><span>{prompt.length}/1000</span></div></section></div></main>
}
