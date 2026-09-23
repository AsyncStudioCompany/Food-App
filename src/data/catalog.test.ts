import { describe, expect, it } from 'vitest'
import { CUISINES } from '../domain/types.ts'
import { AISLES, INGREDIENTS, RECIPES } from './catalog.ts'

describe('catalog', () => {
  it('has unique ingredient ids in known aisles', () => {
    const ids = INGREDIENTS.map((i) => i.id)
    expect(new Set(ids).size).toBe(ids.length)
    const aisles = AISLES.map(([id]) => id)
    for (const i of INGREDIENTS) {
      expect(aisles).toContain(i.aisle)
      expect(i.defaultQty).toBeGreaterThan(0)
    }
  })

  it('has consistent recipes', () => {
    const ids = new Set(INGREDIENTS.map((i) => i.id))
    expect(new Set(RECIPES.map((r) => r.id)).size).toBe(RECIPES.length)
    for (const r of RECIPES) {
      expect(CUISINES, r.id).toContain(r.cuisine)
      expect(r.steps.length, r.id).toBeGreaterThanOrEqual(2)
      expect(r.photoTerms.length, r.id).toBeGreaterThan(0)
      for (const i of r.ingredients) {
        expect(ids.has(i.id), `${r.id} uses ${i.id}`).toBe(true)
        expect(i.qty).toBeGreaterThan(0)
      }
    }
  })
})
