import type { IngredientIndex, RecipeMatch } from './matching'
import { satisfies } from './matching'
import type { FridgeItem } from './types'
import { convert } from './units'

/**
 * Frigo après avoir cuisiné la recette : retire les quantités utilisées.
 * Les aliments sans quantité connue, ou dont l'unité ne se convertit pas, restent tels quels.
 * Un aliment qui tombe à 0 est retiré du frigo.
 */
export function consumeRecipe(fridge: FridgeItem[], match: RecipeMatch, index: IngredientIndex): FridgeItem[] {
  let next = fridge.map((item) => ({ ...item }))
  for (const check of match.checks) {
    if (check.isPantryStaple || check.status === 'missing') continue
    const { unit } = check.line
    const ingredient = index.get(check.line.ingredientId)
    if (check.needed === undefined || unit === undefined || !ingredient) continue
    let remaining = check.needed
    for (const item of next) {
      if (remaining <= 0) break
      if (!satisfies(item.ingredientId, check.line.ingredientId, index)) continue
      if (item.quantity === undefined || item.unit === undefined) continue
      const availableInRecipeUnit = convert(item.quantity, item.unit, unit, ingredient)
      if (availableInRecipeUnit === undefined) continue
      const used = Math.min(remaining, availableInRecipeUnit)
      const usedInItemUnit = convert(used, unit, item.unit, ingredient) ?? 0
      item.quantity = Math.round((item.quantity - usedInItemUnit) * 100) / 100
      remaining -= used
    }
    next = next.filter((item) => item.quantity === undefined || item.quantity > 0)
  }
  return next
}
