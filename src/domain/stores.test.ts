import { describe, expect, it } from 'vitest'
import { INGREDIENTS } from '../data/catalog.ts'
import { OFF_CATEGORIES } from '../data/offCategories.ts'
import { indexIngredients } from './matching.ts'
import {
  basket,
  brandKey,
  directionsUrl,
  distanceLabel,
  distanceMeters,
  overpassQuery,
  parseOpenPrices,
  parseOverpass,
  perGram,
  priceFilter,
  priceLabel,
  priceStores,
  roundPoint,
  sortStores,
  type PriceObservation,
  type PricedStore,
} from './stores.ts'

const byId = indexIngredients(INGREDIENTS)
const home = { lat: 48.8566, lon: 2.3522 }

describe('ingredient mapping', () => {
  it('maps every catalog ingredient to an Open Food Facts category', () => {
    expect(INGREDIENTS.filter((i) => !OFF_CATEGORIES[i.id]).map((i) => i.id)).toEqual([])
    for (const m of Object.values(OFF_CATEGORIES)) expect(m.tag).toMatch(/^(en|fr):[a-z-]+$/)
  })
  it('builds the Open Prices filter', () => {
    expect(priceFilter(OFF_CATEGORIES.tomate)).toEqual({ category_tag: 'en:tomatoes' })
    expect(priceFilter(OFF_CATEGORIES.oeufs)).toEqual({ product__categories_tags__contains: 'en:eggs' })
  })
})

describe('geography', () => {
  it('measures distances', () => {
    // Paris Hôtel de Ville → Notre-Dame: about 550 m.
    expect(distanceMeters(home, { lat: 48.853, lon: 2.3499 })).toBeGreaterThan(400)
    expect(distanceMeters(home, { lat: 48.853, lon: 2.3499 })).toBeLessThan(600)
    expect(distanceMeters(home, home)).toBe(0)
  })
  it('rounds positions to about 100 m', () => {
    expect(roundPoint({ lat: 48.85661, lon: 2.35222 })).toEqual({ lat: 48.857, lon: 2.352 })
  })
  it('labels distances and prices', () => {
    expect(distanceLabel(342)).toBe('340 m')
    expect(distanceLabel(1240)).toBe('1,2 km')
    expect(priceLabel(4.2)).toBe('≈ 4,20 €')
  })
  it('asks Overpass for supermarkets and grocers in the radius', () => {
    expect(overpassQuery(home)).toContain('(around:3000,48.8566,2.3522)')
    expect(overpassQuery(home)).toContain('nwr["shop"="supermarket"](around:3000,48.8566,2.3522);')
  })
})

describe('parseOverpass', () => {
  it('keeps shops, with a center for buildings and a fallback name', () => {
    const stores = parseOverpass({
      elements: [
        { type: 'node', id: 1, lat: 48.86, lon: 2.35, tags: { shop: 'convenience', name: 'U Express', brand: 'U Express', opening_hours: 'Mo-Sa 08:00-22:00' } },
        { type: 'way', id: 2, center: { lat: 48.85, lon: 2.34 }, tags: { shop: 'supermarket', brand: 'Lidl' } },
        { type: 'node', id: 3, lat: 48.85, lon: 2.34, tags: { shop: 'greengrocer' } },
        { type: 'node', id: 4, lat: 48.85, lon: 2.34, tags: { shop: 'bakery', name: 'Boulangerie' } },
        { type: 'way', id: 5, tags: { shop: 'supermarket' } },
      ],
    })
    expect(stores).toEqual([
      { id: 'node/1', name: 'U Express', brand: 'U Express', kind: 'convenience', lat: 48.86, lon: 2.35, hours: 'Mo-Sa 08:00-22:00' },
      { id: 'way/2', name: 'Lidl', brand: 'Lidl', kind: 'supermarket', lat: 48.85, lon: 2.34, hours: null },
      { id: 'node/3', name: 'Primeur', brand: null, kind: 'greengrocer', lat: 48.85, lon: 2.34, hours: null },
    ])
    expect(parseOverpass(null)).toEqual([])
  })
})

describe('prices', () => {
  const obs = (o: Partial<PriceObservation>): PriceObservation => ({
    ingredientId: 'tomate',
    price: 3,
    pricePer: 'KILOGRAM',
    quantity: null,
    quantityUnit: null,
    storeId: null,
    brand: null,
    country: 'FR',
    ...o,
  })

  it('reads Open Prices reports in euros only', () => {
    const got = parseOpenPrices(
      {
        items: [
          { price: 2.5, currency: 'EUR', price_per: 'KILOGRAM', location_osm_id: 9, location_osm_type: 'WAY', location: { osm_brand: 'Lidl', osm_address_country_code: 'FR' } },
          { price: 2.77, currency: 'EUR', price_per: null, product: { product_quantity: 696, product_quantity_unit: 'g' }, location: { osm_name: 'E.Leclerc' } },
          { price: 4, currency: 'CHF', price_per: 'KILOGRAM' },
        ],
      },
      'tomate',
    )
    expect(got).toEqual([
      obs({ price: 2.5, storeId: 'way/9', brand: 'Lidl' }),
      obs({ price: 2.77, pricePer: null, quantity: 696, quantityUnit: 'g', brand: 'E.Leclerc', country: null }),
    ])
  })

  it('converts reports to euros per gram', () => {
    const tomate = byId.get('tomate')!
    const oeufs = byId.get('oeufs')!
    const lait = byId.get('lait')!
    expect(perGram(obs({ price: 3 }), tomate)).toBeCloseTo(0.003)
    // Per unit: through the weight of one piece (an egg is 55 g).
    expect(perGram(obs({ price: 0.55, pricePer: 'UNIT' }), oeufs)).toBeCloseTo(0.01)
    // Product: through its size, 1 L of milk for 1.10 €.
    expect(perGram(obs({ price: 1.1, pricePer: null, quantity: 1, quantityUnit: 'l' }), lait)).toBeCloseTo(0.0011)
    expect(perGram(obs({ pricePer: null }), lait)).toBeNull()
    expect(perGram(obs({ price: 500 }), tomate)).toBeNull()
  })

  it('prices a shop from its own reports, else from its brand in France', () => {
    const stores = parseOverpass({
      elements: [
        { type: 'node', id: 1, lat: 48.86, lon: 2.35, tags: { shop: 'supermarket', name: 'Carrefour City', brand: 'Carrefour City' } },
        { type: 'node', id: 2, lat: 48.857, lon: 2.353, tags: { shop: 'supermarket', name: 'E. Leclerc', brand: 'E. Leclerc' } },
        { type: 'node', id: 3, lat: 48.85, lon: 2.35, tags: { shop: 'convenience', name: 'Chez Paul' } },
      ],
    })
    const priced = priceStores(
      stores,
      [
        obs({ price: 2, storeId: 'node/1', brand: 'Carrefour City' }),
        obs({ price: 4, storeId: 'node/1', brand: 'Carrefour City' }),
        obs({ price: 1.5, storeId: 'way/77', brand: 'E.Leclerc' }),
        obs({ price: 9, storeId: 'way/78', brand: 'E.Leclerc', country: 'BE' }),
      ],
      byId,
      home,
    )
    expect(priced[0].prices.tomate).toEqual({ perGram: 0.003, from: 'store', count: 2 })
    expect(priced[1].prices.tomate).toEqual({ perGram: 0.0015, from: 'brand', count: 1 })
    expect(priced[2].prices).toEqual({})
    expect(priced[1].distance).toBeLessThan(priced[0].distance)
    expect(brandKey('E. Leclerc')).toBe(brandKey('e-leclerc'))
  })
})

describe('basket and sorting', () => {
  const store = (id: string, distance: number, prices: PricedStore['prices']): PricedStore => ({ id, name: id, brand: null, kind: 'supermarket', lat: 0, lon: 0, hours: null, distance, prices })
  const items = [
    { id: 'tomate', qty: 4 },
    { id: 'feta', qty: 200 },
  ]

  it('adds up the known prices of the quantities to buy', () => {
    // 4 tomatoes (≈ 480 g at 3 €/kg) + 200 g of feta at 12 €/kg.
    const b = basket(store('a', 0, { tomate: { perGram: 0.003, from: 'store', count: 1 }, feta: { perGram: 0.012, from: 'brand', count: 3 } }), items, byId)
    expect(b.known).toBe(2)
    expect(b.count).toBe(2)
    expect(b.total).toBeCloseTo(grams(4) * 0.003 + 2.4, 2)
    expect(basket(store('b', 0, {}), items, byId)).toEqual({ total: null, known: 0, count: 2 })
  })

  it('sorts by distance, or by known price', () => {
    const t = (perGram: number) => ({ perGram, from: 'store' as const, count: 1 })
    const rows = [
      store('none-near', 100, {}),
      store('one-cheap', 200, { tomate: t(0.001) }),
      store('two-dear', 900, { tomate: t(0.004), feta: t(0.02) }),
      store('two-cheap', 1500, { tomate: t(0.003), feta: t(0.01) }),
      store('none-far', 2000, {}),
    ].map((s) => ({ store: s, basket: basket(s, items, byId) }))
    expect(sortStores(rows, 'near').map((r) => r.store.id)).toEqual(['none-near', 'one-cheap', 'two-dear', 'two-cheap', 'none-far'])
    expect(sortStores(rows, 'cheap').map((r) => r.store.id)).toEqual(['two-cheap', 'two-dear', 'one-cheap', 'none-near', 'none-far'])
  })

  it('opens directions in Plans', () => {
    expect(directionsUrl({ ...store('x', 0, {}), name: 'U Express', lat: 48.86, lon: 2.35 })).toBe('https://maps.apple.com/?daddr=48.86,2.35&q=U%20Express')
  })
})

/** Weight of n tomatoes, as `grams()` counts it. */
function grams(n: number) {
  return n * (byId.get('tomate')!.nutrition?.g ?? 100)
}
