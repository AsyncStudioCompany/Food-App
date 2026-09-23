import type { Evaluation } from '../domain/matching'

export const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? 's' : ''}`

const lower = (e: Evaluation['items'][number]) => e.ingredient.name.toLowerCase()

/** "20 min · Italienne" */
export const meta = (e: Evaluation) => `${e.recipe.minutes} min · ${e.recipe.cuisine}`

/** "12 min · Express" (mono, on photo cards). */
export const metaMono = (e: Evaluation) =>
  `${e.recipe.minutes} min · ${e.recipe.minutes <= 15 ? 'Express' : e.recipe.minutes <= 25 ? 'Facile' : 'On mijote'}`

/** Tag in the top-left corner of a Top 3 card, or '' for none. */
export const cardTag = (e: Evaluation) =>
  e.saving.length ? 'Anti-gaspi' : e.favoriteCuisine ? 'Ta cuisine préférée' : e.recipe.minutes <= 15 ? 'Express' : ''

export const cardStatus = (e: Evaluation) =>
  e.missing.length === 0 ? 'Tu as tout !' : 'Il te manque : ' + e.missing.map(lower).join(', ')

export const saveLabel = (e: Evaluation) => 'Sauve tes ' + e.saving.map(lower).join(' et ')

export const missLabel = (e: Evaluation) =>
  'Manque : ' + e.missing.map((x) => lower(x) + (x.status === 'partial' ? ' (pas assez)' : '')).join(', ')

export const statusLabel = (e: Evaluation) =>
  e.missing.length === 0 ? 'Faisable maintenant' : `Il manque ${plural(e.missing.length, 'ingrédient')}`

export const recipePath = (id: string) => `/recette/${id}`
