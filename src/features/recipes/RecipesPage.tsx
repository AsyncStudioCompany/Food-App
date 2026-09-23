import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { AppHeader } from '../../components/AppHeader'
import { RecipeVisual } from '../../components/RecipeVisual'
import { ingredientIndex, recipes } from '../../data/seed'
import { normalizeText } from '../../domain/search'
import { CUISINE_LABELS, DIFFICULTY_LABELS, formatMinutes } from './labels'

function searchableText(recipeId: string): string {
  const recipe = recipes.find((candidate) => candidate.id === recipeId)!
  const names = recipe.ingredients.map((line) => ingredientIndex.get(line.ingredientId)?.name ?? '')
  return normalizeText([recipe.title, ...names].join(' '))
}

export function RecipesPage() {
  const [query, setQuery] = useState('')
  const index = useMemo(() => new Map(recipes.map((recipe) => [recipe.id, searchableText(recipe.id)])), [])
  const words = normalizeText(query).split(' ').filter(Boolean)
  const shown = recipes.filter((recipe) => words.every((word) => index.get(recipe.id)!.includes(word)))

  return (
    <>
      <AppHeader />
      <h1 className="mb-4 text-3xl font-semibold tracking-tight">
        Recherche <span className="text-stone-500">parmi {recipes.length} recettes.</span>
      </h1>
      <div className="relative mb-5">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-stone-500" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Une recette, un ingrédient…"
          aria-label="Rechercher une recette"
          className="w-full rounded-full border border-stone-800 bg-stone-900 py-3 pr-4 pl-11 text-stone-100 placeholder:text-stone-500"
        />
      </div>
      {shown.length === 0 && <p className="text-stone-400">Aucune recette ne correspond.</p>}
      <ul className="grid gap-1">
        {shown.map((recipe) => (
          <li key={recipe.id}>
            <Link to={`/recette/${recipe.id}`} className="flex items-center gap-3 rounded-2xl p-2 active:bg-stone-900">
              <RecipeVisual recipe={recipe} className="size-16 shrink-0 rounded-2xl" emojiClassName="text-3xl" />
              <div className="min-w-0">
                <h2 className="font-semibold">{recipe.title}</h2>
                <p className="font-mono text-xs text-stone-400">
                  {formatMinutes(recipe.prepMinutes + recipe.cookMinutes)} · {DIFFICULTY_LABELS[recipe.difficulty]}
                  {recipe.cuisine && ` · ${CUISINE_LABELS[recipe.cuisine]}`}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
