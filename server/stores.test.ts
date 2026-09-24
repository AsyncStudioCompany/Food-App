import { describe, expect, it, vi } from 'vitest'
import { createStoresService, handleStores, parseStoresRequest, USER_AGENT } from './stores.ts'

const request = { lat: 48.85661, lon: 2.35222, ids: ['tomate', 'feta'] }

const overpass = {
  elements: [
    { type: 'node', id: 1, lat: 48.858, lon: 2.353, tags: { shop: 'convenience', name: 'U Express', brand: 'U Express', opening_hours: 'Mo-Sa 08:00-22:00' } },
    { type: 'way', id: 2, center: { lat: 48.86, lon: 2.36 }, tags: { shop: 'supermarket', name: 'Lidl', brand: 'Lidl' } },
  ],
}

function prices(url: URL) {
  const local = url.searchParams.has('lat')
  if (url.searchParams.get('category_tag') === 'en:tomatoes' && local) {
    return { items: [{ price: 3, currency: 'EUR', price_per: 'KILOGRAM', location_osm_id: 1, location_osm_type: 'NODE', location: { osm_brand: 'U Express', osm_address_country_code: 'FR' } }] }
  }
  if (url.searchParams.get('product__categories_tags__contains') === 'en:feta' && !local) {
    return { items: [{ price: 2.4, currency: 'EUR', product: { product_quantity: 200, product_quantity_unit: 'g' }, location_osm_id: 99, location_osm_type: 'WAY', location: { osm_brand: 'Lidl', osm_address_country_code: 'FR' } }] }
  }
  return { items: [] }
}

/** Simulated Overpass and Open Prices. */
/** What Overpass answers when it gives up: HTTP 200, no element, and a remark. */
const overpassGaveUp = { elements: [], remark: 'runtime error: Query timed out in "query" at line 1 after 26 seconds.' }

function fakeApis(opts: { overpassDown?: boolean; pricesDown?: boolean; overpass?: (url: URL) => unknown } = {}) {
  const fetch = vi.fn(async (input: string | URL | Request, _init?: RequestInit) => {
    const url = new URL(String(input))
    if (url.pathname === '/api/interpreter') return opts.overpassDown ? new Response('busy', { status: 504 }) : Response.json(opts.overpass ? opts.overpass(url) : overpass)
    if (url.host === 'prices.openfoodfacts.org') return opts.pricesDown ? new Response('oops', { status: 500 }) : Response.json(prices(url))
    return new Response(null, { status: 404 })
  })
  return { fetch: fetch as unknown as typeof globalThis.fetch, calls: fetch.mock.calls }
}

describe('parseStoresRequest', () => {
  it('accepts a position and catalog ids, and rejects the rest', () => {
    expect(parseStoresRequest({ ...request, ids: ['tomate', 'tomate'] }).ids).toEqual(['tomate'])
    expect(() => parseStoresRequest({ ...request, lat: 120 })).toThrow()
    expect(() => parseStoresRequest({ ...request, ids: ['truffe'] })).toThrow()
    expect(() => parseStoresRequest({ ...request, ids: [] })).toThrow()
  })
})

describe('handleStores', () => {
  it('lists the nearest shops with their prices', async () => {
    const api = fakeApis()
    const { status, json } = await handleStores(request, createStoresService({ fetch: api.fetch }))
    expect(status).toBe(200)
    const { stores, pricesComplete } = json as { stores: { id: string; distance: number; prices: Record<string, { from: string; perGram: number }> }[]; pricesComplete: boolean }
    expect(pricesComplete).toBe(true)
    expect(stores.map((s) => s.id)).toEqual(['node/1', 'way/2'])
    expect(stores[0].prices.tomate).toEqual({ perGram: 0.003, from: 'store', count: 1 })
    expect(stores[1].prices.feta).toEqual({ perGram: 0.012, from: 'brand', count: 1 })
    expect(stores[0].distance).toBeLessThan(stores[1].distance)
  })

  it('sends a User-Agent and only a rounded position', async () => {
    const api = fakeApis()
    await handleStores(request, createStoresService({ fetch: api.fetch }))
    for (const [, init] of api.calls) expect((init as RequestInit).headers).toMatchObject({ 'User-Agent': USER_AGENT })
    const overpassCall = api.calls.find(([u]) => String(u).includes('/api/interpreter'))!
    const overpassBody = String((overpassCall[1] as RequestInit).body)
    expect(decodeURIComponent(overpassBody)).toContain('around:3000,48.857,2.352')
    const local = api.calls.map(([u]) => new URL(String(u))).find((u) => u.searchParams.has('lat'))!
    expect(local.searchParams.get('lat')).toBe('48.857')
  })

  it('caches the answers', async () => {
    const api = fakeApis()
    const service = createStoresService({ fetch: api.fetch })
    await handleStores(request, service)
    const first = api.calls.length
    expect(first).toBe(1 + 2 * 2)
    await handleStores({ ...request, lat: 48.85659 }, service)
    expect(api.calls.length).toBe(first)
  })

  it('keeps the shops when prices fail, and answers 502 without shops', async () => {
    const noPrices = await handleStores(request, createStoresService({ fetch: fakeApis({ pricesDown: true }).fetch }))
    expect(noPrices.status).toBe(200)
    expect(noPrices.json).toMatchObject({ pricesComplete: false })
    const down = fakeApis({ overpassDown: true })
    expect(await handleStores(request, createStoresService({ fetch: down.fetch }))).toEqual({ status: 502, json: { error: 'stores_unavailable' } })
    // The main server twice, then both mirrors.
    expect(down.calls.filter(([u]) => String(u).includes('/api/interpreter')).length).toBe(4)
  })

  it('does not take an Overpass that gave up for "no shop around"', async () => {
    // The main server gives up (twice), a mirror answers.
    const mirror = fakeApis({ overpass: (url) => (url.host === 'overpass-api.de' ? overpassGaveUp : overpass) })
    const saved = await handleStores(request, createStoresService({ fetch: mirror.fetch }))
    expect(saved.status).toBe(200)
    expect((saved.json as { stores: unknown[] }).stores).toHaveLength(2)
    // Both give up: an error the app can retry, not an empty list.
    const both = fakeApis({ overpass: () => overpassGaveUp })
    const service = createStoresService({ fetch: both.fetch })
    expect(await handleStores(request, service)).toEqual({ status: 502, json: { error: 'stores_unavailable' } })
    // Nothing kept in cache: the next try asks Overpass again.
    const before = both.calls.filter(([u]) => String(u).includes('/api/interpreter')).length
    await handleStores(request, service)
    expect(both.calls.filter(([u]) => String(u).includes('/api/interpreter')).length).toBe(before + 4)
  })

  it('keeps a real empty answer only a few minutes', async () => {
    let t = 0
    const api = fakeApis({ overpass: () => ({ elements: [] }) })
    const service = createStoresService({ fetch: api.fetch, now: () => t })
    const overpassCalls = () => api.calls.filter(([u]) => String(u).includes('/api/interpreter')).length
    expect(await handleStores(request, service)).toMatchObject({ status: 200, json: { stores: [] } })
    await handleStores(request, service)
    expect(overpassCalls()).toBe(1)
    t += 11 * 60_000
    await handleStores(request, service)
    expect(overpassCalls()).toBe(2)
  })

  it('limits the calls to the open services', async () => {
    const api = fakeApis()
    let t = 0
    const service = createStoresService({ fetch: api.fetch, now: () => t })
    const answers = []
    for (let k = 0; k < 30; k++) answers.push((await handleStores({ ...request, lat: 45 + k / 10 }, service)).status)
    expect(answers).toContain(429)
    expect(api.calls.length).toBeLessThanOrEqual(60)
    t += 61_000
    expect((await handleStores({ ...request, lat: 30 }, service)).status).toBe(200)
  })

  it('answers 400 on a bad body', async () => {
    expect(await handleStores({ nope: true })).toEqual({ status: 400, json: { error: 'bad_request' } })
  })
})
