import { isEligible, recipeTraits } from './diet.ts'
import { daysLeft } from './expiry.ts'
import { round2, toBase } from './units.ts'
import { CUISINES, type Cuisine, type Fridge, type Ingredient, type Prefs, type Recipe } from './types.ts'

/** What the app sends to the recipe generator. */
export interface AiRecipeRequest {
  /** Fridge content in base units, with days before expiry. */
  fridge: { id: string; qty: number; days: number | null }[]
  prefs: Prefs
  /** Free text: "un truc réconfortant", "sans four"… */
  wish: string
}

/** What the model returns, before validation. */
export interface AiRecipeDraft {
  name: string
  cuisine: Cuisine
  minutes: number
  servings: number
  ingredients: { id: string; qty: number }[]
  steps: string[]
  /** One or two English words to find a TheMealDB stand-in photo. */
  photoQuery: string
}

export function fridgeSnapshot(fridge: Fridge, today: string): AiRecipeRequest['fridge'] {
  return Object.entries(fridge).map(([id, f]) => ({
    id,
    qty: round2(toBase(f.qty, f.unit)),
    days: daysLeft(f.expiresOn, today),
  }))
}

/** Problems that make a draft unusable; empty when it is fine. */
export function checkDraft(draft: AiRecipeDraft, byId: Map<string, Ingredient>, prefs: Prefs): string[] {
  const errors: string[] = []
  if (!draft.name.trim()) errors.push('Le nom est vide.')
  if (!CUISINES.includes(draft.cuisine)) errors.push(`Cuisine inconnue : ${draft.cuisine}.`)
  if (!(draft.minutes > 0 && draft.minutes <= 240)) errors.push('Le temps doit être entre 1 et 240 minutes.')
  if (!(draft.servings >= 1 && draft.servings <= 12)) errors.push('Les portions doivent être entre 1 et 12.')
  if (draft.ingredients.length < 1) errors.push('Il faut au moins un ingrédient.')
  const seen = new Set<string>()
  for (const i of draft.ingredients) {
    if (!byId.has(i.id)) errors.push(`Ingrédient hors catalogue : ${i.id}.`)
    if (seen.has(i.id)) errors.push(`Ingrédient en double : ${i.id}.`)
    if (!(i.qty > 0)) errors.push(`Quantité invalide pour ${i.id}.`)
    seen.add(i.id)
  }
  if (draft.steps.length < 2 || draft.steps.some((s) => !s.trim())) errors.push('Il faut au moins 2 étapes non vides.')
  if (errors.length === 0 && !isEligible(recipeTraits(draftToRecipe(draft, 'check'), byId), prefs))
    errors.push('La recette ne respecte pas le régime ou les allergies.')
  return errors
}

export function draftToRecipe(draft: AiRecipeDraft, id: string): Recipe {
  return {
    id,
    name: draft.name.trim(),
    cuisine: draft.cuisine,
    minutes: Math.round(draft.minutes),
    servings: Math.round(draft.servings),
    ingredients: draft.ingredients.map((i) => ({ id: i.id, qty: i.qty })),
    steps: draft.steps.map((s) => s.trim()),
    photoTerms: [draft.photoQuery.trim()].filter(Boolean),
    generated: true,
  }
}
