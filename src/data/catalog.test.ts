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
      expect(r.servings, r.id).toBeGreaterThanOrEqual(1)
      expect(r.minutes, r.id).toBeGreaterThan(0)
      for (const i of r.ingredients) {
        expect(ids.has(i.id), `${r.id} uses ${i.id}`).toBe(true)
        expect(i.qty).toBeGreaterThan(0)
      }
    }
  })

  it('imports TheMealDB recipes with their own photo', () => {
    const imported = RECIPES.filter((r) => r.source)
    expect(imported.length).toBeGreaterThanOrEqual(60)
    for (const r of imported) {
      expect(r.id).toBe('m' + r.source!.id)
      expect(r.photoUrl).toMatch(/^https:\/\/www\.themealdb\.com\/images\/media\/meals\/.+\.jpg$/)
    }
    const photos = imported.map((r) => r.photoUrl)
    expect(new Set(photos).size).toBe(photos.length)
  })

  it('gives every house recipe a checked photo, credited when needed', () => {
    const house = RECIPES.filter((r) => !r.source)
    // r14: no photo found that shows this dish, so it keeps the striped background.
    expect(house.filter((r) => !r.photoUrl).map((r) => r.id)).toEqual(['r14'])
    for (const r of house.filter((x) => x.photoUrl && !x.photoUrl.includes('themealdb.com'))) {
      expect(r.photoCredit, r.id).toMatchObject({ author: expect.any(String), license: expect.any(String), url: expect.stringMatching(/^https:/) })
    }
    const urls = RECIPES.map((r) => r.photoUrl).filter(Boolean)
    expect(new Set(urls).size).toBe(urls.length)
  })
})
