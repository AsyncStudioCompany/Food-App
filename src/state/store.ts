import { useSyncExternalStore } from 'react'
import { NO_FILTERS, type SearchFilters } from '../domain/search'
import type { Fridge, Prefs, Recipe, RecipeList } from '../domain/types'

/** Saved on the device. */
export interface SavedState {
  fridge: Fridge
  prefs: Prefs
  liked: Record<string, boolean>
  lists: RecipeList[]
  /** Recipes invented by the AI, newest first. */
  generated: Recipe[]
}

export interface Celebration {
  name: string
  used: number
  saved: string[]
}

/** Lives for the session only. */
export interface UiState {
  fridgeQuery: string
  searchQuery: string
  searchFilters: SearchFilters
  toast: string | null
  celebrate: Celebration | null
}

export type State = SavedState & UiState

const STORAGE_KEY = 'mijote:v1'

export const DEFAULT_SAVED: SavedState = {
  fridge: {},
  prefs: { diet: 'Tout', allergies: [], cuisines: [], portions: 2 },
  liked: {},
  lists: [],
  generated: [],
}

const DEFAULT_UI: UiState = { fridgeQuery: '', searchQuery: '', searchFilters: NO_FILTERS, toast: null, celebrate: null }

function load(): SavedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...DEFAULT_SAVED, ...(JSON.parse(raw) as Partial<SavedState>) }
  } catch {
    // Private mode or corrupted data: start fresh.
  }
  return DEFAULT_SAVED
}

let state: State = { ...load(), ...DEFAULT_UI }
const listeners = new Set<() => void>()

function persist(s: State) {
  const saved: SavedState = { fridge: s.fridge, prefs: s.prefs, liked: s.liked, lists: s.lists, generated: s.generated }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
  } catch {
    // Storage full or unavailable: keep working in memory.
  }
}

export function getState(): State {
  return state
}

export function setState(patch: Partial<State> | ((s: State) => Partial<State>)) {
  const next = typeof patch === 'function' ? patch(state) : patch
  state = { ...state, ...next }
  if (Object.keys(next).some((k) => k in DEFAULT_SAVED)) persist(state)
  listeners.forEach((l) => l())
}

/** Replaces the whole state (tests). */
export function resetState(saved: Partial<SavedState> = {}) {
  state = { ...DEFAULT_SAVED, ...saved, ...DEFAULT_UI }
  persist(state)
  listeners.forEach((l) => l())
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

/** Selectors must return a slice of the state (or a primitive), not a new object. */
export function useStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(subscribe, () => selector(state))
}

let toastTimer: ReturnType<typeof setTimeout> | undefined
export function flash(message: string) {
  clearTimeout(toastTimer)
  setState({ toast: message })
  toastTimer = setTimeout(() => setState({ toast: null }), 2600)
}

export const toggleLike = (id: string) => setState((s) => ({ liked: { ...s.liked, [id]: !s.liked[id] } }))

export const toggleInList = (listId: string, recipeId: string) =>
  setState((s) => ({
    lists: s.lists.map((l) =>
      l.id !== listId
        ? l
        : {
            ...l,
            recipeIds: l.recipeIds.includes(recipeId)
              ? l.recipeIds.filter((x) => x !== recipeId)
              : [...l.recipeIds, recipeId],
          },
    ),
  }))

export function createList(name: string, recipeId?: string) {
  const n = name.trim()
  if (!n) return
  setState((s) => ({ lists: [...s.lists, { id: 'l' + Date.now(), name: n, recipeIds: recipeId ? [recipeId] : [] }] }))
}
