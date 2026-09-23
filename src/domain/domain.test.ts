import { describe, expect, it } from 'vitest'
import { INGREDIENTS, RECIPES } from '../data/catalog.ts'
import { isEligible, recipeTraits } from './diet.ts'
import { addDays, daysLeft, expiryText } from './expiry.ts'
import { indexIngredients, rankAll } from './matching.ts'
import { NO_FILTERS, searchRecipes } from './search.ts'
import { stepKind } from './steps.ts'
import { convert, qtyLabel } from './units.ts'

const byId = indexIngredients(INGREDIENTS)
const recipe = (id: string) => RECIPES.find((r) => r.id === id)!

describe('units', () => {
  it('converts and formats in French', () => {
    expect(convert(250, 'g', 'kg')).toBe(0.25)
    expect(convert(0.5, 'L', 'cl')).toBe(50)
    expect(qtyLabel(1500, 'g')).toBe('1,5 kg')
    expect(qtyLabel(20, 'cl')).toBe('20 cl')
    expect(qtyLabel(150, 'cl')).toBe('1,5 L')
    expect(qtyLabel(3, 'pc')).toBe('3')
  })
})

describe('expiry', () => {
  it('counts days across months', () => {
    expect(addDays('2026-09-29', 3)).toBe('2026-10-02')
    expect(daysLeft('2026-10-02', '2026-09-29')).toBe(3)
    expect(daysLeft(null, '2026-09-29')).toBeNull()
  })
  it('says it like a friend', () => {
    expect(expiryText(0)).toBe("à finir aujourd'hui")
    expect(expiryText(1)).toBe('à finir demain')
    expect(expiryText(2)).toBe("à finir d'ici 2 jours")
    expect(expiryText(5)).toBe('encore 5 jours')
  })
})

describe('diet', () => {
  it('derives traits from ingredients', () => {
    expect(recipeTraits(recipe('r10'), byId)).toMatchObject({ vegetarian: true, vegan: true, pork: false, allergens: ['Gluten'] })
    expect(recipeTraits(recipe('r3'), byId)).toMatchObject({ vegetarian: false, pork: true })
    expect(recipeTraits(recipe('r20'), byId)).toMatchObject({ vegetarian: false, pork: false })
  })
  it('applies diets and allergies strictly', () => {
    const carbonara = recipeTraits(recipe('r3'), byId)
    expect(isEligible(carbonara, { diet: 'Sans porc', allergies: [] })).toBe(false)
    expect(isEligible(carbonara, { diet: 'Tout', allergies: ['Lactose'] })).toBe(false)
    expect(isEligible(carbonara, { diet: 'Tout', allergies: [] })).toBe(true)
  })
})

describe('search', () => {
  const ranked = rankAll(RECIPES, { fridge: {}, prefs: { diet: 'Tout', allergies: [], cuisines: [], portions: 2, ai: true }, byId, today: '2026-09-23' })
  it('finds by recipe or ingredient name, without accents', () => {
    expect(searchRecipes(ranked, 'crepes', NO_FILTERS).map((e) => e.recipe.id)).toEqual(['r12'])
    const chickpeas = searchRecipes(ranked, 'pois chiche', NO_FILTERS)
    expect(chickpeas.map((e) => e.recipe.id)).toContain('r8')
    expect(chickpeas.every((e) => e.recipe.ingredients.some((i) => i.id === 'pois_chiches'))).toBe(true)
  })
  it('applies the filter pills', () => {
    expect(searchRecipes(ranked, '', { ...NO_FILTERS, quick: true }).every((e) => e.recipe.minutes <= 20)).toBe(true)
    expect(searchRecipes(ranked, '', { ...NO_FILTERS, cuisine: 'Mexicaine' }).map((e) => e.recipe.id).sort()).toEqual(['m52870', 'r16', 'r22'])
    expect(searchRecipes(ranked, '', { ...NO_FILTERS, now: true })).toEqual([])
  })
})

describe('stepKind', () => {
  it('picks the illustration from the text', () => {
    expect(stepKind('Préchauffe le four à 180 °C.')).toBe('oven')
    expect(stepKind("Émince l'oignon.")).toBe('cut')
    expect(stepKind('Laisse reposer 15 min.')).toBe('rest')
    expect(stepKind('Cuis les pâtes.')).toBe('pot')
    expect(stepKind('Fais revenir oignon et poivron.')).toBe('pan')
    expect(stepKind('Sers bien frais.')).toBe('plate')
    expect(stepKind('Bats les œufs avec la crème.')).toBe('mix')
  })
})
