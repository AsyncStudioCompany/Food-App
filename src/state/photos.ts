import { useEffect, useSyncExternalStore } from 'react'
import type { Recipe } from '../domain/types'

/**
 * Stand-in photos from TheMealDB (public API): close dishes, not exact ones.
 * Each recipe gets the first unused photo matching its search terms; results are kept on the device.
 */
const CACHE_KEY = 'mijote:photos:v1'

let photos: Record<string, string> = readCache()
const listeners = new Set<() => void>()
const searches = new Map<string, Promise<string[]>>()
const pending = new Set<string>()

function readCache(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) ?? '{}') as Record<string, string>
  } catch {
    return {}
  }
}

function search(term: string): Promise<string[]> {
  let p = searches.get(term)
  if (!p) {
    p = fetch('https://www.themealdb.com/api/json/v1/1/search.php?s=' + encodeURIComponent(term))
      .then((r) => r.json() as Promise<{ meals: { strMealThumb: string }[] | null }>)
      .then((j) => (j.meals ?? []).map((m) => m.strMealThumb))
      .catch(() => [])
    searches.set(term, p)
  }
  return p
}

async function resolve(recipes: Recipe[]) {
  const todo = recipes.filter((r) => !photos[r.id] && !pending.has(r.id) && r.photoTerms.length)
  if (!todo.length) return
  todo.forEach((r) => pending.add(r.id))
  // Search every term in parallel, then assign in order so the same recipe keeps the same photo.
  const results = await Promise.all(todo.map((r) => Promise.all(r.photoTerms.map(search))))
  const used = new Set(Object.values(photos))
  const next = { ...photos }
  todo.forEach((r, i) => {
    pending.delete(r.id)
    for (const urls of results[i]) {
      const url = urls.find((u) => !used.has(u))
      if (url) {
        used.add(url)
        next[r.id] = url
        break
      }
    }
  })
  photos = next
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(photos))
  } catch {
    // ignore
  }
  listeners.forEach((l) => l())
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

/** Loads the missing photos in the background (mounted once, at the app root). */
export function useLoadPhotos(recipes: Recipe[]) {
  useEffect(() => {
    void resolve(recipes)
  }, [recipes])
}

/** Photo URL by recipe id. */
export function usePhotos(): Record<string, string> {
  return useSyncExternalStore(subscribe, () => photos)
}

/** Striped fallback while the photo is missing. */
export const STRIPE = 'repeating-linear-gradient(135deg, #2b2723 0 9px, #24211e 9px 18px)'

/** CSS background of a recipe visual; `small` uses TheMealDB's preview size. */
export function photoBg(url: string | undefined, small = false): string {
  return url ? `url("${url}${small ? '/preview' : ''}") center / cover no-repeat, ${STRIPE}` : STRIPE
}
