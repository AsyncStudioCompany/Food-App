export const INGREDIENT_CATEGORIES = [
  'fruits_vegetables',
  'meat',
  'fish_seafood',
  'dairy_eggs',
  'starches',
  'bakery',
  'legumes',
  'herbs_spices',
  'condiments_sauces',
  'grocery',
  'nuts_seeds',
  'frozen',
  'drinks',
] as const
export type IngredientCategory = (typeof INGREDIENT_CATEGORIES)[number]

export const ALLERGENS = [
  'gluten',
  'lactose',
  'eggs',
  'peanuts',
  'tree_nuts',
  'fish',
  'crustaceans',
  'molluscs',
  'soy',
  'sesame',
  'celery',
  'mustard',
] as const
export type Allergen = (typeof ALLERGENS)[number]

export const UNITS = ['g', 'kg', 'ml', 'cl', 'l', 'piece', 'tbsp', 'tsp', 'pinch', 'to_taste'] as const
export type Unit = (typeof UNITS)[number]

export const MEAL_TYPES = ['breakfast', 'starter', 'main', 'dessert', 'snack', 'drink'] as const
export type MealType = (typeof MEAL_TYPES)[number]

export const CUISINES = [
  'french',
  'italian',
  'spanish',
  'greek',
  'middle_eastern',
  'indian',
  'asian',
  'japanese',
  'mexican',
  'american',
  'north_african',
] as const
export type Cuisine = (typeof CUISINES)[number]

export type Diet = 'omnivore' | 'vegetarian' | 'vegan' | 'pescatarian'

export type DietFlags = {
  isMeat: boolean
  isFish: boolean
  isAnimalProduct: boolean
  isPork: boolean
}

export type Ingredient = {
  id: string
  name: string
  emoji?: string
  aliases: string[]
  category: IngredientCategory
  defaultUnit: Unit
  parentId?: string
  gramsPerPiece?: number
  gramsPerMl?: number
  isPantryStaple: boolean
  allergens: Allergen[]
  dietFlags: DietFlags
}

export type Difficulty = 'easy' | 'medium' | 'hard'

export type RecipeIngredient = {
  ingredientId: string
  quantity?: number
  unit?: Unit
  note?: string
  optional: boolean
}

export type Recipe = {
  id: string
  title: string
  emoji?: string
  description?: string
  imageUrl?: string
  servings: number
  prepMinutes: number
  cookMinutes: number
  difficulty: Difficulty
  mealType: MealType[]
  cuisine?: Cuisine
  tags: string[]
  ingredients: RecipeIngredient[]
  steps: string[]
  source?: { name: string; url?: string }
}

export type FridgeItem = {
  id: string
  ingredientId: string
  quantity?: number
  unit?: Unit
  expiresOn?: string
  addedAt: string
}

export type UserPreferences = {
  diet: Diet
  excludePork: boolean
  allergens: Allergen[]
  excludedIngredientIds: string[]
  pantryStapleIds: string[]
  favoriteCuisines: Cuisine[]
  favoriteTags: string[]
  lovedIngredientIds: string[]
  maxTotalMinutes?: number
}
