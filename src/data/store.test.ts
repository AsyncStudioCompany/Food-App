import { beforeEach, describe, expect, it } from 'vitest'
import { fridgeStore, putFridgeItem, removeFridgeItem } from './fridgeStore'

describe('fridgeStore', () => {
  beforeEach(() => {
    localStorage.clear()
    fridgeStore.set([])
  })

  it('adds, updates and removes an item, and persists it', () => {
    putFridgeItem('egg', { quantity: 6, unit: 'piece' })
    putFridgeItem('egg', { quantity: 4, unit: 'piece' })
    expect(fridgeStore.get()).toHaveLength(1)
    expect(fridgeStore.get()[0]).toMatchObject({ ingredientId: 'egg', quantity: 4, unit: 'piece' })
    expect(JSON.parse(localStorage.getItem('food-app:fridge')!)).toHaveLength(1)

    removeFridgeItem('egg')
    expect(fridgeStore.get()).toEqual([])
  })
})
