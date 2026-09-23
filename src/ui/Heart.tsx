import type { MouseEvent } from 'react'
import { toggleLike, useStore } from '../state/store'

/** CSS-drawn heart: red when liked; muted (or white on photos) and faded otherwise. */
export function Heart({ on, onPhoto = false, offOpacity = 0.4 }: { on: boolean; onPhoto?: boolean; offOpacity?: number }) {
  const color = on ? 'var(--heart)' : onPhoto ? '#ffffff' : 'var(--muted)'
  const opacity = on ? 1 : onPhoto ? 0.55 : offOpacity
  return (
    <span className="heart" style={{ color, opacity }} aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
  )
}

type Variant = 'row' | 'photo' | 'hero'

const CLASS: Record<Variant, string> = { row: 'row__heart', photo: 'topcard__heart', hero: 'hero-btn' }

/** Like button; stops the click so the card under it does not open. */
export function LikeButton({ recipeId, variant }: { recipeId: string; variant: Variant }) {
  const on = useStore((s) => !!s.liked[recipeId])
  const click = (e: MouseEvent) => {
    e.stopPropagation()
    toggleLike(recipeId)
  }
  return (
    <button type="button" className={CLASS[variant]} onClick={click} aria-pressed={on} aria-label={on ? 'Retirer des coups de cœur' : 'Ajouter aux coups de cœur'}>
      <Heart on={on} onPhoto={variant === 'photo'} offOpacity={variant === 'hero' ? 0.5 : 0.4} />
    </button>
  )
}
