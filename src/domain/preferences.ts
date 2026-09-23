import type { Ingredient, UserPreferences } from './types'

/** Préférences d'un nouvel utilisateur : aucune contrainte, placard de base par défaut. */
export function defaultPreferences(ingredients: Ingredient[]): UserPreferences {
  return {
    diet: 'omnivore',
    excludePork: false,
    allergens: [],
    excludedIngredientIds: [],
    pantryStapleIds: ingredients.filter((ingredient) => ingredient.isPantryStaple).map((ingredient) => ingredient.id),
    favoriteCuisines: [],
    favoriteTags: [],
    lovedIngredientIds: [],
  }
}
