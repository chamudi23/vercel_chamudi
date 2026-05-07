import { useState, useRef, useEffect } from 'react'

// ─── Static data ────────────────────────────────────────────────────────────

const QUICK_TOOLS = [
  {
    label: 'Compare Specimens',
    prompt: 'Compare two specimens side by side and highlight key differences',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 text-purple-400">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
    ),
  },
  {
    label: 'Specimen Summary',
    prompt: 'Give me a full summary of specimen SPEC-',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 text-purple-400">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
      </svg>
    ),
  },
  {
    label: 'Bone Statistics',
    prompt: 'Show me overall bone counts and condition breakdowns in the database',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 text-purple-400">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
  {
    label: 'Find Images',
    prompt: 'Find all images of ',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 text-purple-400">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 9.75h18M3 6a.75.75 0 01.75-.75h16.5A.75.75 0 0121 6v12a.75.75 0 01-.75.75H3.75A.75.75 0 013 18V6z" />
      </svg>
    ),
  },
]

const CHAT_HISTORY = [
  { id: 1, title: 'Skull analysis SK1 vs SK2', time: '2h ago' },
  { id: 2, title: 'Femur records from Potana', time: 'Yesterday' },
  { id: 3, title: 'Fragmented bones report', time: 'Yesterday' },
  { id: 4, title: 'Sigiriya excavation summary', time: '3 days ago' },
]

const EXAMPLE_PROMPTS = [
  'Show me all skull images from Potana',
  'Compare SK1 and SK2 femur measurements',
  'How many fragmented bones are in the database?',
  'Find all bones from Mesolithic period',
]

const MODES = [
  { value: 'quick', label: 'Quick Answer' },
  { value: 'detailed', label: 'Detailed Analysis' },
  { value: 'comparison', label: 'Comparison' },
]

const RESPONSES = {
  quick: [
    'Your database contains **47 bone records** across 12 specimen collections. The most documented region is the cranium with 15 entries.',
    'Based on current records, there are **8 femur specimens** logged — 3 from Potana, 2 from Sigiriya, and 3 from other sites.',
    'The Potana site has the **largest specimen collection** with 18 records across 6 excavation seasons.',
    'There are **6 fragmented specimens** currently in good condition, primarily from the Sigiriya site excavated in 2021.',
  ],
  detailed: [
    '**Skeletal Record Analysis**\n\n**Query Summary:**\nSearching across all skeletal records in the OAHRIS database.\n\n**Results Found:** 24 matching records\n\n**Breakdown by Site:**\n• Potana — 12 specimens\n• Sigiriya — 7 specimens\n• Anuradhapura — 5 specimens\n\n**Condition Overview:**\n• Complete: 8 (33%)\n• Partially Complete: 10 (42%)\n• Fragmented: 4 (17%)\n• Heavily Damaged: 2 (8%)\n\n**Recommendation:** Consider uploading additional images for the 6 specimens currently without photo documentation.',
    '**Image Analysis Report**\n\n**Query:** Skeletal images matching criteria\n\n**Images Found:** 15 matching records\n\n**By Site:**\n• Potana: 8 images\n• Sigiriya: 4 images\n• Other sites: 3 images\n\n**Image Types:**\n• Laboratory: 9\n• Excavation: 4\n• Field: 2\n\n**Most Recent Upload:** 3 days ago (SPEC-042, Potana site)\n\n**Note:** 4 records are missing lateral view photographs.',
  ],
  comparison: [
    '**Specimen Comparison**\n\n**SK-001 vs SK-002**\n\n| Feature | SK-001 | SK-002 |\n| Site | Potana | Sigiriya |\n| Time Period | Mesolithic | Iron Age |\n| Preservation | Good | Fair |\n| Condition | Complete | Fragmented |\n| Bones Recorded | 14 | 9 |\n| Images Uploaded | 8 | 3 |\n\n**Key Differences:**\n• SK-001 is significantly better preserved overall\n• SK-002 shows evidence of post-depositional disturbance\n• Both specimens lack upper limb documentation',
    '**Bone Type Comparison**\n\n**Femur vs Tibia Records**\n\n| Metric | Femur | Tibia |\n| Total Count | 12 | 8 |\n| Complete | 4 | 3 |\n| Fragmented | 6 | 4 |\n| With Images | 10 | 5 |\n\n**Summary:**\n• Femur records are better documented with more images per record\n• Tibia records show a higher proportional fragmentation rate\n• Both bone types are represented across all three major excavation sites',
  ],
}

// ─── Markdown renderer ───────────────────────────────────────────────────────

function renderInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>
      : <span key={i}>{part}</span>
  )
}

function MessageContent({ text }) {
  return (
    <div className="space-y-1.5 text-sm leading-relaxed">
      {text.split('\n').map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />

        if (line.startsWith('• ') || line.startsWith('- ')) {
          return (
            <div key={i} className="flex gap-2">
              <span className="text-purple-400 shrink-0 select-none">•</span>
              <span className="text-white/85">{renderInline(line.slice(2))}</span>
            </div>
          )
        }

        // Table row: contains " | " separators and isn't a divider line
        if (line.includes(' | ') && !/^[-| ]+$/.test(line)) {
          const cells = line.split('|').map(c => c.trim()).filter(Boolean)
          return (
            <div key={i} className="flex gap-4 border-b border-white/[0.07] py-1.5 last:border-0">
              <span className="w-36 shrink-0 text-white/40 text-xs uppercase tracking-wide">{cells[0]}</span>
              {cells.slice(1).map((cell, j) => (
                <span key={j} className="text-white/75 text-xs flex-1">{cell}</span>
              ))}
            </div>
          )
        }

        if (line.startsWith('**') && line.endsWith('**') && line.length > 4) {
          return <p key={i} className="font-semibold text-white mt-3 first:mt-0">{line.slice(2, -2)}</p>
        }

        return <p key={i} className="text-white/85">{renderInline(line)}</p>
      })}
    </div>
  )
}

// ─── OsteoAssist icon (bone shape) ──────────────────────────────────────────

function BoneIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v.31a4.5 4.5 0 01-1.5 3.354V9.75a4.5 4.5 0 001.5 3.354v.396a2.25 2.25 0 002.25 2.25h.844a.75.75 0 000-1.5H8.25a.75.75 0 01-.75-.75v-.396a6 6 0 000-6.708V3.75A.75.75 0 018.25 3h2.25a.75.75 0 000-1.5zM13.5 1.5a.75.75 0 000 1.5h2.25a.75.75 0 01.75.75v.396a6 6 0 000 6.708v.396a.75.75 0 01-.75.75h-.844a.75.75 0 000 1.5h.844A2.25 2.25 0 0018 12.75v-.396A4.5 4.5 0 0019.5 9V7.414A4.5 4.5 0 0018 4.06V3.75A2.25 2.25 0 0015.75 1.5H13.5z" />
    </svg>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

let msgId = 1

export default function AIAssistantPage() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [mode, setMode] = useState('quick')
  const [thinking, setThinking] = useState(false)
  const [sidebarSearch, setSidebarSearch] = useState('')
  const [activeHistory, setActiveHistory] = useState(null)

  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const typingRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  useEffect(() => {
    return () => { if (typingRef.current) clearInterval(typingRef.current) }
  }, [])

  const pickResponse = () => {
    const pool = RESPONSES[mode]
    return pool[Math.floor(Math.random() * pool.length)]
  }

  const startTyping = (response) => {
    if (typingRef.current) clearInterval(typingRef.current)
    const id = msgId++
    setMessages(prev => [...prev, {
      id, role: 'assistant', content: '', timestamp: new Date(), isTyping: true,
    }])
    let i = 0
    typingRef.current = setInterval(() => {
      i = Math.min(i + 4, response.length)
      setMessages(prev => prev.map(m => m.id === id ? { ...m, content: response.slice(0, i) } : m))
      if (i >= response.length) {
        clearInterval(typingRef.current)
        setMessages(prev => prev.map(m => m.id === id ? { ...m, isTyping: false } : m))
      }
    }, 16)
  }

  const send = (overrideText) => {
    const content = (overrideText ?? input).trim()
    if (!content || thinking) return
    setMessages(prev => [...prev, { id: msgId++, role: 'user', content, timestamp: new Date() }])
    setInput('')
    setThinking(true)
    setTimeout(() => {
      setThinking(false)
      startTyping(pickResponse())
      setTimeout(() => inputRef.current?.focus(), 50)
    }, 1000)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const fmt = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  const filteredHistory = CHAT_HISTORY.filter(h =>
    !sidebarSearch || h.title.toLowerCase().includes(sidebarSearch.toLowerCase())
  )

  return (
    <div
      className="flex overflow-hidden bg-slate-950"
      style={{ height: 'calc(100vh - 80px)' }}
    >

      {/* ══ Sidebar ══════════════════════════════════════════════════════════ */}
      <aside className="w-64 shrink-0 bg-[#0d0d14] border-r border-white/[0.06] flex flex-col">

        {/* Logo */}
        <div className="px-4 pt-5 pb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center shrink-0">
              <BoneIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-white text-sm font-bold tracking-tight">OsteoAssist</p>
              <p className="text-white/30 text-[10px] tracking-wide uppercase">Research AI</p>
            </div>
          </div>
        </div>

        {/* New Chat */}
        <div className="px-3 pt-3 pb-2">
          <button
            onClick={() => {
              if (typingRef.current) clearInterval(typingRef.current)
              setMessages([])
              setInput('')
              setThinking(false)
              setActiveHistory(null)
            }}
            className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium px-3 py-2.5 rounded-xl transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Chat
          </button>
        </div>

        {/* Search */}
        <div className="px-3 pb-3">
          <div className="relative">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25 pointer-events-none">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              value={sidebarSearch}
              onChange={e => setSidebarSearch(e.target.value)}
              placeholder="Search chats"
              className="w-full bg-white/[0.04] border border-white/[0.07] rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-white/25 focus:outline-none focus:border-purple-500/50 transition-colors"
            />
          </div>
        </div>

        {/* Scrollable sidebar body */}
        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-5">

          {/* Quick Tools */}
          <div>
            <p className="text-[10px] text-white/25 uppercase tracking-[0.15em] mb-1.5 px-1">Quick Tools</p>
            <div className="space-y-0.5">
              {QUICK_TOOLS.map(tool => (
                <button
                  key={tool.label}
                  onClick={() => { setInput(tool.prompt); inputRef.current?.focus() }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left hover:bg-white/[0.05] transition-colors group"
                >
                  <div className="w-6 h-6 rounded-md bg-white/[0.05] flex items-center justify-center shrink-0 group-hover:bg-purple-900/50 transition-colors">
                    {tool.icon}
                  </div>
                  <span className="text-xs text-white/55 group-hover:text-white/85 transition-colors">{tool.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Chat History */}
          <div>
            <p className="text-[10px] text-white/25 uppercase tracking-[0.15em] mb-1.5 px-1">Chat History</p>
            <div className="space-y-0.5">
              {filteredHistory.length === 0 ? (
                <p className="text-xs text-white/25 px-2.5 py-2">No chats found</p>
              ) : filteredHistory.map(h => (
                <button
                  key={h.id}
                  onClick={() => setActiveHistory(h.id)}
                  className={`w-full flex items-start gap-2 px-2.5 py-2.5 rounded-lg text-left transition-all ${
                    activeHistory === h.id
                      ? 'bg-purple-900/25 border border-purple-700/30'
                      : 'hover:bg-white/[0.04] border border-transparent'
                  }`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-3.5 h-3.5 text-white/25 shrink-0 mt-0.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                  </svg>
                  <div className="min-w-0">
                    <p className="text-xs text-white/65 truncate leading-snug">{h.title}</p>
                    <p className="text-[10px] text-white/25 mt-0.5">{h.time}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

        </div>
      </aside>

      {/* ══ Main chat area ═══════════════════════════════════════════════════ */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-950">

        {messages.length === 0 ? (
          /* ─ Welcome screen ─ */
          <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-purple-600/20 border border-purple-600/25 flex items-center justify-center mb-6">
              <BoneIcon className="w-8 h-8 text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Ready when you are.</h2>
            <p className="text-white/35 text-sm mb-10">
              Ask anything about osteoarchaeological records
            </p>
            <div className="grid grid-cols-2 gap-3 w-full max-w-xl">
              {EXAMPLE_PROMPTS.map(p => (
                <button
                  key={p}
                  onClick={() => send(p)}
                  className="bg-white/[0.04] hover:bg-purple-900/25 border border-white/[0.07] hover:border-purple-600/40 text-white/55 hover:text-white/85 text-sm text-left px-4 py-3.5 rounded-xl transition-all leading-snug"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* ─ Message list ─ */
          <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
            {messages.map(msg => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>

                {/* Avatar — assistant only */}
                {msg.role === 'assistant' && (
                  <div className="shrink-0 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center mt-0.5">
                    <BoneIcon className="w-3.5 h-3.5 text-white" />
                  </div>
                )}

                <div className={`max-w-[72%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                  {/* Bubble */}
                  <div className={`rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-purple-600 text-white rounded-tr-sm'
                      : 'bg-slate-800/80 border border-white/[0.07] rounded-tl-sm'
                  }`}>
                    {msg.role === 'user'
                      ? <p className="text-sm leading-relaxed">{msg.content}</p>
                      : <MessageContent text={msg.content} />
                    }
                    {/* Typing cursor */}
                    {msg.isTyping && (
                      <span className="inline-block w-[3px] h-[14px] bg-purple-400 ml-0.5 animate-pulse rounded-sm align-middle" />
                    )}
                  </div>
                  {/* Timestamp */}
                  <p className={`text-[10px] text-white/20 mt-1.5 ${msg.role === 'user' ? 'text-right' : ''}`}>
                    {fmt(msg.timestamp)}
                  </p>
                </div>

              </div>
            ))}

            {/* Thinking indicator */}
            {thinking && (
              <div className="flex gap-3">
                <div className="shrink-0 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center mt-0.5">
                  <BoneIcon className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="bg-slate-800/80 border border-white/[0.07] rounded-2xl rounded-tl-sm px-4 py-3.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}

        {/* ─ Input bar ─ */}
        <div className="border-t border-white/[0.06] bg-slate-950 px-8 py-4">
          <div className="flex gap-3 items-end max-w-3xl mx-auto">

            {/* Mode selector */}
            <select
              value={mode}
              onChange={e => setMode(e.target.value)}
              className="shrink-0 bg-slate-800 border border-white/10 text-white/60 text-xs rounded-xl px-3 py-3 h-12 focus:outline-none focus:border-purple-500 transition-colors cursor-pointer"
            >
              {MODES.map(m => (
                <option key={m.value} value={m.value} className="bg-slate-800 text-white">
                  {m.label}
                </option>
              ))}
            </select>

            {/* Text area */}
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about skeletal records…"
              className="flex-1 bg-slate-800 border border-white/10 focus:border-purple-500 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none transition-colors resize-none leading-relaxed"
              style={{ minHeight: '48px', maxHeight: '144px' }}
            />

            {/* Send button */}
            <button
              onClick={() => send()}
              disabled={!input.trim() || thinking}
              className="shrink-0 w-12 h-12 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 disabled:text-white/15 text-white rounded-xl transition-colors flex items-center justify-center"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>

          </div>
          <p className="text-center text-white/15 text-[11px] mt-2.5">
            Enter to send · Shift+Enter for new line · OsteoAssist uses simulated responses — Claude API coming soon
          </p>
        </div>

      </main>
    </div>
  )
}
