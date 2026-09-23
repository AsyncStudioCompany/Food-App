import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

/** Bottom sheet: a tap on the scrim (or Escape) closes it. Rendered at the app root, so it never scrolls with a screen. */
export function Sheet({ onClose, gap = 20, label, children }: { onClose: () => void; gap?: 16 | 20; label: string; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])
  const sheet = (
    <div className="scrim" onClick={onClose}>
      <div className={'sheet' + (gap === 16 ? ' sheet--16' : '')} role="dialog" aria-modal="true" aria-label={label} onClick={(e) => e.stopPropagation()}>
        <span className="sheet__grip" />
        {children}
      </div>
    </div>
  )
  const root = document.querySelector('.app')
  return root ? createPortal(sheet, root) : sheet
}
