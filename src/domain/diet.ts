import type { Allergen, Ingredient, Prefs, Recipe } from './types.ts'

export interface RecipeTraits {
  vegetarian: boolean
  vegan: boolean
  pork: boolean
  allergens: Allergen[]
}

/** Diet and allergens of a recipe, derived from its ingredients. */
export function recipeTraits(recipe: Recipe, byId: Map<string, Ingredient>): RecipeTraits {
  const ings = recipe.ingredients.map((i) => byId.get(i.id)).filter((i): i is Ingredient => !!i)
  const kinds = new Set(ings.map((i) => i.animal))
  const vegetarian = !kinds.has('pork') && !kinds.has('meat') && !kinds.has('fish')
  const allergens = [...new Set(ings.flatMap((i) => i.allergens ?? []))]
  return {
    vegetarian,
    vegan: vegetarian && !kinds.has('dairy') && !kinds.has('egg'),
    pork: kinds.has('pork'),
    allergens,
  }
}

/** Diets and allergies are strict filters. */
export function isEligible(traits: RecipeTraits, prefs: Pick<Prefs, 'diet' | 'allergies'>): boolean {
  if (prefs.diet === 'Végétarien' && !traits.vegetarian) return false
  if (prefs.diet === 'Vegan' && !traits.vegan) return false
  if (prefs.diet === 'Sans porc' && traits.pork) return false
  return !traits.allergens.some((a) => prefs.allergies.includes(a))
}

/** " · Vegan" / " · Végétarien" suffix of the recipe meta line. */
export const dietSuffix = (t: RecipeTraits) => (t.vegan ? ' · Vegan' : t.vegetarian ? ' · Végétarien' : '')
