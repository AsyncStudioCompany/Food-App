import { convert, isMeasurable } from './units'
import type { FridgeItem, Ingredient, Recipe, RecipeIngredient, Unit, UserPreferences } from './types'

export const WEIGHTS = {
  coverage: 100,
  missingPenalty: 15,
  insufficientPenalty: 7,
  favoriteCuisineBonus: 10,
  favoriteTagBonus: 5,
  favoriteTagBonusCap: 15,
  lovedIngredientBonus: 5,
  expiringIngredientBonus: 8,
  tooLongPenalty: 10,
} as const

export const EXPIRING_SOON_DAYS = 3
export const ALMOST_MAX_ISSUES = 2

export type IngredientStatus = 'enough' | 'insufficient' | 'missing'

export type IngredientCheck = {
  line: RecipeIngredient
  status: IngredientStatus
  /** Quantité nécessaire pour le nombre de portions demandé, dans l'unité de la recette. */
  needed?: number
  /** Quantité disponible convertie dans l'unité de la recette, si elle est connue. */
  available?: number
  isPantryStaple: boolean
}

export type MatchGroup = 'ready' | 'almost' | 'other'

export type RecipeMatch = {
  recipe: Recipe
  servings: number
  checks: IngredientCheck[]
  coverage: number
  missing: IngredientCheck[]
  insufficient: IngredientCheck[]
  expiringUsed: string[]
  score: number
  group: MatchGroup
}

export type IngredientIndex = Map<string, Ingredient>

export function indexIngredients(ingredients: Ingredient[]): IngredientIndex {
  return new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]))
}

function ancestors(id: string, index: IngredientIndex): string[] {
  const result: string[] = []
  let current = index.get(id)?.parentId
  while (current && !result.includes(current)) {
    result.push(current)
    current = index.get(current)?.parentId
  }
  return result
}

/** Un aliment du frigo satisfait un ingrédient s'il est identique, plus précis (enfant) ou plus général (parent). */
export function satisfies(fridgeIngredientId: string, neededId: string, index: IngredientIndex): boolean {
  return (
    fridgeIngredientId === neededId ||
    ancestors(fridgeIngredientId, index).includes(neededId) ||
    ancestors(neededId, index).includes(fridgeIngredientId)
  )
}

/** Raisons pour lesquelles une recette est interdite par les contraintes strictes (vide = autorisée). */
export function exclusionReasons(
  recipe: Recipe,
  index: IngredientIndex,
  preferences: UserPreferences,
): string[] {
  const reasons = new Set<string>()
  for (const line of recipe.ingredients) {
    if (line.optional) continue
    const ingredient = index.get(line.ingredientId)
    if (!ingredient) continue
    const related = [ingredient.id, ...ancestors(ingredient.id, index)]
    for (const allergen of ingredient.allergens) {
      if (preferences.allergens.includes(allergen)) reasons.add(`allergen:${allergen}`)
    }
    if (related.some((id) => preferences.excludedIngredientIds.includes(id))) {
      reasons.add(`excluded:${ingredient.id}`)
    }
    const { isMeat, isFish, isAnimalProduct, isPork } = ingredient.dietFlags
    if (preferences.excludePork && isPork) reasons.add('diet:pork')
    switch (preferences.diet) {
      case 'vegan':
        if (isAnimalProduct) reasons.add('diet:vegan')
        break
      case 'vegetarian':
        if (isMeat || isFish) reasons.add('diet:vegetarian')
        break
      case 'pescatarian':
        if (isMeat) reasons.add('diet:pescatarian')
        break
      case 'omnivore':
        break
    }
  }
  return [...reasons]
}

function daysUntil(isoDate: string, today: Date): number {
  const target = new Date(`${isoDate}T00:00:00`)
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.round((target.getTime() - start.getTime()) / 86_400_000)
}

function checkLine(
  line: RecipeIngredient,
  scale: number,
  fridge: FridgeItem[],
  index: IngredientIndex,
  pantryStapleIds: string[],
): IngredientCheck {
  // Le placard ne couvre que l'ingrédient lui-même ou un ingrédient plus général :
  // avoir du sucre en stock ne veut pas dire avoir du sucre glace.
  const isPantryStaple = pantryStapleIds.some(
    (id) => id === line.ingredientId || ancestors(id, index).includes(line.ingredientId),
  )
  const needed = line.quantity !== undefined ? line.quantity * scale : undefined
  const base = { line, needed, isPantryStaple }
  if (isPantryStaple) return { ...base, status: 'enough' }

  const stock = fridge.filter((item) => satisfies(item.ingredientId, line.ingredientId, index))
  if (stock.length === 0) return { ...base, status: 'missing' }

  const unit: Unit | undefined = line.unit
  if (needed === undefined || unit === undefined || !isMeasurable(unit)) {
    return { ...base, status: 'enough' }
  }

  const ingredient = index.get(line.ingredientId)
  let available = 0
  for (const item of stock) {
    if (item.quantity === undefined || item.unit === undefined || !ingredient) {
      // Quantité inconnue : on considère l'ingrédient comme disponible.
      return { ...base, status: 'enough' }
    }
    const converted = convert(item.quantity, item.unit, unit, ingredient)
    if (converted === undefined) return { ...base, status: 'enough' }
    available += converted
  }
  // Petite tolérance pour les arrondis de conversion.
  const status = available + 1e-9 >= needed ? 'enough' : 'insufficient'
  return { ...base, status, available }
}

export type MatchOptions = {
  /** Nombre de portions voulu ; par défaut celui de la recette. */
  servings?: number
  today?: Date
}

export function matchRecipe(
  recipe: Recipe,
  fridge: FridgeItem[],
  index: IngredientIndex,
  preferences: UserPreferences,
  options: MatchOptions = {},
): RecipeMatch {
  const servings = options.servings ?? recipe.servings
  const scale = servings / recipe.servings
  const today = options.today ?? new Date()

  const checks = recipe.ingredients.map((line) =>
    checkLine(line, scale, fridge, index, preferences.pantryStapleIds),
  )
  const required = checks.filter((check) => !check.line.optional && !check.isPantryStaple)
  const missing = required.filter((check) => check.status === 'missing')
  const insufficient = required.filter((check) => check.status === 'insufficient')

  const ratios = required.map((check) => {
    if (check.status === 'enough') return 1
    if (check.status === 'missing') return 0
    return check.needed ? Math.min(1, (check.available ?? 0) / check.needed) : 0
  })
  const coverage = ratios.length === 0 ? 1 : ratios.reduce((sum, ratio) => sum + ratio, 0) / ratios.length

  const expiringUsed = fridge
    .filter((item) => item.expiresOn !== undefined && daysUntil(item.expiresOn, today) <= EXPIRING_SOON_DAYS)
    .filter((item) =>
      checks.some((check) => check.status !== 'missing' && satisfies(item.ingredientId, check.line.ingredientId, index)),
    )
    .map((item) => item.ingredientId)
  const uniqueExpiring = [...new Set(expiringUsed)]

  const lovedInRecipe = preferences.lovedIngredientIds.filter((loved) =>
    recipe.ingredients.some((line) => satisfies(loved, line.ingredientId, index)),
  )
  const favoriteTags = recipe.tags.filter((tag) => preferences.favoriteTags.includes(tag))
  const totalMinutes = recipe.prepMinutes + recipe.cookMinutes

  let score = WEIGHTS.coverage * coverage
  score -= WEIGHTS.missingPenalty * missing.length
  score -= WEIGHTS.insufficientPenalty * insufficient.length
  if (recipe.cuisine && preferences.favoriteCuisines.includes(recipe.cuisine)) {
    score += WEIGHTS.favoriteCuisineBonus
  }
  score += Math.min(WEIGHTS.favoriteTagBonusCap, WEIGHTS.favoriteTagBonus * favoriteTags.length)
  score += WEIGHTS.lovedIngredientBonus * lovedInRecipe.length
  score += WEIGHTS.expiringIngredientBonus * uniqueExpiring.length
  if (preferences.maxTotalMinutes !== undefined && totalMinutes > preferences.maxTotalMinutes) {
    score -= WEIGHTS.tooLongPenalty
  }

  const issues = missing.length + insufficient.length
  const group: MatchGroup = issues === 0 ? 'ready' : issues <= ALMOST_MAX_ISSUES ? 'almost' : 'other'

  return { recipe, servings, checks, coverage, missing, insufficient, expiringUsed: uniqueExpiring, score, group }
}

/** Recettes autorisées par les contraintes, triées de la plus pertinente à la moins pertinente. */
export function matchRecipes(
  recipes: Recipe[],
  fridge: FridgeItem[],
  index: IngredientIndex,
  preferences: UserPreferences,
  options: Omit<MatchOptions, 'servings'> = {},
): RecipeMatch[] {
  return recipes
    .filter((recipe) => exclusionReasons(recipe, index, preferences).length === 0)
    .map((recipe) => matchRecipe(recipe, fridge, index, preferences, options))
    .sort((a, b) => b.score - a.score)
}
