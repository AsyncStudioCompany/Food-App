import { describe, expect, it } from 'vitest'
import { INGREDIENTS } from '../data/catalog.ts'
import { pantrySpice, pantrySpices } from './pantry.ts'

describe('pantry', () => {
  it('names the catalog spice of a pantry line', () => {
    expect(pantrySpice("huile d'olive")).toBe('huile_olive')
    expect(pantrySpice('huile de tournesol')).toBe('huile')
    expect(pantrySpice('graines de cumin')).toBe('cumin')
    expect(pantrySpice('Sucre roux')).toBe('sucre')
    expect(pantrySpice('sucre glace')).toBeNull()
    expect(pantrySpice('poivre du Sichuan')).toBeNull()
    expect(pantrySpice('cube de bouillon de volaille')).toBe('bouillon')
    expect(pantrySpice('Concentré de tomate')).toBe('concentre_tomate')
    expect(pantrySpice('thym')).toBeNull()
  })
  it('lists the spices of a recipe once, all in the catalog', () => {
    const ids = pantrySpices(['sel', 'poivre', "huile d'olive", 'cumin', 'graines de cumin', 'persil'])
    expect(ids).toEqual(['sel', 'poivre', 'huile_olive', 'cumin'])
    const spices = new Set(INGREDIENTS.filter((i) => i.aisle === 'epices').map((i) => i.id))
    expect(ids.every((id) => spices.has(id))).toBe(true)
  })
})
