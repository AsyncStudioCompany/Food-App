import type { Evaluation } from './matching.ts'
import type { Course, Cuisine } from './types.ts'

/** Lowercase without accents, for forgiving search. */
export const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

export interface SearchFilters {
  /** "Faisable maintenant": nothing missing. */
  now: boolean
  /** "20 min max". */
  quick: boolean
  cuisine: Cuisine | null
  course: Course | null
}

export const NO_FILTERS: SearchFilters = { now: false, quick: false, cuisine: null, course: null }

/** Search by recipe name or ingredient name, then apply the filter pills. */
export function searchRecipes(ranked: Evaluation[], query: string, f: SearchFilters): Evaluation[] {
  const q = normalize(query.trim())
  return ranked.filter(
    (e) =>
      (!q ||
        normalize(e.recipe.name).includes(q) ||
        e.items.some((i) => normalize(i.ingredient.name).includes(q))) &&
      (!f.now || e.missing.length === 0) &&
      (!f.quick || e.recipe.minutes <= 20) &&
      (!f.cuisine || e.recipe.cuisine === f.cuisine) &&
      (!f.course || e.recipe.course === f.course),
  )
}
