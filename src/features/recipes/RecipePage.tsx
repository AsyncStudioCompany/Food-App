import { Check, ChefHat, Clock, Minus, Plus, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { AppHeader } from '../../components/AppHeader'
import { RecipeVisual } from '../../components/RecipeVisual'
import { fridgeStore, useFridge } from '../../data/fridgeStore'
import { usePreferences } from '../../data/preferencesStore'
import { ingredientIndex, recipes } from '../../data/seed'
import { consumeRecipe } from '../../domain/consume'
import { matchRecipe, type IngredientCheck } from '../../domain/matching'
import { formatQuantity } from '../../domain/units'
import { CUISINE_LABELS, DIFFICULTY_LABELS, formatMinutes } from './labels'

function round(value: number) {
  return Math.round(value * 100) / 100
}

function IngredientLine({ check }: { check: IngredientCheck }) {
  const ingredient = ingredientIndex.get(check.line.ingredientId)
  const { unit, note, optional } = check.line
  const quantity =
    check.needed !== undefined && unit
      ? unit === 'piece'
        ? `× ${formatQuantity(round(check.needed), unit)}`
        : formatQuantity(round(check.needed), unit)
      : null
  const details = [quantity, note].filter(Boolean).join(' · ')
  const status = check.isPantryStaple
    ? { label: 'Placard', className: 'text-stone-400' }
    : check.status === 'enough'
      ? { label: "J'ai", className: 'text-emerald-300' }
      : check.status === 'insufficient'
        ? {
            label: `Pas assez${check.available !== undefined && unit ? ` (${formatQuantity(round(check.available), unit)})` : ''}`,
            className: 'text-amber-300',
          }
        : { label: optional ? 'Facultatif' : 'Il manque', className: optional ? 'text-stone-500' : 'text-red-300' }
  return (
    <li className="flex items-center gap-3 border-b border-stone-900 py-3">
      <span className="text-2xl" aria-hidden="true">{ingredient?.emoji ?? '🥫'}</span>
      <div className="min-w-0 flex-1">
        <p className="font-medium">{ingredient?.name ?? check.line.ingredientId}</p>
        {details && <p className="text-sm text-stone-400 tabular-nums">{details}</p>}
      </div>
      <span className={`flex shrink-0 items-center gap-1 text-sm ${status.className}`}>
        {check.status === 'enough' && !check.isPantryStaple && <Check className="size-4" aria-hidden="true" />}
        {check.status === 'missing' && !optional && <X className="size-4" aria-hidden="true" />}
        {status.label}
      </span>
    </li>
  )
}

export function RecipePage() {
  const { id } = useParams()
  const recipe = recipes.find((candidate) => candidate.id === id)
  const fridge = useFridge()
  const preferences = usePreferences()
  const [servings, setServings] = useState(recipe?.servings ?? 1)
  const [cooked, setCooked] = useState(false)

  const match = useMemo(
    () => (recipe ? matchRecipe(recipe, fridge, ingredientIndex, preferences, { servings }) : null),
    [recipe, fridge, preferences, servings],
  )

  if (!recipe || !match) {
    return (
      <>
        <AppHeader backTo="/recherche" />
        <p className="text-stone-400">Cette recette n'existe pas.</p>
      </>
    )
  }

  function cook() {
    if (!match) return
    fridgeStore.set((items) => consumeRecipe(items, match, ingredientIndex))
    setCooked(true)
  }

  return (
    <>
      <AppHeader backTo={-1} />
      <RecipeVisual recipe={recipe} className="mb-5 h-56 w-full rounded-3xl" emojiClassName="text-8xl" />
      <h1 className="mb-2 text-3xl leading-tight font-semibold tracking-tight">{recipe.title}</h1>
      <p className="mb-3 flex flex-wrap items-center gap-x-2 font-mono text-xs text-stone-400">
        <Clock className="size-3.5" aria-hidden="true" />
        {formatMinutes(recipe.prepMinutes + recipe.cookMinutes)} · {DIFFICULTY_LABELS[recipe.difficulty]}
        {recipe.cuisine && ` · ${CUISINE_LABELS[recipe.cuisine]}`}
      </p>
      {recipe.description && <p className="mb-5 text-stone-300">{recipe.description}</p>}

      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Ingrédients</h2>
        <div className="flex items-center gap-2 rounded-full border border-stone-800 bg-stone-900 p-1">
          <button
            type="button"
            aria-label="Moins de portions"
            onClick={() => setServings(Math.max(1, servings - 1))}
            className="flex size-8 items-center justify-center rounded-full active:bg-stone-800"
          >
            <Minus className="size-4" />
          </button>
          <span className="min-w-20 text-center text-sm tabular-nums" aria-live="polite">
            {servings} {servings > 1 ? 'personnes' : 'personne'}
          </span>
          <button
            type="button"
            aria-label="Plus de portions"
            onClick={() => setServings(servings + 1)}
            className="flex size-8 items-center justify-center rounded-full active:bg-stone-800"
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>
      <ul className="mb-8">
        {match.checks.map((check) => (
          <IngredientLine key={check.line.ingredientId} check={check} />
        ))}
      </ul>

      <h2 className="mb-3 text-xl font-semibold">Étapes</h2>
      <ol className="mb-8 space-y-4">
        {recipe.steps.map((step, index) => (
          <li key={index} className="flex gap-4">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-stone-900 font-mono text-sm text-stone-300">
              {index + 1}
            </span>
            <p className="pt-1 text-stone-200">{step}</p>
          </li>
        ))}
      </ol>

      {cooked ? (
        <div className="mb-4 rounded-3xl border border-emerald-400/30 bg-emerald-950/40 p-5 text-center">
          <p className="mb-3 text-emerald-200">Bon appétit ! Les quantités utilisées ont été retirées de ton frigo.</p>
          <Link to="/" className="font-semibold underline">Voir mon frigo</Link>
        </div>
      ) : (
        <button
          type="button"
          onClick={cook}
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-full bg-stone-50 py-4 font-semibold text-stone-950"
        >
          <ChefHat className="size-5" aria-hidden="true" />
          J'ai cuisiné cette recette
        </button>
      )}
    </>
  )
}
