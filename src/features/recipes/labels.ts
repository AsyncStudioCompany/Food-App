import type { Cuisine, Difficulty } from '../../domain/types'

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Facile',
  medium: 'Moyen',
  hard: 'Difficile',
}

export const CUISINE_LABELS: Record<Cuisine, string> = {
  french: 'Française',
  italian: 'Italienne',
  spanish: 'Espagnole',
  greek: 'Grecque',
  middle_eastern: 'Moyen-Orient',
  indian: 'Indienne',
  asian: 'Asiatique',
  japanese: 'Japonaise',
  mexican: 'Mexicaine',
  american: 'Américaine',
  north_african: 'Maghrébine',
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest === 0 ? `${hours} h` : `${hours} h ${rest.toString().padStart(2, '0')}`
}

export const TAG_LABELS: Record<string, string> = {
  quick: 'Rapide',
  comfort: 'Réconfortant',
  budget: 'Petit budget',
  light: 'Léger',
  spicy: 'Épicé',
  family: 'En famille',
  batch: 'Batch cooking',
  oven: 'Au four',
  'no-cook': 'Sans cuisson',
  summer: "Recette d'été",
  winter: "Recette d'hiver",
}

export const DIET_LABELS = {
  omnivore: 'Omnivore',
  vegetarian: 'Végétarien',
  vegan: 'Vegan',
  pescatarian: 'Pescétarien',
} as const
