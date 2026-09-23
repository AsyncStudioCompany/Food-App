import type { FridgeItem, Unit } from '../domain/types'

const EXAMPLE: [string, number, Unit][] = [
  ['egg', 6, 'piece'],
  ['mushroom', 250, 'g'],
  ['butter', 250, 'g'],
  ['grated_cheese', 200, 'g'],
  ['tomato', 4, 'piece'],
  ['onion', 3, 'piece'],
  ['bell_pepper', 2, 'piece'],
  ['spinach', 200, 'g'],
  ['milk', 1, 'l'],
  ['pasta', 500, 'g'],
  ['bacon', 200, 'g'],
]

/** Frigo d'exemple pour la maquette, afin qu'elle s'ouvre sur des suggestions. */
export function exampleFridge(): FridgeItem[] {
  return EXAMPLE.map(([ingredientId, quantity, unit]) => ({
    id: `example-${ingredientId}`,
    ingredientId,
    quantity,
    unit,
    addedAt: new Date().toISOString().slice(0, 10),
  }))
}
