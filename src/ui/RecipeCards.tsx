import { useNavigate } from 'react-router'
import type { Evaluation } from '../domain/matching'
import { photoBg, usePhotos } from '../state/photos'
import { LikeButton } from './Heart'
import { cardStatus, cardTag, meta, metaMono, missLabel, recipePath, saveLabel, statusLabel } from './labels'

/** Third line of a row: what to save (Tu as tout), what is missing (presque), or the status (search, lists). */
export type RowLine = 'save' | 'missing' | 'status'

export function RecipeRow({ e, line }: { e: Evaluation; line: RowLine }) {
  const navigate = useNavigate()
  const photos = usePhotos()
  let third: { text: string; color: string } | null = null
  if (line === 'save') third = e.saving.length ? { text: saveLabel(e), color: 'var(--warn-ink)' } : null
  else if (line === 'missing') third = { text: missLabel(e), color: 'var(--miss)' }
  else third = { text: statusLabel(e), color: e.missing.length === 0 ? 'var(--ok-ink)' : 'var(--miss)' }
  return (
    <div className="row" role="link" tabIndex={0} onClick={() => navigate(recipePath(e.recipe.id))} onKeyDown={(k) => k.key === 'Enter' && navigate(recipePath(e.recipe.id))}>
      <div className="row__thumb" style={{ background: photoBg(photos[e.recipe.id], true) }} />
      <LikeButton recipeId={e.recipe.id} variant="row" />
      <div className="row__body">
        <div className="row__name">{e.recipe.name}</div>
        <div className="row__meta">{meta(e)}</div>
        {third && (
          <div className="row__status" style={{ color: third.color }}>
            {third.text}
          </div>
        )}
      </div>
    </div>
  )
}

export function TopCard({ e, rank }: { e: Evaluation; rank: number }) {
  const navigate = useNavigate()
  const photos = usePhotos()
  const tag = cardTag(e)
  return (
    <div className="topcard" role="link" tabIndex={0} style={{ background: photoBg(photos[e.recipe.id]) }} onClick={() => navigate(recipePath(e.recipe.id))} onKeyDown={(k) => k.key === 'Enter' && navigate(recipePath(e.recipe.id))}>
      <div className="topcard__scrim" />
      {tag && <span className="topcard__tag">{tag}</span>}
      <span className="topcard__rank">{String(rank).padStart(2, '0')}</span>
      <div className="topcard__body">
        <div className="topcard__name">{e.recipe.name}</div>
        <div className="topcard__meta">{metaMono(e)}</div>
        <div className="topcard__rule" />
        <div className="topcard__foot">
          <div className="topcard__status" style={{ color: e.missing.length === 0 ? 'var(--card-ok)' : 'var(--card-miss)' }}>
            {cardStatus(e)}
          </div>
          <LikeButton recipeId={e.recipe.id} variant="photo" />
        </div>
      </div>
    </div>
  )
}
