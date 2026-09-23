/** Units the catalog stores quantities in (the "base" unit of an ingredient). */
export type BaseUnit = 'g' | 'cl' | 'pc'
/** Units the user can pick in the quantity sheet. */
export type Unit = 'g' | 'kg' | 'cl' | 'L' | 'pc'

export type AisleId = 'frais' | 'legumes' | 'fruits' | 'epicerie'

export const ALLERGENS = ['Gluten', 'Lactose', 'Arachides', 'Œufs', 'Fruits à coque'] as const
export type Allergen = (typeof ALLERGENS)[number]

export const DIETS = ['Tout', 'Végétarien', 'Vegan', 'Sans porc'] as const
export type Diet = (typeof DIETS)[number]

export const CUISINES = [
  'Française',
  'Italienne',
  'Asiatique',
  'Mexicaine',
  'Indienne',
  'Moyen-Orient',
  'Espagnole',
  'Européenne',
  'Maghreb',
  'Africaine',
  'Caribéenne',
  'Sud-américaine',
  'Américaine',
] as const
export type Cuisine = (typeof CUISINES)[number]

/** What an ingredient means for diets: meat and fish rule out vegetarian, dairy and eggs rule out vegan. */
export type AnimalKind = 'pork' | 'meat' | 'fish' | 'dairy' | 'egg'

export interface Ingredient {
  id: string
  name: string
  aisle: AisleId
  unit: BaseUnit
  /** Quantity proposed when the ingredient is first added to the fridge. */
  defaultQty: number
  animal?: AnimalKind
  allergens?: Allergen[]
}

export interface RecipeIngredient {
  id: string
  /** Quantity in the ingredient's base unit, for `servings` portions. */
  qty: number
}

export interface Recipe {
  id: string
  name: string
  cuisine: Cuisine
  minutes: number
  servings: number
  ingredients: RecipeIngredient[]
  steps: string[]
  /** English words to look for a photo of an AI-invented dish on TheMealDB (exact name match only). */
  photoTerms: string[]
  /** Photo of the dish, chosen by hand; takes precedence over `photoTerms`. */
  photoUrl?: string
  /** Author and licence, when the photo's licence asks for credit. */
  photoCredit?: PhotoCredit
  /** Pantry items used besides salt, pepper and oil (French, lowercase). */
  pantry?: string[]
  /** Where an imported recipe comes from. */
  source?: { name: 'TheMealDB'; id: string }
  /** Set on recipes invented by the AI for this user. */
  generated?: boolean
}

export interface PhotoCredit {
  author: string
  /** "CC BY 2.0", "CC BY-SA 2.0", "Domaine public"… */
  license: string
  /** Page of the original photo. */
  url: string
}

export interface FridgeItem {
  qty: number
  unit: Unit
  /** ISO date (YYYY-MM-DD) to eat it by, or null when there is no date. */
  expiresOn: string | null
}

export type Fridge = Record<string, FridgeItem>

export interface Prefs {
  diet: Diet
  allergies: Allergen[]
  cuisines: Cuisine[]
  portions: number
  /** Recipes invented by the AI: shows or hides "Invente-moi une recette". */
  ai: boolean
}

export interface RecipeList {
  id: string
  name: string
  recipeIds: string[]
}
