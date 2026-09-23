import { describe, expect, it } from 'vitest'
import { ingredientIndex, ingredients, recipes } from '../data/seed'
import { consumeRecipe } from './consume'
import { matchRecipe } from './matching'
import { defaultPreferences } from './preferences'
import type { FridgeItem } from './types'

const omelette = recipes.find((recipe) => recipe.id === 'omelette')!
const prefs = defaultPreferences(ingredients)
const item = (ingredientId: string, quantity?: number, unit?: FridgeItem['unit']): FridgeItem => ({
  id: ingredientId,
  ingredientId,
  quantity,
  unit,
  addedAt: '2026-09-20',
})

describe('consumeRecipe', () => {
  it('subtracts used quantities, converting units, and removes emptied items', () => {
    const fridge = [item('egg', 6, 'piece'), item('mushroom', 0.1, 'kg'), item('butter', 250, 'g'), item('milk', 1, 'l')]
    const match = matchRecipe(omelette, fridge, ingredientIndex, prefs)
    const after = consumeRecipe(fridge, match, ingredientIndex)
    expect(after.find((i) => i.ingredientId === 'egg')?.quantity).toBe(3)
    expect(after.find((i) => i.ingredientId === 'mushroom')).toBeUndefined()
    expect(after.find((i) => i.ingredientId === 'butter')?.quantity).toBe(240)
    expect(after.find((i) => i.ingredientId === 'milk')?.quantity).toBe(1)
  })

  it('keeps items without a known quantity', () => {
    const fridge = [item('egg'), item('mushroom', 100, 'g'), item('butter', 10, 'g')]
    const match = matchRecipe(omelette, fridge, ingredientIndex, prefs)
    const after = consumeRecipe(fridge, match, ingredientIndex)
    expect(after.map((i) => i.ingredientId)).toEqual(['egg'])
  })
})
