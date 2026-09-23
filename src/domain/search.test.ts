import { describe, expect, it } from 'vitest'
import { ingredients } from '../data/seed'
import { normalizeText, searchIngredients } from './search'

const names = (query: string) => searchIngredients(query, ingredients).map((ingredient) => ingredient.name)

describe('normalizeText', () => {
  it('removes accents, ligatures and case', () => {
    expect(normalizeText('Crème Fraîche')).toBe('creme fraiche')
    expect(normalizeText('Œufs')).toBe('oeufs')
  })
})

describe('searchIngredients', () => {
  it('finds by prefix, ignoring accents', () => {
    expect(names('tomat')[0]).toBe('Tomate')
    expect(names('epin')).toContain('Épinards')
  })

  it('handles plurals and aliases', () => {
    expect(names('oeufs')[0]).toBe('Œuf')
    expect(names('patates')).toContain('Pomme de terre')
  })

  it('returns nothing for an empty query', () => {
    expect(searchIngredients('  ', ingredients)).toEqual([])
  })
})
