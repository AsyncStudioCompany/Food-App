import type { Recipe } from '../domain/types'

const GRADIENTS = [
  'from-amber-700 to-orange-950',
  'from-rose-700 to-red-950',
  'from-emerald-700 to-teal-950',
  'from-lime-700 to-green-950',
  'from-sky-700 to-indigo-950',
  'from-fuchsia-700 to-purple-950',
  'from-yellow-600 to-amber-950',
  'from-orange-600 to-rose-950',
]

function hash(text: string): number {
  let value = 0
  for (const char of text) value = (value * 31 + char.charCodeAt(0)) >>> 0
  return value
}

/** Photo de la recette, ou à défaut un dégradé avec son emoji. */
export function RecipeVisual({ recipe, className = '', emojiClassName = 'text-6xl' }: {
  recipe: Recipe
  className?: string
  emojiClassName?: string
}) {
  if (recipe.imageUrl) {
    return <img src={recipe.imageUrl} alt="" className={`object-cover ${className}`} loading="lazy" />
  }
  return (
    <div
      aria-hidden="true"
      className={`flex items-center justify-center bg-gradient-to-br ${GRADIENTS[hash(recipe.id) % GRADIENTS.length]} ${className}`}
    >
      <span className={`drop-shadow-lg ${emojiClassName}`}>{recipe.emoji ?? '🍽️'}</span>
    </div>
  )
}
