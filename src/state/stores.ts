import { roundPoint, type GeoPoint, type PricedStore } from '../domain/stores'
import { loadSide, saveSide } from './persist'

/** Dev server and Vercel: /api/stores (vite.config.ts). With Supabase: the function URL. */
const ENDPOINT = import.meta.env.VITE_STORES_URL || '/api/stores'
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export interface StoresResult {
  stores: PricedStore[]
  pricesComplete: boolean
  updatedAt: string
  /** Shown from the device cache, because the network or the server failed. */
  offline: boolean
}

export class StoresError extends Error {}

/** Last answers, encrypted on this device, for the offline mode. */
const CACHE = 'stores'
const CACHE_SIZE = 12
type Cached = { key: string; result: Omit<StoresResult, 'offline'> }[]

const cacheKey = (p: GeoPoint, ids: string[]) => {
  const r = roundPoint(p)
  return `${r.lat},${r.lon}|${[...ids].sort().join(',')}`
}
const placeOf = (key: string) => key.split('|')[0]

async function fromCache(key: string): Promise<StoresResult | null> {
  const cached = (await loadSide<Cached>(CACHE)) ?? []
  // Same ingredients first; otherwise the last shops found around the same place.
  const hit = cached.find((c) => c.key === key) ?? cached.find((c) => placeOf(c.key) === placeOf(key))
  return hit ? { ...hit.result, offline: true } : null
}

/** Shops around a place, with the prices of the given ingredients; the last cached answer when offline. */
export async function fetchStores(place: GeoPoint, ids: string[]): Promise<StoresResult> {
  const key = cacheKey(place, ids)
  const p = roundPoint(place)
  let res: Response
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(ANON_KEY ? { Authorization: `Bearer ${ANON_KEY}` } : {}) },
      body: JSON.stringify({ lat: p.lat, lon: p.lon, ids }),
    })
  } catch {
    const cached = await fromCache(key)
    if (cached) return cached
    throw new StoresError('Pas de connexion, et rien en mémoire pour cet endroit.')
  }
  const json = (await res.json().catch(() => null)) as (Omit<StoresResult, 'offline'> & { error?: string }) | null
  if (!res.ok || !json?.stores) {
    const cached = await fromCache(key)
    if (cached) return cached
    throw new StoresError(res.status === 429 ? 'Trop de recherches en même temps. Réessaie dans une minute.' : 'Les magasins ne répondent pas pour le moment. Réessaie plus tard.')
  }
  const result = { stores: json.stores, pricesComplete: json.pricesComplete, updatedAt: json.updatedAt }
  // An empty list is not worth keeping for the offline mode.
  if (!result.stores.length) return { ...result, offline: false }
  const cached = (await loadSide<Cached>(CACHE)) ?? []
  await saveSide(CACHE, [{ key, result }, ...cached.filter((c) => c.key !== key)].slice(0, CACHE_SIZE))
  return { ...result, offline: false }
}
