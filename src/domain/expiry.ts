import type { AisleId, Ingredient } from './types.ts'

/** Local calendar day as YYYY-MM-DD. */
export function isoDay(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export function addDays(today: string, days: number): string {
  const [y, m, d] = today.split('-').map(Number)
  return isoDay(new Date(y, m - 1, d + days))
}

/** Whole days from `today` to `date` (negative when past), or null without a date. */
export function daysLeft(date: string | null, today: string): number | null {
  if (date == null) return null
  const [y1, m1, d1] = today.split('-').map(Number)
  const [y2, m2, d2] = date.split('-').map(Number)
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86_400_000)
}

/** Eat soon: expires in 2 days or less. Drives the warn dot and the "anti-gaspi" ranking bonus. */
export const SOON_DAYS = 2

export const isSoon = (days: number | null) => days != null && days <= SOON_DAYS

/** "à finir aujourd'hui", "à finir demain"… */
export function expiryText(days: number | null): string {
  if (days == null) return ''
  if (days <= 0) return "à finir aujourd'hui"
  if (days === 1) return 'à finir demain'
  if (days <= 2) return `à finir d'ici ${days} jours`
  return `encore ${days} jours`
}

/** Expiry choices of the quantity sheet, in days from today. */
export const EXPIRY_CHOICES: [label: string, days: number | null][] = [
  ["Aujourd'hui", 0],
  ['Demain', 1],
  ['3 jours', 3],
  ['1 semaine', 7],
  ['Pas de date', null],
]

/** Aisles of food that keeps for months: no expiry date proposed when it goes into the fridge. */
const LONG_KEEPING: AisleId[] = ['feculents', 'legumineuses', 'conserves', 'fruits_secs', 'patisserie', 'epices']
/** Fresh food shelved with long-keeping food. */
const FRESH = new Set(['tofu', 'pate_feuilletee', 'pate_brisee'])

export const keepsLong = (ing: Ingredient) => LONG_KEEPING.includes(ing.aisle) && !FRESH.has(ing.id)
