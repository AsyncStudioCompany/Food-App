/**
 * End-to-end encryption of the user's data (WebCrypto only, no dependency).
 *
 * From the e-mail and password we derive (PBKDF2 then HKDF):
 *  - an auth password, sent to the account server instead of the real password;
 *  - a key-encryption key (KEK) that never leaves the device.
 * The data itself is encrypted with a random data key (DEK, AES-GCM 256). The server only stores
 * the DEK wrapped by the KEK and the encrypted data: without the password, nobody can read them.
 */

const enc = new TextEncoder()
const dec = new TextDecoder()

/** OWASP 2023 recommendation for PBKDF2-HMAC-SHA256. */
export const PBKDF2_ITERATIONS = 600_000

export interface SealedBox {
  /** Base64 initialization vector (12 bytes). */
  iv: string
  /** Base64 ciphertext (with the GCM tag). */
  data: string
}

export function toBase64(bytes: ArrayBuffer | Uint8Array): string {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  let s = ''
  for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode(...u8.subarray(i, i + 0x8000))
  return btoa(s)
}

export function fromBase64(b64: string): Uint8Array<ArrayBuffer> {
  const s = atob(b64)
  const out = new Uint8Array(s.length)
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i)
  return out
}

const randomIv = () => crypto.getRandomValues(new Uint8Array(12))

export const normalizeEmail = (email: string) => email.trim().toLowerCase()

export interface DerivedKeys {
  /** Sent to the account server as the password (hex, 64 chars). */
  authPassword: string
  /** Wraps and unwraps the data key. Not extractable. */
  kek: CryptoKey
}

export async function deriveKeys(email: string, password: string, iterations = PBKDF2_ITERATIONS): Promise<DerivedKeys> {
  // Deterministic salt so both devices derive the same keys before any server round trip.
  const salt = await crypto.subtle.digest('SHA-256', enc.encode('mijote/v1/' + normalizeEmail(email)))
  const base = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'])
  const master = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, base, 256)
  const hkdf = await crypto.subtle.importKey('raw', master, 'HKDF', false, ['deriveBits', 'deriveKey'])
  const info = (label: string) => ({ name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(), info: enc.encode(label) })
  const auth = await crypto.subtle.deriveBits(info('mijote/auth'), hkdf, 256)
  const kek = await crypto.subtle.deriveKey(info('mijote/kek'), hkdf, { name: 'AES-GCM', length: 256 }, false, ['wrapKey', 'unwrapKey'])
  const authPassword = [...new Uint8Array(auth)].map((b) => b.toString(16).padStart(2, '0')).join('')
  return { authPassword, kek }
}

/** New random data key. Extractable once, so it can be wrapped; keep a non-extractable copy on the device. */
export function newDataKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt'])
}

export async function wrapDataKey(dek: CryptoKey, kek: CryptoKey): Promise<SealedBox> {
  const iv = randomIv()
  const wrapped = await crypto.subtle.wrapKey('raw', dek, kek, { name: 'AES-GCM', iv })
  return { iv: toBase64(iv), data: toBase64(wrapped) }
}

/** Throws when the password (hence the KEK) is wrong. */
export function unwrapDataKey(box: SealedBox, kek: CryptoKey, extractable = false): Promise<CryptoKey> {
  return crypto.subtle.unwrapKey('raw', fromBase64(box.data), kek, { name: 'AES-GCM', iv: fromBase64(box.iv) }, { name: 'AES-GCM' }, extractable, [
    'encrypt',
    'decrypt',
  ])
}

/** Non-extractable copy of a key, safe to keep in IndexedDB. */
export async function lockKey(key: CryptoKey): Promise<CryptoKey> {
  const raw = await crypto.subtle.exportKey('raw', key)
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
}

export async function encryptJson(key: CryptoKey, value: unknown): Promise<SealedBox> {
  const iv = randomIv()
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(value)))
  return { iv: toBase64(iv), data: toBase64(data) }
}

/** Throws when the key is wrong or the data was tampered with. */
export async function decryptJson<T>(key: CryptoKey, box: SealedBox): Promise<T> {
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64(box.iv) }, key, fromBase64(box.data))
  return JSON.parse(dec.decode(plain)) as T
}
