import { describe, expect, it } from 'vitest'
import { ingredientIndex, ingredients, recipes } from '../data/seed'
import { exclusionReasons, matchRecipe, matchRecipes } from './matching'
import { defaultPreferences } from './preferences'
import type { FridgeItem, Recipe, Unit, UserPreferences } from './types'

const TODAY = new Date(2026, 8, 23)

function item(ingredientId: string, quantity?: number, unit?: Unit, expiresOn?: string): FridgeItem {
  return { id: `${ingredientId}-${quantity}`, ingredientId, quantity, unit, expiresOn, addedAt: '2026-09-20' }
}

function prefs(overrides: Partial<UserPreferences> = {}): UserPreferences {
  return { ...defaultPreferences(ingredients), ...overrides }
}

function recipe(id: string): Recipe {
  const found = recipes.find((candidate) => candidate.id === id)
  if (!found) throw new Error(`recette inconnue : ${id}`)
  return found
}

const omelette = recipe('omelette') // 3 œufs, 100 g champignons, beurre, ciboulette (optionnelle), sel, poivre

describe('matchRecipe', () => {
  it('is ready when every required ingredient is in stock in sufficient quantity', () => {
    const fridge = [item('egg', 6, 'piece'), item('mushroom', 250, 'g'), item('butter', 250, 'g')]
    const match = matchRecipe(omelette, fridge, ingredientIndex, prefs(), { today: TODAY })
    expect(match.group).toBe('ready')
    expect(match.coverage).toBe(1)
    expect(match.missing).toHaveLength(0)
  })

  it('ignores pantry staples and optional ingredients', () => {
    const fridge = [item('egg', 6, 'piece'), item('mushroom', 250, 'g'), item('butter', 250, 'g')]
    const match = matchRecipe(omelette, fridge, ingredientIndex, prefs(), { today: TODAY })
    const salt = match.checks.find((check) => check.line.ingredientId === 'salt')
    const chives = match.checks.find((check) => check.line.ingredientId === 'chives')
    expect(salt?.isPantryStaple).toBe(true)
    expect(chives?.status).toBe('missing')
    expect(match.group).toBe('ready')
  })

  it('flags an insufficient quantity and computes partial coverage', () => {
    const fridge = [item('egg', 2, 'piece'), item('mushroom', 250, 'g'), item('butter', 250, 'g')]
    const match = matchRecipe(omelette, fridge, ingredientIndex, prefs(), { today: TODAY })
    const eggs = match.checks.find((check) => check.line.ingredientId === 'egg')
    expect(eggs).toMatchObject({ status: 'insufficient', needed: 3, available: 2 })
    expect(match.group).toBe('almost')
    expect(match.coverage).toBeCloseTo((2 / 3 + 1 + 1) / 3)
  })

  it('adds up several fridge items and converts their units', () => {
    const fridge = [item('egg', 60, 'g'), item('egg', 2, 'piece'), item('mushroom', 0.1, 'kg'), item('butter', 10, 'g')]
    const match = matchRecipe(omelette, fridge, ingredientIndex, prefs(), { today: TODAY })
    expect(match.group).toBe('ready')
  })

  it('scales the needed quantities with the number of servings', () => {
    const fridge = [item('egg', 4, 'piece'), item('mushroom', 250, 'g'), item('butter', 250, 'g')]
    const forOne = matchRecipe(omelette, fridge, ingredientIndex, prefs(), { today: TODAY })
    const forTwo = matchRecipe(omelette, fridge, ingredientIndex, prefs(), { today: TODAY, servings: 2 })
    expect(forOne.group).toBe('ready')
    expect(forTwo.insufficient.map((check) => check.line.ingredientId)).toEqual(['egg'])
    expect(forTwo.insufficient[0].needed).toBe(6)
  })

  it('treats an unknown quantity as available', () => {
    const fridge = [item('egg'), item('mushroom', 250, 'g'), item('butter', 250, 'g')]
    const match = matchRecipe(omelette, fridge, ingredientIndex, prefs(), { today: TODAY })
    expect(match.group).toBe('ready')
  })

  it('treats a non convertible quantity as available', () => {
    // Pas de poids moyen pour « fromage » : 4 tranches ne se comparent pas à des grammes.
    const burger = recipe('burger')
    const fridge = [
      item('burger_bun', 4, 'piece'),
      item('ground_beef', 500, 'g'),
      item('emmental', 20, 'g'),
      item('tomato', 1, 'piece'),
      item('lettuce', 1, 'piece'),
      item('red_onion', 1, 'piece'),
      item('ketchup', 200, 'ml'),
    ]
    const match = matchRecipe(burger, fridge, ingredientIndex, prefs(), { today: TODAY })
    expect(match.checks.find((check) => check.line.ingredientId === 'cheese')?.status).toBe('enough')
    expect(match.group).toBe('ready')
  })

  it('lets a more specific fridge ingredient satisfy a general one', () => {
    // La recette demande « poulet », le frigo contient des blancs de poulet.
    const roast = recipe('roast_chicken')
    const fridge = [item('chicken_breast', 1500, 'g'), item('potato', 1, 'kg'), item('garlic', 10, 'piece'), item('butter', 100, 'g')]
    const match = matchRecipe(roast, fridge, ingredientIndex, prefs(), { today: TODAY })
    expect(match.missing).toHaveLength(0)
  })

  it('does not treat a specific ingredient as a pantry staple because its parent is one', () => {
    const crumble = recipe('apple_crumble') // sucre roux, enfant de « sucre » (placard)
    const match = matchRecipe(crumble, [], ingredientIndex, prefs(), { today: TODAY })
    expect(match.missing.map((check) => check.line.ingredientId)).toContain('brown_sugar')
  })

  it('groups recipes with more than two issues as other', () => {
    const match = matchRecipe(recipe('bolognese'), [], ingredientIndex, prefs(), { today: TODAY })
    expect(match.group).toBe('other')
    expect(match.coverage).toBe(0)
  })

  it('rewards ingredients that expire soon', () => {
    const base = [item('mushroom', 250, 'g'), item('butter', 250, 'g')]
    const fresh = matchRecipe(omelette, [...base, item('egg', 6, 'piece', '2026-10-15')], ingredientIndex, prefs(), { today: TODAY })
    const expiring = matchRecipe(omelette, [...base, item('egg', 6, 'piece', '2026-09-25')], ingredientIndex, prefs(), { today: TODAY })
    expect(expiring.expiringUsed).toEqual(['egg'])
    expect(expiring.score).toBeGreaterThan(fresh.score)
  })

  it('rewards favorite cuisines, tags and loved ingredients, and penalizes long recipes', () => {
    const neutral = matchRecipe(omelette, [], ingredientIndex, prefs(), { today: TODAY })
    const liked = matchRecipe(
      omelette,
      [],
      ingredientIndex,
      prefs({ favoriteCuisines: ['french'], favoriteTags: ['quick'], lovedIngredientIds: ['mushroom'] }),
      { today: TODAY },
    )
    const tooLong = matchRecipe(omelette, [], ingredientIndex, prefs({ maxTotalMinutes: 5 }), { today: TODAY })
    expect(liked.score).toBeGreaterThan(neutral.score)
    expect(tooLong.score).toBeLessThan(neutral.score)
  })
})

describe('exclusionReasons', () => {
  it('excludes recipes containing an allergen', () => {
    expect(exclusionReasons(omelette, ingredientIndex, prefs({ allergens: ['eggs'] }))).toEqual(['allergen:eggs'])
  })

  it('applies diets', () => {
    const carbonara = recipe('pasta_carbonara')
    expect(exclusionReasons(carbonara, ingredientIndex, prefs({ diet: 'vegetarian' }))).toContain('diet:vegetarian')
    expect(exclusionReasons(carbonara, ingredientIndex, prefs({ excludePork: true }))).toContain('diet:pork')
    expect(exclusionReasons(omelette, ingredientIndex, prefs({ diet: 'vegetarian' }))).toEqual([])
    expect(exclusionReasons(omelette, ingredientIndex, prefs({ diet: 'vegan' }))).toContain('diet:vegan')
    expect(exclusionReasons(recipe('salmon_papillote'), ingredientIndex, prefs({ diet: 'pescatarian' }))).toEqual([])
  })

  it('excludes disliked ingredients and their variants', () => {
    // Exclure « fromage » exclut aussi le parmesan.
    expect(exclusionReasons(recipe('pasta_carbonara'), ingredientIndex, prefs({ excludedIngredientIds: ['cheese'] }))).toEqual([
      'excluded:parmesan',
    ])
  })

  it('ignores optional ingredients', () => {
    // Les merguez du couscous sont optionnelles : la recette reste végétarienne.
    expect(exclusionReasons(recipe('couscous_veg'), ingredientIndex, prefs({ diet: 'vegetarian' }))).toEqual([])
  })
})

describe('matchRecipes', () => {
  it('filters excluded recipes and sorts by score', () => {
    const fridge = [item('egg', 6, 'piece'), item('mushroom', 250, 'g'), item('butter', 250, 'g')]
    const matches = matchRecipes(recipes, fridge, ingredientIndex, prefs({ diet: 'vegetarian' }), { today: TODAY })
    expect(matches.some((match) => match.recipe.id === 'pasta_carbonara')).toBe(false)
    expect(matches[0].recipe.id).toBe('omelette')
    for (let i = 1; i < matches.length; i++) expect(matches[i - 1].score).toBeGreaterThanOrEqual(matches[i].score)
  })
})
