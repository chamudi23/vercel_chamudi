/* eslint-disable react/prop-types */
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowUp, Bot, ImageIcon, Sparkles, UserRound } from 'lucide-react'
import { supabase } from '../supabase'
import { CONDITION_OPTIONS, PP1_BONE_LABELS, imageNotes, normalize } from '../utils/pp1ImageModule'

const EXAMPLES = [
  'Show all skull images',
  'Show skull images from SK1',
  'How many fragmented images are stored?',
  'Compare SK1 and SK2 femur records',
]

function parsePrompt(prompt) {
  const text = normalize(prompt)
  const bone = PP1_BONE_LABELS.find((item) => text.includes(item.toLowerCase()))
  const condition = CONDITION_OPTIONS.find((item) => text.includes(item.toLowerCase()))
  const skeletonCodes = Array.from(prompt.matchAll(/\bSK[-\s]?\d+\b/gi)).map((match) =>
    match[0].replace(/[-\s]+/g, '').toUpperCase(),
  )

  return {
    bone,
    condition,
    skeletonCodes,
    compare: text.includes('compare') && skeletonCodes.length >= 2,
    wantsCount: text.includes('how many') || text.includes('count'),
  }
}

function ResultCard({ image, onOpen }) {
  const imageSrc = image.image_url || image.file_url

  return (
    <button
      onClick={onOpen}
      className="grid w-full grid-cols-[88px_1fr] gap-3 rounded-2xl border border-white/10 bg-slate-900/90 p-2 text-left transition hover:border-emerald-400/40 hover:bg-slate-900"
    >
      <div className="flex h-24 items-center justify-center overflow-hidden rounded-xl bg-black/30">
        {imageSrc ? (
          <img src={imageSrc} alt={image.bone_name || 'Skeletal record'} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <ImageIcon className="h-5 w-5 text-white/30" />
        )}
      </div>
      <div className="min-w-0 py-1">
        <p className="font-semibold text-white">{image.bone_name || 'Unlabelled bone'}</p>
        <p className="mt-1 text-xs text-white/40">{image.skeleton_code || 'No skeleton code'}</p>
        <p className="mt-1 text-xs text-white/45">
          {[image.side, image.condition, image.image_view || image.view_angle, image.image_type].filter(Boolean).join(' - ')}
        </p>
        <p className="mt-2 line-clamp-2 text-xs leading-5 text-white/45">{imageNotes(image) || image.annotation_text || 'No notes recorded.'}</p>
      </div>
    </button>
  )
}

function ChatBubble({ message, onOpenImage }) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-emerald-300/20 bg-emerald-400/10 text-emerald-100">
          <Bot className="h-4 w-4" />
        </div>
      )}

      <div className={`max-w-3xl rounded-3xl px-5 py-4 ${
        isUser
          ? 'bg-white text-slate-950'
          : 'border border-white/10 bg-white/[0.04] text-white'
      }`}>
        <p className="text-sm leading-6">{message.text}</p>

        {message.comparison && (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {message.comparison.map((item) => (
              <div key={item.code} className="rounded-2xl border border-white/10 bg-slate-950/60 p-3">
                <h3 className="font-semibold text-emerald-100">{item.code}</h3>
                <p className="mt-1 text-xs text-white/40">{item.records.length} matching image records</p>
                <div className="mt-3 space-y-2">
                  {item.records.length === 0 ? (
                    <p className="text-sm text-white/35">No matching records found.</p>
                  ) : (
                    item.records.map((record) => (
                      <ResultCard key={record.image_id} image={record} onOpen={() => onOpenImage(record.image_id)} />
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {message.results && (
          <div className="mt-4 space-y-2">
            {message.results.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-4 text-sm text-white/35">
                No matching records found.
              </p>
            ) : (
              message.results.map((image) => (
                <ResultCard key={image.image_id} image={image} onOpen={() => onOpenImage(image.image_id)} />
              ))
            )}
          </div>
        )}
      </div>

      {isUser && (
        <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-slate-950">
          <UserRound className="h-4 w-4" />
        </div>
      )}
    </div>
  )
}

export default function AIAssistantPage() {
  const navigate = useNavigate()
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Ask me to find PP1 image records by skeleton code, bone name, or condition. I search bone_images directly.',
    },
  ])

  const parsedPreview = useMemo(() => parsePrompt(prompt), [prompt])

  const buildImageQuery = (parsed) => {
    let query = supabase.from('bone_images').select('*')

    if (parsed.bone) query = query.ilike('bone_name', `%${parsed.bone}%`)
    if (parsed.condition) query = query.ilike('condition', `%${parsed.condition}%`)
    if (parsed.skeletonCodes.length > 0) {
      query = query.or(parsed.skeletonCodes.map((code) => `skeleton_code.ilike.${code}`).join(','))
    }

    return query.order('uploaded_at', { ascending: false })
  }

  const makeSummary = (rows, parsed) => {
    if (parsed.wantsCount) {
      return `${rows.length} matching image record${rows.length === 1 ? '' : 's'} found.`
    }

    const filters = [
      parsed.bone && `bone: ${parsed.bone}`,
      parsed.skeletonCodes.length > 0 && `skeleton code: ${parsed.skeletonCodes.join(', ')}`,
      parsed.condition && `condition: ${parsed.condition}`,
    ].filter(Boolean).join(' | ')

    return `${rows.length} matching image record${rows.length === 1 ? '' : 's'} found${filters ? ` (${filters})` : ''}.`
  }

  const runQuery = async (overridePrompt) => {
    const content = (overridePrompt || prompt).trim()
    if (!content) return

    const parsed = parsePrompt(content)
    setPrompt('')
    setLoading(true)
    setError('')
    setMessages((current) => [...current, { role: 'user', text: content }])

    try {
      if (parsed.compare) {
        const comparison = []

        for (const code of parsed.skeletonCodes.slice(0, 2)) {
          let query = supabase.from('bone_images').select('*').ilike('skeleton_code', code)
          if (parsed.bone) query = query.ilike('bone_name', `%${parsed.bone}%`)
          if (parsed.condition) query = query.ilike('condition', `%${parsed.condition}%`)

          const { data, error: queryError } = await query.order('uploaded_at', { ascending: false })
          if (queryError) throw queryError

          comparison.push({ code, records: data || [] })
        }

        setMessages((current) => [
          ...current,
          {
            role: 'assistant',
            text: `Compared ${parsed.skeletonCodes[0]} and ${parsed.skeletonCodes[1]}${parsed.bone ? ` for ${parsed.bone}` : ''}.`,
            comparison,
          },
        ])
        setLoading(false)
        return
      }

      const { data, error: queryError } = await buildImageQuery(parsed)
      if (queryError) throw queryError

      const rows = data || []
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          text: makeSummary(rows, parsed),
          results: rows,
        },
      ])
    } catch (queryError) {
      const text = queryError.message || 'Retrieval query failed.'
      setError(text)
      setMessages((current) => [...current, { role: 'assistant', text }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-73px)] max-w-6xl flex-col px-5 py-8 sm:px-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300/70">PP1 Retrieval Assistant</p>
            <h1 className="mt-2 text-3xl font-bold">AI Assistant</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
              Chat-style image retrieval over `bone_images` using skeleton code, bone name, and condition.
            </p>
          </div>
          <div className="hidden rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/55 md:flex md:items-center md:gap-2">
            <Sparkles className="h-4 w-4 text-emerald-200" />
            Direct bone_images search
          </div>
        </div>

        <section className="flex-1 space-y-5 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
          <div className="space-y-5">
            {messages.map((message, index) => (
              <ChatBubble key={`${message.role}-${index}`} message={message} onOpenImage={(imageId) => navigate(`/image/${imageId}`)} />
            ))}

            {loading && (
              <div className="flex gap-3">
                <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-emerald-300/20 bg-emerald-400/10 text-emerald-100">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/[0.04] px-5 py-4 text-sm text-white/60">
                  Searching bone_images...
                </div>
              </div>
            )}
          </div>
        </section>

        {error && <div className="mt-4 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}

        <div className="mt-4 rounded-3xl border border-white/10 bg-slate-900/95 p-3 shadow-2xl shadow-black/30">
          <div className="mb-3 flex flex-wrap gap-2">
            {EXAMPLES.map((example) => (
              <button
                key={example}
                onClick={() => runQuery(example)}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/55 transition hover:border-emerald-400/30 hover:text-white"
              >
                {example}
              </button>
            ))}
          </div>

          <div className="flex items-end gap-3">
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  runQuery()
                }
              }}
              rows={1}
              placeholder="Message OAHRIS..."
              className="max-h-40 min-h-[48px] flex-1 resize-none rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-emerald-400"
            />
            <button
              onClick={() => runQuery()}
              disabled={loading || !prompt.trim()}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-950 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/30"
              aria-label="Send message"
            >
              <ArrowUp className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-3 text-xs text-white/35">
            Parsed: bone {parsedPreview.bone || '-'} | skeleton {parsedPreview.skeletonCodes.join(', ') || '-'} | condition {parsedPreview.condition || '-'}
          </div>
        </div>
      </div>
    </main>
  )
}
