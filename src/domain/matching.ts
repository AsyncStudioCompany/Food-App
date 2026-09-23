import { isEligible, recipeTraits } from './diet.ts'
import { daysLeft, isSoon } from './expiry.ts'
import { goalBonus, recipeNutrition, type Nutrition } from './nutrition.ts'
import { round2, toBase } from './units.ts'
import type { Fridge, Ingredient, Prefs, Recipe } from './types.ts'

export type ItemStatus = 'ok' | 'partial' | 'missing'

export interface EvaluatedItem {
  ingredient: Ingredient
  /** Needed quantity for the requested portions, in base unit. */
  need: number
  /** Quantity in the fridge, in base unit. */
  have: number
  status: ItemStatus
  /** Days before the fridge item expires, null without a date or when absent. */
  days: number | null
}

export interface Evaluation {
  recipe: Recipe
  items: EvaluatedItem[]
  /** Items not fully covered (partial or missing). */
  missing: EvaluatedItem[]
  /** Items that are in the fridge and expire soon: cooking this saves them. */
  saving: EvaluatedItem[]
  favoriteCuisine: boolean
  /** Estimated per portion. */
  nutrition: Nutrition
  score: number
}

export interface MatchContext {
  fridge: Fridge
  prefs: Prefs
  byId: Map<string, Ingredient>
  today: string
}

export const indexIngredients = (list: Ingredient[]) => new Map(list.map((i) => [i.id, i]))

export function evaluate(recipe: Recipe, portions: number, ctx: MatchContext): Evaluation {
  const items: EvaluatedItem[] = []
  for (const ri of recipe.ingredients) {
    const ingredient = ctx.byId.get(ri.id)
    if (!ingredient) continue
    const exact = (ri.qty * portions) / recipe.servings
    // Pieces are counted by halves, rounded up: 1,33 onion → 1,5.
    const need = ingredient.unit === 'pc' ? Math.ceil(exact * 2 - 1e-9) / 2 : exact
    const f = ctx.fridge[ri.id]
    const have = f ? toBase(f.qty, f.unit) : 0
    const status: ItemStatus = have >= need - 1e-6 ? 'ok' : have > 0 ? 'partial' : 'missing'
    items.push({ ingredient, need, have, status, days: f ? daysLeft(f.expiresOn, ctx.today) : null })
  }
  const missing = items.filter((i) => i.status !== 'ok')
  const saving = items.filter((i) => i.status !== 'missing' && isSoon(i.days))
  const favoriteCuisine = ctx.prefs.cuisines.includes(recipe.cuisine)
  const nutrition = recipeNutrition(recipe, ctx.byId)
  // Doable first, then fewer missing, favorite cuisines, soon-to-expire food, the goal, and quicker recipes.
  const score = -missing.length * 100 + (favoriteCuisine ? 20 : 0) + saving.length * 15 + goalBonus(ctx.prefs.goal, nutrition) - recipe.minutes / 5
  return { recipe, items, missing, saving, favoriteCuisine, nutrition, score }
}

/** Recipes compatible with diet and allergies, evaluated at the default portions, best first. */
export function rankAll(recipes: Recipe[], ctx: MatchContext): Evaluation[] {
  return recipes
    .filter((r) => isEligible(recipeTraits(r, ctx.byId), ctx.prefs))
    .map((r) => evaluate(r, ctx.prefs.portions, ctx))
    .sort((a, b) => b.score - a.score)
}

/** Recipes worth suggesting: at most 2 missing ingredients. */
export const MAX_MISSING = 2

export interface Suggestions {
  /** Every suggestible recipe (count of the CTA and the results title). */
  doable: Evaluation[]
  top: Evaluation[]
  complete: Evaluation[]
  almost: Evaluation[]
}

export function suggest(ranked: Evaluation[]): Suggestions {
  const doable = ranked.filter((e) => e.missing.length <= MAX_MISSING)
  const fullyDoable = doable.filter((e) => e.missing.length === 0)
  const top = fullyDoable.slice(0, 3)
  if (top.length < 3) top.push(...doable.filter((e) => e.missing.length > 0).slice(0, 3 - top.length))
  const inTop = new Set(top.map((e) => e.recipe.id))
  return {
    doable,
    top,
    complete: fullyDoable.filter((e) => !inTop.has(e.recipe.id)),
    almost: doable.filter((e) => e.missing.length > 0 && !inTop.has(e.recipe.id)),
  }
}

export interface CookResult {
  fridge: Fridge
  /** Number of fridge ingredients used. */
  used: number
  /** Ingredients used that expired within 3 days: saved from the bin. */
  saved: Ingredient[]
}

/** "J'ai cuisiné": take the needed quantities out of the fridge. */
export function cook(evaluation: Evaluation, fridge: Fridge): CookResult {
  const next = { ...fridge }
  let used = 0
  for (const item of evaluation.items) {
    const cur = next[item.ingredient.id]
    if (!cur) continue
    used++
    const left = toBase(cur.qty, cur.unit) - item.need
    if (left <= 1e-6) delete next[item.ingredient.id]
    else next[item.ingredient.id] = { ...cur, qty: round2(left / toBase(1, cur.unit)) }
  }
  const saved = evaluation.items
    .filter((i) => i.status !== 'missing' && i.days != null && i.days <= 3)
    .map((i) => i.ingredient)
  return { fridge: next, used, saved }
}
