import { useSyncExternalStore } from 'react'

export type Store<T> = {
  get: () => T
  set: (update: T | ((current: T) => T)) => void
  subscribe: (listener: () => void) => () => void
}

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

function writeStorage(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Stockage indisponible (navigation privée, quota) : l'état reste en mémoire.
  }
}

/** Petit store persistant dans le navigateur, en attendant la synchro Supabase. */
export function createPersistentStore<T>(key: string, initial: T): Store<T> {
  let value = readStorage(key, initial)
  const listeners = new Set<() => void>()
  return {
    get: () => value,
    set: (update) => {
      value = typeof update === 'function' ? (update as (current: T) => T)(value) : update
      writeStorage(key, value)
      for (const listener of listeners) listener()
    },
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}

export function useStore<T>(store: Store<T>): T {
  return useSyncExternalStore(store.subscribe, store.get, store.get)
}
