import type { OffMatch } from '../data/offCategories.ts'
import { grams } from './nutrition.ts'
import type { Ingredient } from './types.ts'

/**
 * "Où les trouver ?": shops around the user (OpenStreetMap) and the price of the missing ingredients (Open Prices).
 * Pure functions, shared by the server route (server/stores.ts) and the app.
 */

export interface GeoPoint {
  lat: number
  lon: number
}

export type StoreKind = 'supermarket' | 'convenience' | 'grocery' | 'greengrocer'
export const STORE_KINDS: StoreKind[] = ['supermarket', 'convenience', 'grocery', 'greengrocer']
export const SEARCH_RADIUS_M = 3000

export interface Store extends GeoPoint {
  /** OpenStreetMap element, e.g. "node/270807219". */
  id: string
  name: string
  brand: string | null
  kind: StoreKind
  /** OSM `opening_hours`, as is. */
  hours: string | null
}

/** Price of an ingredient in a shop, in euros per gram (see `grams()`). */
export interface UnitPrice {
  perGram: number
  /** Seen in this very shop, or in another shop of the same brand. */
  from: 'store' | 'brand'
  /** Number of price reports behind it. */
  count: number
}

export interface PricedStore extends Store {
  /** Meters from the user. */
  distance: number
  /** By catalog ingredient id; missing when no price is known. */
  prices: Record<string, UnitPrice>
}

/** One Open Prices report, reduced to what we use. */
export interface PriceObservation {
  ingredientId: string
  price: number
  /** Raw food: per kilogram or per unit. Products: null, the product quantity tells the size. */
  pricePer: 'KILOGRAM' | 'UNIT' | null
  quantity: number | null
  quantityUnit: string | null
  /** OSM element of the shop, e.g. "node/270807219". */
  storeId: string | null
  brand: string | null
  country: string | null
}

// ——— Geography ———

/** Great-circle distance in meters. */
export function distanceMeters(a: GeoPoint, b: GeoPoint): number {
  const R = 6371000
  const rad = (d: number) => (d * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLon = rad(b.lon - a.lon)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2
  return Math.round(2 * R * Math.asin(Math.sqrt(h)))
}

/** Coordinates rounded to about 100 m: enough to find shops, and all the server ever sees or caches. */
export const roundPoint = (p: GeoPoint): GeoPoint => ({ lat: Math.round(p.lat * 1000) / 1000, lon: Math.round(p.lon * 1000) / 1000 })

export const isValidPoint = (p: GeoPoint) => Number.isFinite(p.lat) && Number.isFinite(p.lon) && Math.abs(p.lat) <= 90 && Math.abs(p.lon) <= 180

// ——— OpenStreetMap (Overpass) ———

/** One exact tag per kind rather than a regex: Overpass answers much faster (seconds, even in central Paris). */
export function overpassQuery(p: GeoPoint, radius = SEARCH_RADIUS_M): string {
  const around = `(around:${radius},${p.lat},${p.lon})`
  return `[out:json][timeout:25];(${STORE_KINDS.map((k) => `nwr["shop"="${k}"]${around};`).join('')});out center tags qt;`
}

const KIND_NAME: Record<StoreKind, string> = { supermarket: 'Supermarché', convenience: 'Épicerie', grocery: 'Épicerie', greengrocer: 'Primeur' }

/**
 * Overpass answers HTTP 200 even when it gives up (overloaded server, query timeout, memory):
 * the list is then empty and a `remark` says why. Returns that reason, or null for a real answer.
 */
export function overpassFailure(json: unknown): string | null {
  const j = json as { elements?: unknown; remark?: unknown } | null
  if (!j || !Array.isArray(j.elements)) return 'no elements'
  const remark = typeof j.remark === 'string' ? j.remark : ''
  return /runtime error|timed out|out of memory|rate.?limit|dispatcher|error/i.test(remark) ? remark : null
}

type OverpassElement = { type?: string; id?: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> }

/** Shops from an Overpass answer (`out center tags`), ways and relations placed at their center. */
export function parseOverpass(json: unknown): Store[] {
  const elements = (json as { elements?: OverpassElement[] } | null)?.elements
  if (!Array.isArray(elements)) return []
  const stores: Store[] = []
  for (const el of elements) {
    const tags = el.tags ?? {}
    const kind = tags.shop as StoreKind
    const lat = el.lat ?? el.center?.lat
    const lon = el.lon ?? el.center?.lon
    if (!STORE_KINDS.includes(kind) || lat == null || lon == null || !el.type || el.id == null) continue
    const brand = tags.brand?.trim() || null
    stores.push({
      id: `${el.type}/${el.id}`,
      name: tags.name?.trim() || brand || KIND_NAME[kind],
      brand,
      kind,
      lat,
      lon,
      hours: tags.opening_hours?.trim() || null,
    })
  }
  return stores
}

// ——— Open Prices ———

/** Query parameters that select the prices of an ingredient. */
export function priceFilter(match: OffMatch): Record<string, string> {
  return match.kind === 'category' ? { category_tag: match.tag } : { product__categories_tags__contains: match.tag }
}

type OpenPricesItem = {
  price?: number
  currency?: string
  price_per?: string | null
  location_osm_id?: number | null
  location_osm_type?: string | null
  product?: { product_quantity?: number | null; product_quantity_unit?: string | null } | null
  location?: { osm_brand?: string | null; osm_name?: string | null; osm_address_country_code?: string | null } | null
}

/** Euro prices from an Open Prices answer (`/api/v1/prices`). */
export function parseOpenPrices(json: unknown, ingredientId: string): PriceObservation[] {
  const items = (json as { items?: OpenPricesItem[] } | null)?.items
  if (!Array.isArray(items)) return []
  return items
    .filter((it) => it.currency === 'EUR' && typeof it.price === 'number' && it.price > 0)
    .map((it) => ({
      ingredientId,
      price: it.price!,
      pricePer: it.price_per === 'KILOGRAM' || it.price_per === 'UNIT' ? it.price_per : null,
      quantity: it.product?.product_quantity || null,
      quantityUnit: it.product?.product_quantity_unit?.toLowerCase() || null,
      storeId: it.location_osm_type && it.location_osm_id ? `${it.location_osm_type.toLowerCase()}/${it.location_osm_id}` : null,
      brand: it.location?.osm_brand || it.location?.osm_name || null,
      country: it.location?.osm_address_country_code || null,
    }))
}

/** Grams (or milliliters) in a product quantity. */
const GRAMS_PER: Record<string, number> = { g: 1, kg: 1000, mg: 0.001, ml: 1, cl: 10, dl: 100, l: 1000 }

/** Above 200 €/kg, a report is a typo or a luxury item: ignored. */
const MAX_PER_GRAM = 0.2

/** Price of one report in euros per gram of the ingredient, or null when it can't be compared. */
export function perGram(obs: PriceObservation, ing: Ingredient): number | null {
  let v: number | null = null
  if (obs.pricePer === 'KILOGRAM') v = obs.price / 1000
  else if (obs.pricePer === 'UNIT') v = ing.nutrition?.g ? obs.price / ing.nutrition.g : null
  else if (obs.quantity && obs.quantityUnit && GRAMS_PER[obs.quantityUnit]) v = obs.price / (obs.quantity * GRAMS_PER[obs.quantityUnit])
  return v != null && v > 0 && v <= MAX_PER_GRAM ? v : null
}

/** "E.Leclerc", "E. Leclerc" and "e-leclerc" are the same brand. */
export const brandKey = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b)
  const m = s.length >> 1
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

/**
 * Prices each shop: the reports of the shop itself when there are some, otherwise those of its brand in France.
 * The median resists odd reports (a promotion, a wrong product size).
 */
export function priceStores(
  stores: Store[],
  observations: PriceObservation[],
  byId: Map<string, Ingredient>,
  origin: GeoPoint,
): PricedStore[] {
  // ingredient → shop or brand → prices per gram
  const byStore = new Map<string, number[]>()
  const byBrand = new Map<string, number[]>()
  const push = (m: Map<string, number[]>, k: string, v: number) => m.set(k, [...(m.get(k) ?? []), v])
  for (const o of observations) {
    const ing = byId.get(o.ingredientId)
    const v = ing && perGram(o, ing)
    if (v == null) continue
    if (o.storeId) push(byStore, `${o.ingredientId}|${o.storeId}`, v)
    if (o.brand && (o.country == null || o.country === 'FR')) push(byBrand, `${o.ingredientId}|${brandKey(o.brand)}`, v)
  }
  const ids = [...new Set(observations.map((o) => o.ingredientId))]
  return stores.map((s) => {
    const prices: Record<string, UnitPrice> = {}
    for (const id of ids) {
      const own = byStore.get(`${id}|${s.id}`)
      const brand = s.brand ? byBrand.get(`${id}|${brandKey(s.brand)}`) : undefined
      if (own) prices[id] = { perGram: median(own), from: 'store', count: own.length }
      else if (brand) prices[id] = { perGram: median(brand), from: 'brand', count: brand.length }
    }
    return { ...s, distance: distanceMeters(origin, s), prices }
  })
}

// ——— Basket and sorting ———

export interface BasketItem {
  id: string
  /** Quantity to buy, in the ingredient's base unit. */
  qty: number
}

export interface Basket {
  /** Estimated price of the ingredients whose price is known, or null when none is. */
  total: number | null
  known: number
  count: number
}

export function basket(store: PricedStore, items: BasketItem[], byId: Map<string, Ingredient>): Basket {
  let total = 0
  let known = 0
  for (const it of items) {
    const price = store.prices[it.id]
    const ing = byId.get(it.id)
    if (!price || !ing) continue
    total += price.perGram * grams(it.qty, ing)
    known++
  }
  return { total: known ? Math.round(total * 100) / 100 : null, known, count: items.length }
}

export type StoreSort = 'near' | 'cheap'

/**
 * "Le plus proche": by distance. "Le moins cher": only known prices are compared, so the shops that know
 * the most prices come first, then the cheapest; shops without any known price close the list, by distance.
 */
export function sortStores<T extends { store: PricedStore; basket: Basket }>(rows: T[], by: StoreSort): T[] {
  const near = (a: T, b: T) => a.store.distance - b.store.distance
  if (by === 'near') return [...rows].sort(near)
  return [...rows].sort((a, b) => {
    if (!a.basket.known || !b.basket.known) return b.basket.known - a.basket.known || near(a, b)
    return b.basket.known - a.basket.known || a.basket.total! - b.basket.total! || near(a, b)
  })
}

// ——— Display ———

export const distanceLabel = (m: number) => (m < 1000 ? `${Math.max(10, Math.round(m / 10) * 10)} m` : `${(m / 1000).toFixed(1).replace('.', ',')} km`)

export const priceLabel = (euros: number) => `≈ ${euros.toFixed(2).replace('.', ',')} €`

/** Directions in Plans (Apple Maps); other devices open maps.apple.com in the browser. */
export const directionsUrl = (s: Store) => `https://maps.apple.com/?daddr=${s.lat},${s.lon}&q=${encodeURIComponent(s.name)}`
