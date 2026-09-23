import { useState } from 'react'
import { FAV_LIST, useLists } from '../state/lists'
import { photoBg, usePhotos } from '../state/photos'
import { useAllRecipes } from '../state/recipes'
import { createList, toggleInList, toggleLike } from '../state/store'
import { plural } from '../ui/labels'
import { Sheet } from '../ui/Sheet'

/** "Ajouter à une liste", opened from the recipe page. */
export function ListSheet({ recipeId, onClose }: { recipeId: string; onClose: () => void }) {
  const recipe = useAllRecipes().find((r) => r.id === recipeId)
  const lists = useLists().filter((l) => l.auto !== 'generated')
  const photos = usePhotos()
  const [name, setName] = useState('')

  return (
    <Sheet onClose={onClose} gap={16} label="Ajouter à une liste">
      <div className="sheet__head">
        <span className="sheet__title sheet__title--26">Ajouter à une liste</span>
        <span className="sheet__sub">{recipe?.name}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {lists.map((l) => {
          const on = l.recipeIds.includes(recipeId)
          return (
            <button
              key={l.id}
              type="button"
              aria-pressed={on}
              onClick={() => (l.id === FAV_LIST ? toggleLike(recipeId) : toggleInList(l.id, recipeId))}
              style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 56, borderBottom: '1px solid var(--line)', width: '100%' }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 'var(--r3)', background: photoBg(photos[l.recipeIds[0]], true), flex: 'none' }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <span style={{ font: '600 15px var(--font)' }}>{l.name}</span>
                <span className="muted" style={{ font: '12.5px var(--font)' }}>
                  {plural(l.recipeIds.length, 'recette')}
                </span>
              </div>
              <span
                style={{ width: 26, height: 26, borderRadius: '50%', border: `1.5px solid ${on ? 'var(--accent)' : 'var(--line)'}`, background: on ? 'var(--accent)' : 'transparent', color: 'var(--accent-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '700 13px var(--font)' }}
              >
                {on ? '✓' : ''}
              </span>
            </button>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input className="input input--48" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nouvelle liste…" aria-label="Nom de la nouvelle liste" />
        <button
          type="button"
          className="btn-square"
          style={{ padding: '0 16px', border: '1.5px solid var(--line)' }}
          onClick={() => {
            createList(name, recipeId)
            setName('')
          }}
        >
          Créer
        </button>
      </div>
      <button type="button" className="btn-ink" onClick={onClose}>
        Terminé
      </button>
    </Sheet>
  )
}
