import { useEffect, useSyncExternalStore } from 'react'
import { normalize } from '../domain/search'
import type { Recipe } from '../domain/types'

/**
 * Recipe photos. Catalog recipes carry a hand-picked `photoUrl`. AI-invented recipes look for
 * a TheMealDB dish whose name contains every word of their `photoTerms`, and keep the striped
 * background otherwise: no photo is better than the photo of another dish.
 */
const CACHE_KEY = 'mijote:photos:v2'

let photos: Record<string, string> = readCache()
const listeners = new Set<() => void>()
const searches = new Map<string, Promise<{ name: string; thumb: string }[]>>()
const pending = new Set<string>()

function readCache(): Record<string, string> {
  try {
    localStorage.removeItem('mijote:photos:v1') // loose stand-ins of the first version
    return JSON.parse(localStorage.getItem(CACHE_KEY) ?? '{}') as Record<string, string>
  } catch {
    return {}
  }
}

function search(term: string) {
  let p = searches.get(term)
  if (!p) {
    p = fetch('https://www.themealdb.com/api/json/v1/1/search.php?s=' + encodeURIComponent(term))
      .then((r) => r.json() as Promise<{ meals: { strMeal: string; strMealThumb: string }[] | null }>)
      .then((j) => (j.meals ?? []).map((m) => ({ name: m.strMeal, thumb: m.strMealThumb })))
      .catch(() => [])
    searches.set(term, p)
  }
  return p
}

/** The dish name must contain every word of the search term. */
export function nameMatches(dishName: string, term: string): boolean {
  const name = normalize(dishName)
  return normalize(term)
    .split(/\s+/)
    .filter(Boolean)
    .every((w) => name.includes(w))
}

async function resolve(recipes: Recipe[]) {
  const exact = recipes.filter((r) => r.photoUrl && photos[r.id] !== r.photoUrl)
  if (exact.length) {
    photos = { ...photos, ...Object.fromEntries(exact.map((r) => [r.id, r.photoUrl!])) }
    listeners.forEach((l) => l())
  }
  const todo = recipes.filter((r) => !r.photoUrl && !photos[r.id] && !pending.has(r.id) && r.photoTerms.length)
  if (!todo.length) return
  todo.forEach((r) => pending.add(r.id))
  const results = await Promise.all(todo.map((r) => Promise.all(r.photoTerms.map(search))))
  const next = { ...photos }
  todo.forEach((r, i) => {
    pending.delete(r.id)
    r.photoTerms.forEach((term, t) => {
      if (next[r.id]) return
      const hit = results[i][t].find((m) => nameMatches(m.name, term))
      if (hit) next[r.id] = hit.thumb
    })
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

/** Striped fallback while there is no photo. */
export const STRIPE = 'repeating-linear-gradient(135deg, #2b2723 0 9px, #24211e 9px 18px)'

/** Smaller file for thumbnails, when the host offers one (Wikimedia only serves standard widths). */
export function smallPhoto(url: string): string {
  if (url.includes('themealdb.com/images/')) return url + '/preview'
  if (url.includes('staticflickr.com/')) return url.replace(/_b\.jpg$/, '_q.jpg')
  if (url.includes('upload.wikimedia.org/') && url.includes('/thumb/')) return url.replace(/\/\d+px-/, '/250px-')
  return url
}

/** CSS background of a recipe visual. */
export function photoBg(url: string | undefined, small = false): string {
  return url ? `url("${small ? smallPhoto(url) : url}") center / cover no-repeat, ${STRIPE}` : STRIPE
}
