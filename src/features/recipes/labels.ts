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
