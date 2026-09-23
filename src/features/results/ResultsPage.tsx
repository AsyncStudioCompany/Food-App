import { ArrowDownUp, Check, ChevronDown, Clock, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { AppHeader } from '../../components/AppHeader'
import { RecipeVisual } from '../../components/RecipeVisual'
import { useFridge } from '../../data/fridgeStore'
import { updatePreferences, usePreferences } from '../../data/preferencesStore'
import type { RecipeMatch } from '../../domain/matching'
import { MEAL_TYPES, type Diet, type MealType } from '../../domain/types'
import { DIET_LABELS, DIFFICULTY_LABELS, TAG_LABELS, formatMinutes } from '../recipes/labels'
import { describeMissing } from './describe'
import { suggestable, useMatches } from './useMatches'

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Petit-déj',
  starter: 'Entrée',
  main: 'Plat',
  dessert: 'Dessert',
  snack: 'En-cas',
  drink: 'Boisson',
}

const pill =
  'flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-stone-800 bg-stone-900 px-4 text-sm font-medium text-stone-200'

function totalMinutes(match: RecipeMatch) {
  return match.recipe.prepMinutes + match.recipe.cookMinutes
}

function Status({ match }: { match: RecipeMatch }) {
  const missing = describeMissing(match)
  return missing ? (
    <p className="text-sm text-red-300">Il te manque : {missing}</p>
  ) : (
    <p className="flex items-center gap-1 text-sm text-emerald-300">
      <Check className="size-4" aria-hidden="true" /> Tu as tout
    </p>
  )
}

function FeaturedCard({ match, rank }: { match: RecipeMatch; rank: number }) {
  const { recipe } = match
  const badge = recipe.tags.map((tag) => TAG_LABELS[tag]).find(Boolean)
  return (
    <Link
      to={`/recette/${recipe.id}`}
      className="relative block h-96 w-[78%] shrink-0 snap-center overflow-hidden rounded-3xl border border-stone-800"
    >
      <RecipeVisual recipe={recipe} className="absolute inset-0 size-full" emojiClassName="text-[7rem] -mt-24" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
      <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4">
        {badge ? (
          <span className="rounded-full bg-black/40 px-3 py-1 text-xs font-medium backdrop-blur">{badge}</span>
        ) : (
          <span />
        )}
        <span className="font-mono text-xs text-stone-300">{rank.toString().padStart(2, '0')}</span>
      </div>
      <div className="absolute inset-x-0 bottom-0 p-4">
        <h3 className="mb-1 text-2xl leading-tight font-semibold">{recipe.title}</h3>
        <p className="mb-3 flex items-center gap-1.5 font-mono text-xs text-stone-300">
          <Clock className="size-3.5" aria-hidden="true" />
          {formatMinutes(totalMinutes(match))} · {DIFFICULTY_LABELS[recipe.difficulty]}
        </p>
        <Status match={match} />
      </div>
    </Link>
  )
}

function RecipeRow({ match }: { match: RecipeMatch }) {
  const { recipe } = match
  return (
    <li>
      <Link to={`/recette/${recipe.id}`} className="flex items-center gap-3 rounded-2xl p-2 active:bg-stone-900">
        <RecipeVisual recipe={recipe} className="size-20 shrink-0 rounded-2xl" emojiClassName="text-4xl" />
        <div className="min-w-0">
          <h3 className="font-semibold">{recipe.title}</h3>
          <p className="mb-0.5 font-mono text-xs text-stone-400">
            {formatMinutes(totalMinutes(match))} · {DIFFICULTY_LABELS[recipe.difficulty]}
          </p>
          <Status match={match} />
        </div>
      </Link>
    </li>
  )
}

export function ResultsPage() {
  const fridge = useFridge()
  const preferences = usePreferences()
  const [sortByTime, setSortByTime] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [mealTypes, setMealTypes] = useState<MealType[]>([])

  const all = suggestable(useMatches()).filter(
    (match) => mealTypes.length === 0 || match.recipe.mealType.some((type) => mealTypes.includes(type)),
  )
  const sorted = sortByTime
    ? [...all].sort((a, b) => totalMinutes(a) - totalMinutes(b))
    : all
  const top = sorted.slice(0, 3)
  const rest = sorted.slice(3)
  const ready = rest.filter((match) => match.group === 'ready')
  const almost = rest.filter((match) => match.group === 'almost')

  return (
    <>
      <AppHeader backTo="/" />
      <h1 className="mb-5 text-4xl leading-tight font-semibold tracking-tight">
        {all.length} {all.length > 1 ? 'recettes' : 'recette'} <span className="text-stone-500">avec ce que t'as.</span>
      </h1>

      <div className="no-scrollbar -mx-4 mb-3 flex gap-2 overflow-x-auto px-4">
        <Link to="/" className={pill}>
          {fridge.length} {fridge.length > 1 ? 'ingrédients' : 'ingrédient'}
          <ChevronDown className="size-4 text-stone-500" aria-hidden="true" />
        </Link>
        <div className={`${pill} relative`}>
          {DIET_LABELS[preferences.diet]}
          <ChevronDown className="size-4 text-stone-500" aria-hidden="true" />
          <select
            aria-label="Régime"
            value={preferences.diet}
            onChange={(event) => updatePreferences({ diet: event.target.value as Diet })}
            className="absolute inset-0 opacity-0"
          >
            {Object.entries(DIET_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        {mealTypes.map((type) => (
          <button key={type} type="button" className={pill} onClick={() => setMealTypes(mealTypes.filter((t) => t !== type))}>
            {MEAL_LABELS[type]} ✕
          </button>
        ))}
      </div>
      <div className="mb-3 grid grid-cols-2 gap-2">
        <button type="button" className={`${pill} justify-center`} onClick={() => setSortByTime(!sortByTime)}>
          <ArrowDownUp className="size-4" aria-hidden="true" />
          {sortByTime ? 'Plus rapide' : 'Pertinence'}
        </button>
        <button
          type="button"
          aria-expanded={showFilters}
          className={`${pill} justify-center`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal className="size-4" aria-hidden="true" />
          Filtres{mealTypes.length > 0 && ` · ${mealTypes.length}`}
        </button>
      </div>
      {showFilters && (
        <div className="mb-4 flex flex-wrap gap-2 rounded-2xl border border-stone-800 bg-stone-900 p-3">
          {MEAL_TYPES.filter((type) => type !== 'drink').map((type) => {
            const active = mealTypes.includes(type)
            return (
              <button
                key={type}
                type="button"
                aria-pressed={active}
                onClick={() => setMealTypes(active ? mealTypes.filter((t) => t !== type) : [...mealTypes, type])}
                className={`rounded-full px-3.5 py-2 text-sm ${active ? 'bg-stone-50 text-stone-950' : 'border border-stone-700 text-stone-300'}`}
              >
                {MEAL_LABELS[type]}
              </button>
            )
          })}
        </div>
      )}

      {all.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-stone-800 bg-stone-900 p-6 text-center">
          <p className="mb-1 text-4xl" aria-hidden="true">🧊</p>
          <p className="mb-4 text-stone-300">
            {fridge.length === 0
              ? 'Ton frigo est vide. Ajoute quelques aliments pour voir des recettes.'
              : 'Pas encore de recette avec ça. Ajoute un ou deux aliments de plus !'}
          </p>
          <Link to="/" className="inline-block rounded-full bg-stone-50 px-5 py-3 font-semibold text-stone-950">
            Remplir mon frigo
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-6 mb-3 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Les plus adaptées</h2>
            <span className="rounded-full border border-stone-800 px-3 py-1 text-xs text-stone-300">Top {top.length}</span>
          </div>
          <div className="no-scrollbar -mx-4 mb-8 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4">
            {top.map((match, index) => (
              <FeaturedCard key={match.recipe.id} match={match} rank={index + 1} />
            ))}
          </div>

          {ready.length > 0 && (
            <section className="mb-6">
              <h2 className="mb-2 text-lg font-semibold">Tu as tout ce qu'il faut</h2>
              <ul>{ready.map((match) => <RecipeRow key={match.recipe.id} match={match} />)}</ul>
            </section>
          )}
          {almost.length > 0 && (
            <section className="mb-6">
              <h2 className="mb-2 text-lg font-semibold">Il te manque presque rien</h2>
              <ul>{almost.map((match) => <RecipeRow key={match.recipe.id} match={match} />)}</ul>
            </section>
          )}
        </>
      )}
    </>
  )
}
