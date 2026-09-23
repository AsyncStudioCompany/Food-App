import ingredientsJson from '../seed/ingredients.json'
import recipesJson from '../seed/recipes.json'
import { indexIngredients } from '../domain/matching'
import type { Ingredient, Recipe } from '../domain/types'

// Le JSON est vérifié par src/seed/seed.test.ts : le cast est sûr.
export const ingredients = ingredientsJson as Ingredient[]
export const recipes = recipesJson as Recipe[]
export const ingredientIndex = indexIngredients(ingredients)
