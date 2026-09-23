import { defaultPreferences } from '../domain/preferences'
import type { UserPreferences } from '../domain/types'
import { ingredients } from './seed'
import { createPersistentStore, useStore } from './store'

export const preferencesStore = createPersistentStore<UserPreferences>(
  'food-app:preferences',
  defaultPreferences(ingredients),
)

export function updatePreferences(patch: Partial<UserPreferences>) {
  preferencesStore.set((current) => ({ ...current, ...patch }))
}

export function usePreferences(): UserPreferences {
  return useStore(preferencesStore)
}
