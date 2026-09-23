import type { Goal, Ingredient, Recipe } from './types.ts'

export interface Nutrition {
  kcal: number
  protein: number
  carbs: number
  fat: number
}

/** Weight in grams of a quantity in the ingredient's base unit (1 cl ≈ 10 g). */
export function grams(qty: number, ing: Ingredient): number {
  if (ing.unit === 'g') return qty
  if (ing.unit === 'cl') return qty * 10
  return qty * (ing.nutrition?.g ?? 100)
}

/** Estimated nutrition of one portion (pantry items such as oil are not counted). */
export function recipeNutrition(recipe: Recipe, byId: Map<string, Ingredient>): Nutrition {
  const total = { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  for (const ri of recipe.ingredients) {
    const ing = byId.get(ri.id)
    if (!ing?.nutrition) continue
    const f = grams(ri.qty, ing) / 100
    const [kcal, protein, carbs, fat] = ing.nutrition.per100
    total.kcal += kcal * f
    total.protein += protein * f
    total.carbs += carbs * f
    total.fat += fat * f
  }
  const n = recipe.servings
  return { kcal: Math.round(total.kcal / n), protein: Math.round(total.protein / n), carbs: Math.round(total.carbs / n), fat: Math.round(total.fat / n) }
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

/**
 * Ranking bonus for the user's goal. It only reorders recipes (up to about ±35 points,
 * less than one missing ingredient, which costs 100): the goal never hides a recipe.
 */
export function goalBonus(goal: Goal, n: Nutrition): number {
  switch (goal) {
    case 'Prise de masse':
      return clamp((n.kcal - 500) / 10, -20, 25) + clamp((n.protein - 20) / 2, -5, 10)
    case 'Protéines':
      return clamp((n.protein - 20) * 1.2, -15, 30)
    case 'Perte de poids':
      return clamp((550 - n.kcal) / 10, -25, 25) + clamp((n.protein - 20) / 3, 0, 8)
    default:
      return 0
  }
}

/** Short label of what matters for the goal, shown in recipe lists. */
export function goalLabel(goal: Goal, n: Nutrition): string | null {
  if (goal === 'Protéines' || goal === 'Prise de masse') return `${n.protein} g de protéines`
  if (goal === 'Perte de poids') return `${n.kcal} kcal`
  return null
}
