import { ArrowRight, Search, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { AppHeader } from '../../components/AppHeader'
import { useFridge } from '../../data/fridgeStore'
import { ingredientIndex, ingredients } from '../../data/seed'
import { searchIngredients } from '../../domain/search'
import type { FridgeItem, Ingredient } from '../../domain/types'
import { formatQuantity } from '../../domain/units'
import { suggestable, useMatches } from '../results/useMatches'
import { IngredientSheet } from './IngredientSheet'
import { FRIDGE_SECTIONS } from './sections'

function Chip({ ingredient, item, onClick }: { ingredient: Ingredient; item?: FridgeItem; onClick: () => void }) {
  const selected = item !== undefined
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`flex min-h-10 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium transition-colors ${
        selected ? 'bg-stone-50 text-stone-950' : 'border border-stone-800 bg-stone-900 text-stone-200 active:bg-stone-800'
      }`}
    >
      <span aria-hidden="true">{ingredient.emoji ?? '🥫'}</span>
      {ingredient.name}
      {item?.quantity !== undefined && item.unit && (
        <span className="rounded-full bg-stone-200 px-1.5 text-xs text-stone-600 tabular-nums">
          {formatQuantity(item.quantity, item.unit)}
        </span>
      )}
    </button>
  )
}

export function FridgePage() {
  const navigate = useNavigate()
  const fridge = useFridge()
  const matches = useMatches()
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<Ingredient | null>(null)

  const byIngredient = useMemo(() => new Map(fridge.map((item) => [item.ingredientId, item])), [fridge])
  const results = useMemo(
    () => searchIngredients(query, ingredients.filter((ingredient) => !ingredient.isPantryStaple)),
    [query],
  )
  const listed = new Set(FRIDGE_SECTIONS.flatMap((section) => section.ingredientIds))
  const others = fridge.filter((item) => !listed.has(item.ingredientId))
  const sections = [
    ...FRIDGE_SECTIONS,
    ...(others.length > 0 ? [{ title: 'Autres', ingredientIds: others.map((item) => item.ingredientId) }] : []),
  ]
  const found = suggestable(matches).length

  return (
    <>
      <AppHeader />
      <h1 className="mb-1 text-3xl font-semibold tracking-tight">
        Qu'est-ce que t'as <span className="text-stone-500">dans ton frigo ?</span>
      </h1>
      <p className="mb-5 text-stone-400">Touche un aliment pour l'ajouter avec sa quantité.</p>

      <div className="relative mb-6">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-stone-500" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Chercher un aliment…"
          aria-label="Chercher un aliment"
          className="w-full rounded-full border border-stone-800 bg-stone-900 py-3 pr-11 pl-11 text-stone-100 placeholder:text-stone-500"
        />
        {query && (
          <button type="button" aria-label="Effacer" onClick={() => setQuery('')} className="absolute top-1/2 right-3 -translate-y-1/2 p-1 text-stone-400">
            <X className="size-4" />
          </button>
        )}
      </div>

      {query ? (
        <section aria-label="Résultats de recherche" className="mb-8">
          {results.length === 0 ? (
            <p className="text-stone-400">Aucun aliment ne correspond.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {results.map((ingredient) => (
                <Chip key={ingredient.id} ingredient={ingredient} item={byIngredient.get(ingredient.id)} onClick={() => setEditing(ingredient)} />
              ))}
            </div>
          )}
        </section>
      ) : (
        sections.map((section) => {
          const selected = section.ingredientIds.filter((id) => byIngredient.has(id)).length
          return (
            <section key={section.title} className="mb-6" aria-labelledby={`section-${section.title}`}>
              <div className="mb-2.5 flex items-baseline justify-between">
                <h2 id={`section-${section.title}`} className="font-semibold">{section.title}</h2>
                <span className="font-mono text-xs text-stone-500">
                  {selected}/{section.ingredientIds.length}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {section.ingredientIds.map((id) => {
                  const ingredient = ingredientIndex.get(id)
                  if (!ingredient) return null
                  return <Chip key={id} ingredient={ingredient} item={byIngredient.get(id)} onClick={() => setEditing(ingredient)} />
                })}
              </div>
            </section>
          )
        })
      )}

      {fridge.length > 0 && (
        <div className="fixed inset-x-0 bottom-[calc(var(--safe-bottom)+5rem)] z-30 px-4">
          <button
            type="button"
            onClick={() => navigate('/resultats')}
            className="mx-auto flex w-full max-w-md items-center justify-between rounded-full bg-stone-50 py-2 pr-2 pl-6 font-semibold text-stone-950 shadow-2xl"
          >
            Trouver des recettes
            <span className="flex items-center gap-1 rounded-full bg-stone-950 px-3 py-2 font-mono text-sm text-stone-50">
              {found.toString().padStart(2, '0')}
              <ArrowRight className="size-4" aria-hidden="true" />
            </span>
          </button>
        </div>
      )}

      {editing && (
        <IngredientSheet
          key={editing.id}
          ingredient={editing}
          current={byIngredient.get(editing.id)}
          onClose={() => {
            setEditing(null)
            setQuery('')
          }}
        />
      )}
    </>
  )
}
