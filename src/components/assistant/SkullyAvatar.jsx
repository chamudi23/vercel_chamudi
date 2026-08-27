/* eslint-disable react/prop-types */

const sizes = { small: 'h-8 w-8', medium: 'h-11 w-11', large: 'h-24 w-24' }

export default function SkullyAvatar({ size = 'small' }) {
  const showFineDetail = size !== 'small'

  return <span className={`relative inline-flex shrink-0 items-center justify-center ${sizes[size] || sizes.small}`} role="img" aria-label="Skully assistant avatar">
    <svg viewBox="0 0 96 96" className="h-full w-full" aria-hidden="true">
      <circle cx="48" cy="48" r="43" fill="#071827" fillOpacity=".72" />

      {/* Simplified human skull: dome, cheekbones, jaw, sockets, nasal opening, and teeth. */}
      <path d="M48 11C29 11 19 25 19 42c0 12 5 20 12 25l3 2v8c0 6 5 10 11 10h6c6 0 11-4 11-10v-8l3-2c7-5 12-13 12-25C77 25 67 11 48 11Z" fill="#d7e2df" />
      <path d="M27 43c0-13 8-24 21-25-14 3-21 15-21 27 0 8 2 15 7 20l3-3c-6-6-10-11-10-19Z" fill="#f2f6f0" fillOpacity=".7" />
      <path d="M23 54c2 8 7 13 14 17l-3-10-7-7-4 0Zm50 0c-2 8-7 13-14 17l3-10 7-7 4 0Z" fill="#b8cbc6" />
      <path d="M34 68h28v9c0 5-4 9-9 9h-10c-5 0-9-4-9-9v-9Z" fill="#c7d6d1" />
      <path d="M38 70h20v8H38z" fill="#eef3ec" />

      <ellipse cx="36.5" cy="47" rx="10" ry="11" fill="#0a1a2a" />
      <ellipse cx="59.5" cy="47" rx="10" ry="11" fill="#0a1a2a" />
      <path d="M48 53l-5 9h10l-5-9Z" fill="#0a1a2a" />
      <path d="M41 65c2 2 12 2 14 0" fill="none" stroke="#778e8d" strokeLinecap="round" strokeWidth="1.5" />
      {showFineDetail && <path d="M43 71v7m5-7v8m5-8v7" stroke="#839a97" strokeLinecap="round" strokeWidth="1.25" />}

      {/* One restrained research/AI detail at the temple. */}
      <path d="M22 34h7l4 5" fill="none" stroke="#2dd4bf" strokeLinecap="round" strokeWidth="1.6" />
      <circle cx="20" cy="34" r="2.6" fill="#2dd4bf" />
    </svg>
    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border border-slate-950 bg-teal-300" />
  </span>
}
