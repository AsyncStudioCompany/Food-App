import { describe, expect, it } from 'vitest'
import { INGREDIENTS, RECIPES } from '../data/catalog.ts'
import { cook, evaluate, indexIngredients, rankAll, suggest, type MatchContext } from './matching.ts'
import type { Fridge, Prefs } from './types.ts'

const byId = indexIngredients(INGREDIENTS)
const TODAY = '2026-09-23'
const prefs: Prefs = { diet: 'Tout', allergies: [], cuisines: [], portions: 2, ai: true, goal: 'Équilibré', onboarded: true, location: null, avoid: [] }
const ctx = (fridge: Fridge, p: Partial<Prefs> = {}): MatchContext => ({ fridge, prefs: { ...prefs, ...p }, byId, today: TODAY })
const recipe = (id: string) => RECIPES.find((r) => r.id === id)!

describe('evaluate', () => {
  it('marks each ingredient ok, partial or missing', () => {
    const e = evaluate(recipe('r1'), 2, ctx({ oeufs: { qty: 6, unit: 'pc', expiresOn: null }, champignons: { qty: 100, unit: 'g', expiresOn: null } }))
    expect(e.items.map((i) => [i.ingredient.id, i.status])).toEqual([
      ['oeufs', 'ok'],
      ['champignons', 'partial'],
      ['oignon', 'missing'],
    ])
    expect(e.missing).toHaveLength(2)
  })

  it('scales the need with portions and converts units', () => {
    const fridge: Fridge = { pates: { qty: 0.3, unit: 'kg', expiresOn: null }, ail: { qty: 4, unit: 'pc', expiresOn: null }, citron: { qty: 2, unit: 'pc', expiresOn: null } }
    expect(evaluate(recipe('r10'), 2, ctx(fridge)).missing).toHaveLength(0)
    const four = evaluate(recipe('r10'), 4, ctx(fridge))
    expect(four.items[0]).toMatchObject({ need: 400, have: 300, status: 'partial' })
  })

  it('rounds pieces up to the half', () => {
    const e = evaluate(recipe('m53327'), 2, ctx({})) // 2 onions for 3 servings
    expect(e.items.find((i) => i.ingredient.id === 'oignon')!.need).toBe(1.5)
    expect(evaluate(recipe('r1'), 2, ctx({})).items[0].need).toBe(3)
  })

  it('counts soon-to-expire food as saved and ranks it higher', () => {
    const fresh = evaluate(recipe('r15'), 2, ctx({ oeufs: { qty: 6, unit: 'pc', expiresOn: '2026-10-10' }, creme: { qty: 20, unit: 'cl', expiresOn: '2026-10-10' } }))
    const soon = evaluate(recipe('r15'), 2, ctx({ oeufs: { qty: 6, unit: 'pc', expiresOn: '2026-09-24' }, creme: { qty: 20, unit: 'cl', expiresOn: '2026-10-10' } }))
    expect(soon.saving.map((i) => i.ingredient.id)).toEqual(['oeufs'])
    expect(soon.score).toBeGreaterThan(fresh.score)
  })
})

describe('rankAll and suggest', () => {
  const fridge: Fridge = {
    oeufs: { qty: 6, unit: 'pc', expiresOn: null },
    champignons: { qty: 250, unit: 'g', expiresOn: null },
    creme: { qty: 20, unit: 'cl', expiresOn: null },
    pates: { qty: 500, unit: 'g', expiresOn: null },
    oignon: { qty: 2, unit: 'pc', expiresOn: null },
  }

  it('excludes recipes that break the diet or allergies', () => {
    const ids = rankAll(RECIPES, ctx(fridge, { diet: 'Végétarien' })).map((e) => e.recipe.id)
    expect(ids).not.toContain('r3') // carbonara, lardons
    expect(ids).not.toContain('r17') // poulet
    const noEggs = rankAll(RECIPES, ctx(fridge, { allergies: ['Œufs'] })).map((e) => e.recipe.id)
    expect(noEggs).not.toContain('r1')
  })

  it('puts doable recipes first, favorite cuisines break ties', () => {
    const ranked = rankAll(RECIPES, ctx(fridge, { cuisines: ['Italienne'] }))
    const { top, complete, almost, doable } = suggest(ranked)
    expect(top).toHaveLength(3)
    expect(top.every((e) => e.missing.length === 0)).toBe(true)
    expect(top[0].recipe.id).toBe('r2')
    expect(doable.every((e) => e.missing.length <= 2)).toBe(true)
    expect([...top, ...complete, ...almost]).toHaveLength(doable.length)
  })

  it('hides recipes with an ingredient to avoid', () => {
    const all = rankAll(RECIPES, ctx(fridge)).map((e) => e.recipe)
    expect(all.some((r) => r.ingredients.some((i) => i.id === 'champignons'))).toBe(true)
    const without = rankAll(RECIPES, ctx(fridge, { avoid: ['champignons', 'lardons'] })).map((e) => e.recipe)
    expect(without.length).toBeGreaterThan(0)
    expect(without.some((r) => r.ingredients.some((i) => i.id === 'champignons' || i.id === 'lardons'))).toBe(false)
  })

  it('suggests nothing with an empty fridge, and only recipes that use the fridge', () => {
    expect(suggest(rankAll(RECIPES, ctx({}))).doable).toEqual([])
    const { doable } = suggest(rankAll(RECIPES, ctx({ pates: { qty: 500, unit: 'g', expiresOn: null } })))
    expect(doable.length).toBeGreaterThan(0)
    expect(doable.every((e) => e.items.some((i) => i.ingredient.id === 'pates'))).toBe(true)
  })

  it('fills the top 3 with almost-doable recipes when needed', () => {
    const { top } = suggest(rankAll(RECIPES, ctx({ pates: { qty: 500, unit: 'g', expiresOn: null } })))
    expect(top.length).toBe(3)
    expect(top.some((e) => e.missing.length > 0)).toBe(true)
  })
})

describe('cook', () => {
  it('takes the used quantities out of the fridge and reports saved food', () => {
    const fridge: Fridge = {
      oeufs: { qty: 6, unit: 'pc', expiresOn: '2026-09-25' },
      creme: { qty: 0.1, unit: 'L', expiresOn: null },
    }
    const e = evaluate(recipe('r15'), 2, ctx(fridge))
    const res = cook(e, fridge)
    expect(res.fridge.oeufs.qty).toBe(3)
    expect(res.fridge.creme).toEqual({ qty: 0.05, unit: 'L', expiresOn: null })
    expect(res.used).toBe(2)
    expect(res.saved.map((i) => i.id)).toEqual(['oeufs'])
  })

  it('removes what is used up', () => {
    const fridge: Fridge = { oeufs: { qty: 3, unit: 'pc', expiresOn: null }, creme: { qty: 5, unit: 'cl', expiresOn: null } }
    expect(cook(evaluate(recipe('r15'), 2, ctx(fridge)), fridge).fridge).toEqual({})
  })
})
