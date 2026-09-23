import { describe, expect, it } from 'vitest'
import { decryptJson, deriveKeys, encryptJson, fromBase64, lockKey, newDataKey, toBase64, unwrapDataKey, wrapDataKey } from './vault'

const IT = 1000 // fast in tests; the app uses 600 000

describe('vault crypto', () => {
  it('derives the same keys on every device, never the password itself', async () => {
    const a = await deriveKeys('Moi@Exemple.fr ', 'secret-123', IT)
    const b = await deriveKeys('moi@exemple.fr', 'secret-123', IT)
    const c = await deriveKeys('moi@exemple.fr', 'secret-124', IT)
    expect(a.authPassword).toMatch(/^[0-9a-f]{64}$/)
    expect(a.authPassword).toBe(b.authPassword)
    expect(a.authPassword).not.toBe(c.authPassword)
    expect(a.authPassword).not.toContain('secret')
  })

  it('wraps the data key with the password key; a wrong password cannot unwrap it', async () => {
    const good = await deriveKeys('moi@exemple.fr', 'secret-123', IT)
    const bad = await deriveKeys('moi@exemple.fr', 'wrong-pass', IT)
    const dek = await newDataKey()
    const box = await encryptJson(dek, { fridge: { oeufs: { qty: 6 } } })
    const wrapped = await wrapDataKey(dek, good.kek)
    const again = await unwrapDataKey(wrapped, good.kek)
    expect(await decryptJson(again, box)).toEqual({ fridge: { oeufs: { qty: 6 } } })
    await expect(unwrapDataKey(wrapped, bad.kek)).rejects.toThrow()
  })

  it('detects tampering and uses a fresh IV every time', async () => {
    const key = await lockKey(await newDataKey())
    const a = await encryptJson(key, { x: 1 })
    const b = await encryptJson(key, { x: 1 })
    expect(a.iv).not.toBe(b.iv)
    expect(a.data).not.toBe(b.data)
    const bytes = fromBase64(a.data)
    bytes[0] ^= 1
    await expect(decryptJson(key, { iv: a.iv, data: toBase64(bytes) })).rejects.toThrow()
    await expect(crypto.subtle.exportKey('raw', key)).rejects.toThrow() // locked keys cannot be read back
  })

  it('base64 round-trips large buffers', () => {
    const big = crypto.getRandomValues(new Uint8Array(200_000).subarray(0, 65536))
    expect(fromBase64(toBase64(big))).toEqual(big)
  })
})
