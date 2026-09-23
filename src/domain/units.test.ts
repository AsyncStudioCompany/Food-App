import { describe, expect, it } from 'vitest'
import { convert, isMeasurable } from './units'
import type { Ingredient } from './types'

const flour: Ingredient = {
  id: 'flour',
  name: 'Farine',
  aliases: [],
  category: 'grocery',
  defaultUnit: 'g',
  gramsPerMl: 0.55,
  isPantryStaple: true,
  allergens: ['gluten'],
  dietFlags: { isMeat: false, isFish: false, isAnimalProduct: false, isPork: false },
}
const egg: Ingredient = { ...flour, id: 'egg', name: 'Œuf', gramsPerMl: undefined, gramsPerPiece: 60 }

describe('convert', () => {
  it('converts within the same dimension', () => {
    expect(convert(1.5, 'kg', 'g', flour)).toBe(1500)
    expect(convert(25, 'cl', 'l', flour)).toBe(0.25)
    expect(convert(2, 'tbsp', 'ml', flour)).toBe(30)
    expect(convert(3, 'tsp', 'tbsp', flour)).toBe(1)
  })

  it('converts volume to mass with the ingredient density', () => {
    expect(convert(100, 'ml', 'g', flour)).toBeCloseTo(55)
    expect(convert(110, 'g', 'ml', flour)).toBeCloseTo(200)
  })

  it('converts pieces to mass with the average weight', () => {
    expect(convert(3, 'piece', 'g', egg)).toBe(180)
    expect(convert(120, 'g', 'piece', egg)).toBe(2)
  })

  it('returns undefined when no conversion data exists', () => {
    expect(convert(2, 'piece', 'g', flour)).toBeUndefined()
    expect(convert(100, 'ml', 'g', egg)).toBeUndefined()
    expect(convert(1, 'pinch', 'g', flour)).toBeUndefined()
  })
})

describe('isMeasurable', () => {
  it('rejects pinch and to_taste', () => {
    expect(isMeasurable('g')).toBe(true)
    expect(isMeasurable('pinch')).toBe(false)
    expect(isMeasurable('to_taste')).toBe(false)
  })
})
