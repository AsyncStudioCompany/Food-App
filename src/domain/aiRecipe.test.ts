import { describe, expect, it } from 'vitest'
import { INGREDIENTS } from '../data/catalog.ts'
import { checkDraft, draftToRecipe, fridgeSnapshot, type AiRecipeDraft } from './aiRecipe.ts'
import { indexIngredients } from './matching.ts'
import type { Prefs } from './types.ts'

const byId = indexIngredients(INGREDIENTS)
const prefs: Prefs = { diet: 'Tout', allergies: [], cuisines: [], portions: 2, ai: true, goal: 'Équilibré', onboarded: true, location: null }
const draft: AiRecipeDraft = {
  name: 'Omelette aux épinards',
  cuisine: 'Française',
  course: 'Plat',
  minutes: 10,
  servings: 2,
  ingredients: [
    { id: 'oeufs', qty: 4 },
    { id: 'epinards', qty: 100 },
  ],
  steps: ['Bats les œufs.', 'Fais tomber les épinards à la poêle, verse les œufs.'],
  photoQuery: 'omelette',
}

describe('checkDraft', () => {
  it('accepts a valid draft', () => {
    expect(checkDraft(draft, byId, prefs)).toEqual([])
  })
  it('rejects ingredients outside the catalog and duplicates', () => {
    const bad = { ...draft, ingredients: [{ id: 'truffe', qty: 1 }, { id: 'oeufs', qty: 2 }, { id: 'oeufs', qty: 2 }] }
    expect(checkDraft(bad, byId, prefs)).toEqual(['Ingrédient hors catalogue : truffe.', 'Ingrédient en double : oeufs.'])
  })
  it('rejects a draft that breaks the diet or allergies', () => {
    expect(checkDraft(draft, byId, { ...prefs, diet: 'Vegan' })).toEqual(['La recette ne respecte pas le régime ou les allergies.'])
    expect(checkDraft(draft, byId, { ...prefs, allergies: ['Œufs'] })).toHaveLength(1)
  })
})

describe('draftToRecipe', () => {
  it('builds a generated recipe', () => {
    expect(draftToRecipe(draft, 'ia-1')).toMatchObject({ id: 'ia-1', generated: true, photoTerms: ['omelette'], servings: 2 })
  })
})

describe('fridgeSnapshot', () => {
  it('sends base quantities and days left', () => {
    expect(fridgeSnapshot({ lait: { qty: 0.5, unit: 'L', expiresOn: '2026-09-25' } }, '2026-09-23')).toEqual([{ id: 'lait', qty: 50, days: 2 }])
  })
})
