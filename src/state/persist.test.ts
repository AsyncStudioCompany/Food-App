import 'fake-indexeddb/auto'
import { describe, expect, it, vi } from 'vitest'

describe('device data', () => {
  it('is stored encrypted, survives a reload, and old clear-text saves are migrated', async () => {
    localStorage.clear()
    localStorage.setItem('mijote:v1', JSON.stringify({ fridge: { oeufs: { qty: 6, unit: 'pc', expiresOn: null } } }))

    const first = await import('./persist')
    const store = await import('./store')
    await first.initLocalData()
    expect(store.getState().fridge.oeufs.qty).toBe(6)
    expect(localStorage.getItem('mijote:v1')).toBeNull()

    store.setState({ liked: { r12: true } })
    await first.flushLocalData()
    const raw = localStorage.getItem('mijote:data:v2')!
    expect(raw).not.toContain('oeufs')
    expect(raw).not.toContain('r12')

    // "Reload": fresh modules, same browser storage and IndexedDB.
    vi.resetModules()
    const again = await import('./persist')
    const store2 = await import('./store')
    expect(store2.getState().fridge).toEqual({})
    await again.initLocalData()
    expect(store2.getState().fridge.oeufs.qty).toBe(6)
    expect(store2.getState().liked).toEqual({ r12: true })
  })
})
