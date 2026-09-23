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

export const DEFAULT_SAVED: SavedState = {
  fridge: {},
  prefs: { diet: 'Tout', allergies: [], cuisines: [], portions: 2, ai: true },
  liked: {},
  lists: [],
  generated: [],
}

const DEFAULT_UI: UiState = { fridgeQuery: '', searchQuery: '', searchFilters: NO_FILTERS, toast: null, celebrate: null }

/** Fills what older saves lack (like `prefs.ai`). */
export function withDefaults(saved: Partial<SavedState>): SavedState {
  return { ...DEFAULT_SAVED, ...saved, prefs: { ...DEFAULT_SAVED.prefs, ...saved.prefs } }
}

export const savedOf = (s: State): SavedState => ({ fridge: s.fridge, prefs: s.prefs, liked: s.liked, lists: s.lists, generated: s.generated })

let state: State = { ...DEFAULT_SAVED, ...DEFAULT_UI }
const listeners = new Set<() => void>()

/** Where a change of the saved data comes from: the user on this device, or the account (another device). */
export type SavedSource = 'local' | 'remote'
const savedListeners = new Set<(saved: SavedState, source: SavedSource) => void>()

/** Called after every change of the saved data (local persistence, account sync). */
export function onSavedChange(l: (saved: SavedState, source: SavedSource) => void) {
  savedListeners.add(l)
  return () => savedListeners.delete(l)
}

export function getState(): State {
  return state
}

export function setState(patch: Partial<State> | ((s: State) => Partial<State>)) {
  const next = typeof patch === 'function' ? patch(state) : patch
  state = { ...state, ...next }
  listeners.forEach((l) => l())
  if (Object.keys(next).some((k) => k in DEFAULT_SAVED)) savedListeners.forEach((l) => l(savedOf(state), 'local'))
}

/** Replaces all the saved data: loading from the device, data from the account, reset. */
export function replaceSaved(saved: Partial<SavedState>, source: SavedSource) {
  state = { ...state, ...withDefaults(saved) }
  listeners.forEach((l) => l())
  savedListeners.forEach((l) => l(savedOf(state), source))
}

/** Replaces the whole state (tests, sign-out). */
export function resetState(saved: Partial<SavedState> = {}) {
  state = { ...withDefaults(saved), ...DEFAULT_UI }
  listeners.forEach((l) => l())
  savedListeners.forEach((l) => l(savedOf(state), 'local'))
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
