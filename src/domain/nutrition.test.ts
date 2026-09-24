import { describe, expect, it } from 'vitest'
import { INGREDIENTS, RECIPES } from '../data/catalog.ts'
import { indexIngredients, rankAll } from './matching.ts'
import { goalBonus, goalLabel, recipeNutrition } from './nutrition.ts'
import type { Prefs } from './types.ts'

const byId = indexIngredients(INGREDIENTS)
const recipe = (id: string) => RECIPES.find((r) => r.id === id)!

describe('nutrition', () => {
  it('estimates one portion from the ingredients', () => {
    // Œufs brouillés crémeux for 2: 3 eggs (165 g) + 5 cl of cream.
    const n = recipeNutrition(recipe('r15'), byId)
    expect(n.kcal).toBe(Math.round((165 * 1.43 + 50 * 2.92) / 2))
    expect(n.protein).toBe(Math.round((165 * 0.126 + 50 * 0.024) / 2))
  })

  it('rewards what fits the goal, within bounds', () => {
    const rich = { kcal: 800, protein: 45, carbs: 60, fat: 30 }
    const light = { kcal: 300, protein: 25, carbs: 30, fat: 8 }
    expect(goalBonus('Équilibré', rich)).toBe(0)
    expect(goalBonus('Prise de masse', rich)).toBeGreaterThan(goalBonus('Prise de masse', light))
    expect(goalBonus('Perte de poids', light)).toBeGreaterThan(goalBonus('Perte de poids', rich))
    expect(goalBonus('Protéines', rich)).toBe(30)
    for (const n of [rich, light]) for (const g of ['Prise de masse', 'Protéines', 'Perte de poids'] as const) expect(Math.abs(goalBonus(g, n))).toBeLessThan(40)
    expect(goalLabel('Protéines', rich)).toBe('45 g de protéines')
    expect(goalLabel('Perte de poids', light)).toBe('300 kcal')
  })

  it('reorders recipes by goal without hiding any', () => {
    const prefs = (goal: Prefs['goal']): Prefs => ({ diet: 'Tout', allergies: [], cuisines: [], portions: 2, ai: true, goal, onboarded: true, location: null })
    // Everything in the fridge: every recipe is doable, so the goal decides the order.
    const fridge = Object.fromEntries(INGREDIENTS.map((i) => [i.id, { qty: 10_000, unit: i.unit, expiresOn: null }]))
    const ctx = (goal: Prefs['goal']) => ({ fridge, prefs: prefs(goal), byId, today: '2026-09-23' })
    const balanced = rankAll(RECIPES, ctx('Équilibré'))
    const protein = rankAll(RECIPES, ctx('Protéines'))
    expect(protein).toHaveLength(balanced.length)
    const avg = (list: typeof protein) => list.slice(0, 10).reduce((s, e) => s + e.nutrition.protein, 0) / 10
    expect(avg(protein)).toBeGreaterThan(avg(balanced))
    const kcal = (list: typeof protein) => list.slice(0, 10).reduce((s, e) => s + e.nutrition.kcal, 0) / 10
    expect(kcal(rankAll(RECIPES, ctx('Perte de poids')))).toBeLessThan(kcal(rankAll(RECIPES, ctx('Prise de masse'))))
  })

  it('has values for every catalog ingredient', () => {
    for (const i of INGREDIENTS) {
      expect(i.nutrition, i.id).toBeDefined()
      if (i.unit === 'pc') expect(i.nutrition!.g, i.id).toBeGreaterThan(0)
    }
  })
})
