import type { Ingredient } from './types'

/** Minuscules, sans accents, sans ponctuation : « Crème fraîche » → « creme fraiche ». */
export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** Retire un pluriel simple (s, x) de chaque mot. */
function singularize(text: string): string {
  return text
    .split(' ')
    .map((word) => (word.length > 3 && /[sx]$/.test(word) ? word.slice(0, -1) : word))
    .join(' ')
}

function searchKey(text: string): string {
  return singularize(normalizeText(text))
}

/**
 * Autocomplétion des ingrédients : insensible aux accents et au pluriel.
 * Les noms qui commencent par la saisie passent avant ceux qui la contiennent.
 */
export function searchIngredients(query: string, ingredients: Ingredient[], limit = 8): Ingredient[] {
  const key = searchKey(query)
  if (!key) return []
  const ranked: { ingredient: Ingredient; rank: number }[] = []
  for (const ingredient of ingredients) {
    const names = [ingredient.name, ...ingredient.aliases].map(searchKey)
    let rank = Infinity
    for (const [position, name] of names.entries()) {
      const penalty = position === 0 ? 0 : 0.5
      if (name === key) rank = Math.min(rank, 0 + penalty)
      else if (name.startsWith(key)) rank = Math.min(rank, 1 + penalty)
      else if (name.split(' ').some((word) => word.startsWith(key))) rank = Math.min(rank, 2 + penalty)
      else if (name.includes(key)) rank = Math.min(rank, 3 + penalty)
    }
    if (rank !== Infinity) ranked.push({ ingredient, rank })
  }
  return ranked
    .sort((a, b) => a.rank - b.rank || a.ingredient.name.localeCompare(b.ingredient.name, 'fr'))
    .slice(0, limit)
    .map(({ ingredient }) => ingredient)
}
