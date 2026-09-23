import { PageHeader } from '../../components/PageHeader'
import { recipes } from '../../data/seed'
import { CUISINE_LABELS, DIFFICULTY_LABELS, formatMinutes } from './labels'

export function RecipesPage() {
  return (
    <>
      <PageHeader title="Recettes" subtitle={`${recipes.length} recettes à découvrir.`} />
      <ul className="grid gap-3 sm:grid-cols-2">
        {recipes.map((recipe) => (
          <li key={recipe.id} className="rounded-xl bg-white p-4 shadow-sm">
            <h2 className="font-semibold">{recipe.title}</h2>
            <p className="mt-1 text-sm text-stone-600">
              {formatMinutes(recipe.prepMinutes + recipe.cookMinutes)} · {DIFFICULTY_LABELS[recipe.difficulty]}
              {recipe.cuisine && ` · ${CUISINE_LABELS[recipe.cuisine]}`}
            </p>
          </li>
        ))}
      </ul>
    </>
  )
}
