import { describe, expect, it } from 'vitest'
import { ingredients, recipes } from '../data/seed'
import { ALLERGENS, CUISINES, INGREDIENT_CATEGORIES, MEAL_TYPES, UNITS } from '../domain/types'

describe('ingredients seed', () => {
  const ids = new Set(ingredients.map((ingredient) => ingredient.id))

  it('has unique ids', () => {
    expect(ids.size).toBe(ingredients.length)
  })

  it.each(ingredients)('$id is valid', (ingredient) => {
    expect(INGREDIENT_CATEGORIES).toContain(ingredient.category)
    expect(UNITS).toContain(ingredient.defaultUnit)
    for (const allergen of ingredient.allergens) expect(ALLERGENS).toContain(allergen)
    if (ingredient.parentId) expect(ids.has(ingredient.parentId)).toBe(true)
    if (ingredient.dietFlags.isPork) expect(ingredient.dietFlags.isMeat).toBe(true)
    if (ingredient.dietFlags.isMeat || ingredient.dietFlags.isFish) {
      expect(ingredient.dietFlags.isAnimalProduct).toBe(true)
    }
  })
})

describe('recipes seed', () => {
  const ingredientIds = new Set(ingredients.map((ingredient) => ingredient.id))

  it('has unique ids', () => {
    expect(new Set(recipes.map((recipe) => recipe.id)).size).toBe(recipes.length)
  })

  it.each(recipes)('$id is valid', (recipe) => {
    expect(recipe.servings).toBeGreaterThan(0)
    expect(recipe.steps.length).toBeGreaterThan(0)
    expect(recipe.ingredients.length).toBeGreaterThan(0)
    for (const mealType of recipe.mealType) expect(MEAL_TYPES).toContain(mealType)
    if (recipe.cuisine) expect(CUISINES).toContain(recipe.cuisine)
    for (const line of recipe.ingredients) {
      expect(ingredientIds.has(line.ingredientId), line.ingredientId).toBe(true)
      if (line.unit) expect(UNITS).toContain(line.unit)
      if (line.quantity !== undefined) expect(line.quantity).toBeGreaterThan(0)
    }
  })
})
