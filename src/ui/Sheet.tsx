import { useEffect, type ReactNode } from 'react'

/** Bottom sheet: a tap on the scrim (or Escape) closes it. */
export function Sheet({ onClose, gap = 20, label, children }: { onClose: () => void; gap?: 16 | 20; label: string; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="scrim" onClick={onClose}>
      <div className={'sheet' + (gap === 16 ? ' sheet--16' : '')} role="dialog" aria-modal="true" aria-label={label} onClick={(e) => e.stopPropagation()}>
        <span className="sheet__grip" />
        {children}
      </div>
    </div>
  )
}
