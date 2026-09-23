import type { Ingredient, Unit } from './types'

type Dimension = 'mass' | 'volume' | 'count'

// Facteur vers l'unité de base de la dimension : g, ml ou pièce.
const UNIT_TABLE: Partial<Record<Unit, { dimension: Dimension; factor: number }>> = {
  g: { dimension: 'mass', factor: 1 },
  kg: { dimension: 'mass', factor: 1000 },
  ml: { dimension: 'volume', factor: 1 },
  cl: { dimension: 'volume', factor: 10 },
  l: { dimension: 'volume', factor: 1000 },
  tbsp: { dimension: 'volume', factor: 15 },
  tsp: { dimension: 'volume', factor: 5 },
  piece: { dimension: 'count', factor: 1 },
}

export const UNIT_LABELS: Record<Unit, string> = {
  g: 'g',
  kg: 'kg',
  ml: 'ml',
  cl: 'cl',
  l: 'L',
  piece: 'pièce(s)',
  tbsp: 'c. à soupe',
  tsp: 'c. à café',
  pinch: 'pincée(s)',
  to_taste: 'selon le goût',
}

/** Unités qui ne peuvent pas être comparées : « une pincée », « selon le goût ». */
export function isMeasurable(unit: Unit): boolean {
  return UNIT_TABLE[unit] !== undefined
}

function toGrams(quantity: number, unit: Unit, ingredient: Ingredient): number | undefined {
  const entry = UNIT_TABLE[unit]
  if (!entry) return undefined
  const base = quantity * entry.factor
  switch (entry.dimension) {
    case 'mass':
      return base
    case 'volume':
      return ingredient.gramsPerMl !== undefined ? base * ingredient.gramsPerMl : undefined
    case 'count':
      return ingredient.gramsPerPiece !== undefined ? base * ingredient.gramsPerPiece : undefined
  }
}

/**
 * Convertit une quantité d'une unité à une autre pour un ingrédient donné.
 * Renvoie `undefined` si la conversion est impossible (unité non mesurable
 * ou poids moyen / densité inconnus).
 */
export function convert(
  quantity: number,
  from: Unit,
  to: Unit,
  ingredient: Ingredient,
): number | undefined {
  const source = UNIT_TABLE[from]
  const target = UNIT_TABLE[to]
  if (!source || !target) return undefined
  if (source.dimension === target.dimension) {
    return (quantity * source.factor) / target.factor
  }
  const grams = toGrams(quantity, from, ingredient)
  if (grams === undefined) return undefined
  const oneTargetInGrams = toGrams(1, to, ingredient)
  if (oneTargetInGrams === undefined) return undefined
  return grams / oneTargetInGrams
}
