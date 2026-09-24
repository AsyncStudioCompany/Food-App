import { z } from 'zod'
import { INGREDIENTS } from '../src/data/catalog.ts'
import { OFF_CATEGORIES } from '../src/data/offCategories.ts'
import { indexIngredients } from '../src/domain/matching.ts'
import {
  isValidPoint,
  overpassFailure,
  overpassQuery,
  parseOpenPrices,
  parseOverpass,
  priceFilter,
  priceStores,
  roundPoint,
  type GeoPoint,
  type PricedStore,
  type PriceObservation,
} from '../src/domain/stores.ts'

/**
 * POST /api/stores: shops near the user (OpenStreetMap, through Overpass) and the price of the missing
 * ingredients (Open Prices). Shared by the local server (Vite), Vercel and Supabase, like recipeAI.ts.
 * No API key: both services are open, so we are polite with them (User-Agent, cache, call budget).
 */

const byId = indexIngredients(INGREDIENTS)

/** Open services ask to be told who calls them. */
export const USER_AGENT = 'Mijote/1.0 (appli perso de recettes anti-gaspillage; +https://github.com/AsyncStudioCompany/Food-App)'
/**
 * Overpass servers. The main one answers in a few seconds but often turns requests away; the mirrors are
 * slower but steadier. We ask the main one, then, if it fails, the main one again and the mirrors at the
 * same time, and keep the first valid answer (at most ~45 s: the Vercel function stops after 60 s).
 */
const OVERPASS_MAIN = 'https://overpass-api.de/api/interpreter'
const OVERPASS_MIRRORS = ['https://maps.mail.ru/osm/tools/overpass/api/interpreter', 'https://overpass.private.coffee/api/interpreter']
const OVERPASS_TIMEOUT = { first: 20_000, second: 25_000 }
const OPEN_PRICES_URL = 'https://prices.openfoodfacts.org/api/v1/prices'

/** Shops listed, at most (the nearest). */
const MAX_STORES = 30
/** Ingredients priced per request, at most. */
const MAX_IDS = 12
/** Radius of the local price search: a bit wider than the shop search, reports are scarce. */
const PRICE_RADIUS_KM = 5

const HOUR = 3600_000
const TTL = { shops: 24 * HOUR, noShops: 10 * 60_000, localPrices: 6 * HOUR, brandPrices: 12 * HOUR }
/** Calls to Overpass and Open Prices per minute, all users together. */
const CALLS_PER_MINUTE = 60
const MAX_CACHE_ENTRIES = 500

export interface StoresRequest extends GeoPoint {
  ids: string[]
}

export interface StoresResponse {
  stores: PricedStore[]
  /** False when some price lookups failed: prices are even more partial than usual. */
  pricesComplete: boolean
  updatedAt: string
}

/** Validates the untrusted request body. */
export function parseStoresRequest(body: unknown): StoresRequest {
  const schema = z.object({
    lat: z.number().min(-90).max(90),
    lon: z.number().min(-180).max(180),
    ids: z
      .array(z.string().refine((id) => byId.has(id), 'unknown ingredient'))
      .min(1)
      .max(MAX_IDS),
  })
  const req = schema.parse(body)
  return { ...req, ids: [...new Set(req.ids)] }
}

export class UpstreamError extends Error {}
class BudgetExceeded extends UpstreamError {}

type Fetch = typeof fetch

export interface StoresServiceOptions {
  fetch?: Fetch
  now?: () => number
}

/** A service with its own cache and call budget (one per server instance; tests make their own). */
export function createStoresService({ fetch: fetchFn = globalThis.fetch, now = Date.now }: StoresServiceOptions = {}) {
  const cache = new Map<string, { expires: number; value: Promise<unknown> }>()
  let calls: number[] = []

  /** Spends one call of the budget, or refuses. */
  function spend() {
    const t = now()
    calls = calls.filter((c) => t - c < 60_000)
    if (calls.length >= CALLS_PER_MINUTE) throw new BudgetExceeded('call budget exceeded')
    calls.push(t)
  }

  /** Cached JSON call; concurrent identical calls share one request, failures are not kept. `ttl` can depend on the answer. */
  function cached(key: string, ttl: number | ((value: unknown) => number), load: () => Promise<unknown>): Promise<unknown> {
    const t = now()
    const hit = cache.get(key)
    if (hit && hit.expires > t) return hit.value
    if (cache.size >= MAX_CACHE_ENTRIES) {
      for (const [k, v] of cache) if (v.expires <= t) cache.delete(k)
      if (cache.size >= MAX_CACHE_ENTRIES) cache.delete(cache.keys().next().value!)
    }
    const value = load()
    const entry = { expires: t + (typeof ttl === 'number' ? ttl : TTL.noShops), value }
    cache.set(key, entry)
    value.then(
      (v) => typeof ttl === 'function' && (entry.expires = t + ttl(v)),
      () => cache.delete(key),
    )
    return value
  }

  async function getJson(url: string, init: RequestInit, timeoutMs: number): Promise<unknown> {
    spend()
    const res = await fetchFn(url, {
      ...init,
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json', ...init.headers },
      signal: AbortSignal.timeout(timeoutMs),
    })
    if (!res.ok) throw new UpstreamError(`${new URL(url).host} answered ${res.status}`)
    return res.json()
  }

  function shopsAround(p: GeoPoint) {
    const query = overpassQuery(p)
    // An empty answer is kept only 10 minutes: it may come from a server that was struggling.
    const ttl = (json: unknown) => (parseOverpass(json).length ? TTL.shops : TTL.noShops)
    const ask = async (url: string, timeout: number) => {
      const json = await getJson(url, { method: 'POST', body: new URLSearchParams({ data: query }), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }, timeout)
      // "200, but I gave up": an empty list that must not pass for "no shop around".
      const failure = overpassFailure(json)
      if (failure) throw new UpstreamError(`Overpass: ${failure}`)
      return json
    }
    return cached(`osm|${p.lat},${p.lon}`, ttl, async () => {
      try {
        return await ask(OVERPASS_MAIN, OVERPASS_TIMEOUT.first)
      } catch (e) {
        if (e instanceof BudgetExceeded) throw e
      }
      try {
        return await Promise.any([OVERPASS_MAIN, ...OVERPASS_MIRRORS].map((url) => ask(url, OVERPASS_TIMEOUT.second)))
      } catch (e) {
        const errors = e instanceof AggregateError ? e.errors : [e]
        throw errors.find((x) => x instanceof BudgetExceeded) ?? errors[0]
      }
    })
  }

  /** Recent euro prices of an ingredient, around the user or anywhere (for the brand of each shop). */
  function prices(id: string, around: GeoPoint | null) {
    const params = new URLSearchParams({ ...priceFilter(OFF_CATEGORIES[id]), currency: 'EUR', order_by: '-date', size: '100' })
    if (around) {
      params.set('lat', String(around.lat))
      params.set('lon', String(around.lon))
      params.set('radius_km', String(PRICE_RADIUS_KM))
    }
    const url = `${OPEN_PRICES_URL}?${params}`
    return cached(url, around ? TTL.localPrices : TTL.brandPrices, () => getJson(url, {}, 15_000)).then((json) => parseOpenPrices(json, id))
  }

  async function findStores(req: StoresRequest): Promise<StoresResponse> {
    // All the server ever uses or caches is a position rounded to about 100 m.
    const origin = roundPoint(req)
    if (!isValidPoint(origin)) throw new UpstreamError('bad position')
    // Prices don't depend on the shops: look them up at the same time.
    const priceLookups = Promise.allSettled(req.ids.flatMap((id) => (OFF_CATEGORIES[id] ? [prices(id, origin), prices(id, null)] : [])))
    const shops = parseOverpass(await shopsAround(origin))
    const lookups = await priceLookups
    const observations: PriceObservation[] = lookups.flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
    const stores = priceStores(shops, observations, byId, origin)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, MAX_STORES)
    return { stores, pricesComplete: lookups.every((r) => r.status === 'fulfilled'), updatedAt: new Date(now()).toISOString() }
  }

  return { findStores }
}

export type StoresService = ReturnType<typeof createStoresService>

let shared: StoresService | undefined
/** The service of this server instance (warm instances keep their cache). */
export const defaultStoresService = () => (shared ??= createStoresService())

export async function handleStores(body: unknown, service: StoresService = defaultStoresService()): Promise<{ status: number; json: unknown }> {
  let req: StoresRequest
  try {
    req = parseStoresRequest(body)
  } catch {
    return { status: 400, json: { error: 'bad_request' } }
  }
  try {
    return { status: 200, json: await service.findStores(req) }
  } catch (e) {
    if (e instanceof BudgetExceeded) return { status: 429, json: { error: 'busy' } }
    return { status: 502, json: { error: 'stores_unavailable' } }
  }
}
