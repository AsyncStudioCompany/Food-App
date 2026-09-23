import type { FridgeItem, Unit } from '../domain/types'
import { createPersistentStore, useStore } from './store'

export const fridgeStore = createPersistentStore<FridgeItem[]>('food-app:fridge', [])

export type FridgeEntry = { quantity?: number; unit?: Unit; expiresOn?: string }

/** Ajoute l'aliment ou remplace sa quantité : un seul élément par ingrédient dans le frigo. */
export function putFridgeItem(ingredientId: string, entry: FridgeEntry) {
  fridgeStore.set((items) => {
    const existing = items.find((item) => item.ingredientId === ingredientId)
    const next: FridgeItem = {
      id: existing?.id ?? `${ingredientId}-${Date.now()}`,
      ingredientId,
      addedAt: existing?.addedAt ?? new Date().toISOString().slice(0, 10),
      ...entry,
    }
    return existing ? items.map((item) => (item === existing ? next : item)) : [...items, next]
  })
}

export function removeFridgeItem(ingredientId: string) {
  fridgeStore.set((items) => items.filter((item) => item.ingredientId !== ingredientId))
}

export function useFridge(): FridgeItem[] {
  return useStore(fridgeStore)
}
