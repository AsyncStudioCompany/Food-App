import type { Ingredient, Unit } from '../../domain/types'

/** Unités proposées pour saisir un aliment du frigo. */
export function fridgeUnits(ingredient: Ingredient): Unit[] {
  const units: Unit[] = []
  if (ingredient.defaultUnit === 'piece' || ingredient.gramsPerPiece !== undefined) units.push('piece')
  if (['ml', 'cl', 'l'].includes(ingredient.defaultUnit)) units.push('ml', 'l')
  else if (ingredient.gramsPerMl !== undefined && ['tbsp', 'tsp'].includes(ingredient.defaultUnit)) units.push('ml')
  units.push('g', 'kg')
  return [...new Set(units)]
}

/** Quantité proposée par défaut ; `undefined` pour les épices et condiments (« quantité non précisée »). */
export function defaultFridgeEntry(ingredient: Ingredient): { quantity?: number; unit: Unit } {
  switch (ingredient.defaultUnit) {
    case 'piece':
      return { quantity: 1, unit: 'piece' }
    case 'g':
    case 'kg':
      return { quantity: 250, unit: 'g' }
    case 'ml':
    case 'cl':
    case 'l':
      return { quantity: 500, unit: 'ml' }
    default:
      return { quantity: undefined, unit: fridgeUnits(ingredient)[0] }
  }
}

/** Pas des boutons + / − selon l'unité et la quantité courante. */
export function quantityStep(unit: Unit, quantity: number): number {
  switch (unit) {
    case 'piece':
      return 1
    case 'kg':
    case 'l':
      return 0.25
    case 'g':
    case 'ml':
      return quantity >= 500 ? 100 : 50
    default:
      return 1
  }
}

export function increment(quantity: number, unit: Unit): number {
  const step = quantityStep(unit, quantity)
  return Math.round((Math.floor(quantity / step + 1e-9) + 1) * step * 100) / 100
}

export function decrement(quantity: number, unit: Unit): number {
  const step = quantityStep(unit, Math.max(0, quantity - 1e-9))
  const next = Math.round((Math.ceil(quantity / step - 1e-9) - 1) * step * 100) / 100
  return Math.max(step, next)
}
