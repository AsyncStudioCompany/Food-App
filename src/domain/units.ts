import type { BaseUnit, Unit } from './types.ts'

/** Factor from a unit to its base unit (kg → g, L → cl). */
export const FACTOR: Record<Unit, number> = { g: 1, kg: 1000, cl: 1, L: 100, pc: 1 }

/** Step of the − / + buttons in the quantity sheet. */
export const STEP: Record<Unit, number> = { g: 50, kg: 0.25, cl: 5, L: 0.25, pc: 1 }

/** Units offered for an ingredient, by base unit. */
export const UNITS: Record<BaseUnit, Unit[]> = { g: ['g', 'kg'], cl: ['cl', 'L'], pc: ['pc'] }

export const round2 = (n: number) => Math.round(n * 100) / 100

export const toBase = (qty: number, unit: Unit) => qty * FACTOR[unit]

export const convert = (qty: number, from: Unit, to: Unit) => round2((qty * FACTOR[from]) / FACTOR[to])

/** French number: 0.5 → "0,5". */
export const fmt = (n: number) => String(round2(n)).replace('.', ',')

/** Label of a quantity expressed in the base unit: 1500 g → "1,5 kg", 3 pc → "3". */
export function qtyLabel(qty: number, unit: BaseUnit): string {
  if (unit === 'g' && qty >= 1000) return fmt(qty / 1000) + ' kg'
  if (unit === 'cl' && qty >= 100) return fmt(qty / 100) + ' L'
  if (unit === 'pc') return fmt(qty)
  // Grams and centiliters scaled to the portions: 13,33 g reads 13 g, 2,67 cl reads 2,7 cl.
  return fmt(qty >= 10 ? Math.round(qty) : Math.round(qty * 10) / 10) + ' ' + unit
}

/** Label shown in the quantity sheet, in the unit the user picked. */
export const sheetQtyLabel = (qty: number, unit: Unit) => (unit === 'pc' ? fmt(qty) : fmt(qty) + ' ' + unit)
