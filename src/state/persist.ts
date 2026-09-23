import { decryptJson, encryptJson, type SealedBox } from '../crypto/vault'
import { getKey, keystoreAvailable, setKey } from '../crypto/keystore'
import { getState, onSavedChange, replaceSaved, savedOf, type PartialSaved, type SavedState } from './store'

/**
 * Data saved on the device, encrypted (AES-GCM) with a device key kept non-extractable in IndexedDB.
 * Without IndexedDB or WebCrypto (very old browsers, tests), the data stays in memory only.
 */
const BLOB_KEY = 'mijote:data:v2'
/** First version, saved in clear: migrated then deleted. */
const LEGACY_KEY = 'mijote:v1'

let deviceKey: CryptoKey | null = null
let chain: Promise<void> = Promise.resolve()

async function loadDeviceKey(): Promise<CryptoKey> {
  const existing = await getKey('device')
  if (existing) return existing
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
  await setKey('device', key)
  return key
}

async function write(saved: SavedState) {
  if (!deviceKey) return
  const box = await encryptJson(deviceKey, saved)
  localStorage.setItem(BLOB_KEY, JSON.stringify(box))
  localStorage.removeItem(LEGACY_KEY)
}

/** Loads the device data into the store, then saves every change. Call once before rendering. */
export async function initLocalData(): Promise<void> {
  if (!keystoreAvailable()) return
  try {
    deviceKey = await loadDeviceKey()
    const raw = localStorage.getItem(BLOB_KEY)
    const legacy = localStorage.getItem(LEGACY_KEY)
    if (raw) replaceSaved(await decryptJson<PartialSaved>(deviceKey, JSON.parse(raw) as SealedBox), 'local')
    else if (legacy) replaceSaved(JSON.parse(legacy) as PartialSaved, 'local')
  } catch {
    // Unreadable data (key lost with the browser data): start fresh rather than crash.
  }
  onSavedChange((saved) => {
    chain = chain.then(() => write(saved)).catch(() => {})
  })
  // Migrate a clear-text save right away.
  if (localStorage.getItem(LEGACY_KEY)) await write(savedOf(getState()))
}

/** Waits for pending writes (tests, sign-out). */
export const flushLocalData = () => chain

/** Deletes the device data (sign-out). */
export function clearLocalData() {
  localStorage.removeItem(BLOB_KEY)
  localStorage.removeItem(LEGACY_KEY)
}
