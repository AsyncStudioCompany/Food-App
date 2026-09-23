/** Le « p » de popote : une poêle vue de dessus, avec un jaune d'œuf au centre. */
export function LogoMark({ className = 'size-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <circle cx="17" cy="12" r="7" fill="none" stroke="currentColor" strokeWidth="3.2" />
      <path d="M10 12v15" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
      <circle cx="17" cy="12" r="2.4" fill="#fbbf24" />
    </svg>
  )
}

export function Logo() {
  return (
    <span className="flex items-center gap-1.5 text-xl font-semibold tracking-tight">
      <LogoMark />
      popote
    </span>
  )
}
