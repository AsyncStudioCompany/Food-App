import { useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import { evaluate } from '../domain/matching'
import { useLists } from '../state/lists'
import { photoBg, STRIPE, usePhotos } from '../state/photos'
import { useAllRecipes, useMatchContext } from '../state/recipes'
import { createList, useStore } from '../state/store'
import { Heart } from '../ui/Heart'
import { plural } from '../ui/labels'
import { RecipeRow } from '../ui/RecipeCards'

export function ListsScreen() {
  const lists = useLists()
  const photos = usePhotos()
  const liked = useStore((s) => s.liked)
  const favCount = Object.values(liked).filter(Boolean).length
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')

  return (
    <div className="screen">
      <h1 className="title title--pretty" style={{ marginBottom: 6 }}>
        <span>Mes listes</span> <span className="muted">de recettes.</span>
      </h1>
      <div className="muted" style={{ font: '14px var(--font)', marginBottom: 20 }}>
        {plural(lists.length, 'liste')} · {favCount} coup{favCount > 1 ? 's' : ''} de cœur
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
        {lists.map((l) => (
          <Link key={l.id} to={`/listes/${l.id}`} style={{ display: 'flex', flexDirection: 'column', gap: 8, color: 'inherit', textDecoration: 'none' }}>
            <div style={{ aspectRatio: '1', borderRadius: 'var(--r1)', overflow: 'hidden', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, background: 'var(--line)', position: 'relative' }}>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} style={{ background: l.recipeIds[i] ? photoBg(photos[l.recipeIds[i]], true) : STRIPE }} />
              ))}
              {l.auto === 'fav' && (
                <span style={{ position: 'absolute', left: 10, top: 10, width: 30, height: 30, borderRadius: '50%', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Heart on />
                </span>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1, padding: '0 2px' }}>
              <span style={{ font: '600 15px var(--font)' }}>{l.name}</span>
              <span className="muted" style={{ font: '13px var(--font)' }}>
                {plural(l.recipeIds.length, 'recette')}
              </span>
            </div>
          </Link>
        ))}
        {!creating && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            style={{ aspectRatio: '1', borderRadius: 'var(--r1)', border: '1.5px dashed var(--line)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'var(--muted)' }}
          >
            <span style={{ font: '300 34px/1 var(--font)' }}>+</span>
            <span style={{ font: '600 14px var(--font)' }}>Nouvelle liste</span>
          </button>
        )}
      </div>
      {creating && (
        <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
          <input className="input input--48" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. Batch cooking du dimanche" aria-label="Nom de la liste" />
          <button
            type="button"
            className="btn-square"
            style={{ background: 'var(--ink)', color: 'var(--bg)' }}
            onClick={() => {
              if (!name.trim()) return
              createList(name)
              setName('')
              setCreating(false)
            }}
          >
            Créer
          </button>
        </div>
      )}
    </div>
  )
}

export function ListDetailScreen() {
  const { id } = useParams()
  const list = useLists().find((l) => l.id === id)
  const recipes = useAllRecipes()
  const ctx = useMatchContext()
  const rows = useMemo(
    () =>
      (list?.recipeIds ?? [])
        .map((rid) => recipes.find((r) => r.id === rid))
        .filter((r) => r !== undefined)
        .map((r) => evaluate(r, ctx.prefs.portions, ctx)),
    [list, recipes, ctx],
  )
  if (!list) return <Navigate to="/listes" replace />
  return (
    <div className="screen">
      <Link to="/listes" className="muted" style={{ display: 'inline-flex', height: 40, alignItems: 'center', font: '600 14px var(--font)', marginBottom: 6, textDecoration: 'none' }}>
        ← Mes listes
      </Link>
      <h1 className="title title--pretty" style={{ marginBottom: 6 }}>
        {list.name}
      </h1>
      <div className="muted" style={{ font: '14px var(--font)', marginBottom: 18 }}>
        {plural(rows.length, 'recette')}
      </div>
      <div className="rows">
        {rows.map((e) => (
          <RecipeRow key={e.recipe.id} e={e} line="status" />
        ))}
      </div>
      {rows.length === 0 && (
        <div style={{ padding: '24px 18px', borderRadius: 'var(--r2)', border: '1.5px dashed var(--line)', font: '14px/1.5 var(--font)', textAlign: 'center' }} className="muted">
          Rien ici pour l'instant. Touche le cœur ou « + Liste » sur une recette.
        </div>
      )}
    </div>
  )
}
