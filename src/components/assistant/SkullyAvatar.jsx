/* eslint-disable react/prop-types */
import { Skull } from 'lucide-react'

const sizes = {
  small: { frame: 'h-9 w-9 rounded-xl', icon: 'h-5 w-5', mark: 'h-1.5 w-1.5' },
  medium: { frame: 'h-14 w-14 rounded-2xl', icon: 'h-7 w-7', mark: 'h-2 w-2' },
}

export default function SkullyAvatar({ size = 'small' }) {
  const style = sizes[size] || sizes.small
  return <span className={`relative inline-flex shrink-0 items-center justify-center border border-teal-200/20 bg-teal-300/10 text-teal-100 shadow-[0_8px_24px_rgba(13,148,136,0.14)] ${style.frame}`} aria-label="Skully assistant avatar"><Skull className={style.icon} strokeWidth={1.7} /><span className={`absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-slate-950 bg-teal-300 ${style.mark}`} /></span>
}
