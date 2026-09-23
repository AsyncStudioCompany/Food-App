import { describe, expect, it } from 'vitest'
import { ingredientIndex } from '../../data/seed'
import { formatQuantity } from '../../domain/units'
import { decrement, defaultFridgeEntry, fridgeUnits, increment } from './quantity'

const get = (id: string) => ingredientIndex.get(id)!

describe('fridge quantities', () => {
  it('proposes units adapted to the ingredient', () => {
    expect(fridgeUnits(get('egg'))).toEqual(['piece', 'g', 'kg'])
    expect(fridgeUnits(get('milk'))).toEqual(['ml', 'l', 'g', 'kg'])
    expect(fridgeUnits(get('pasta'))).toEqual(['g', 'kg'])
  })

  it('pre-fills a sensible default', () => {
    expect(defaultFridgeEntry(get('egg'))).toEqual({ quantity: 1, unit: 'piece' })
    expect(defaultFridgeEntry(get('pasta'))).toEqual({ quantity: 250, unit: 'g' })
    expect(defaultFridgeEntry(get('olive_oil')).quantity).toBeUndefined()
  })

  it('steps up and down', () => {
    expect(increment(3, 'piece')).toBe(4)
    expect(increment(250, 'g')).toBe(300)
    expect(increment(500, 'g')).toBe(600)
    expect(increment(1, 'kg')).toBe(1.25)
    expect(decrement(600, 'g')).toBe(500)
    expect(decrement(500, 'g')).toBe(450)
    expect(decrement(1, 'piece')).toBe(1)
    expect(decrement(130, 'g')).toBe(100)
  })

  it('formats quantities in French', () => {
    expect(formatQuantity(1.5, 'l')).toBe('1,5 L')
    expect(formatQuantity(4, 'piece')).toBe('4')
    expect(formatQuantity(250, 'g')).toBe('250 g')
  })
})
