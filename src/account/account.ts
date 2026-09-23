import { useSyncExternalStore } from 'react'
import { deleteKey, getKey, keystoreAvailable, setKey } from '../crypto/keystore'
import {
  decryptJson,
  deriveKeys,
  encryptJson,
  lockKey,
  newDataKey,
  normalizeEmail,
  PBKDF2_ITERATIONS,
  unwrapDataKey,
  wrapDataKey,
} from '../crypto/vault'
import { clearLocalData, flushLocalData } from '../state/persist'
import { getState, onSavedChange, replaceSaved, resetState, savedOf, type SavedState } from '../state/store'
import { AccountError, type AccountBackend } from './backend'

/**
 * Account with end-to-end encrypted sync. The server gets an auth password derived from the real one,
 * the data key wrapped by a key derived from the password, and the encrypted data: nothing readable.
 * The data key stays on the device (IndexedDB, non-extractable) so the app reopens without the password.
 */

export interface AccountState {
  /** `unavailable`: no account server configured (or no WebCrypto/IndexedDB). */
  status: 'unavailable' | 'signedOut' | 'signedIn'
  email: string | null
  /** A long operation is running (key derivation, first sync). */
  busy: boolean
  syncing: boolean
  /** Server time of the last data we sent or received. */
  lastSync: string | null
  error: string | null
  notice: string | null
}

/** Not secret: the wrapped key is useless without the password. */
interface Meta {
  userId: string
  email: string
  wrappedKey: string
  wrapIv: string
  lastSync: string
}

const META_KEY = 'mijote:account'
const PUSH_DELAY = 1500

let backend: AccountBackend | null = null
let iterations = PBKDF2_ITERATIONS
let dek: CryptoKey | null = null
let meta: Meta | null = null
let pushTimer: ReturnType<typeof setTimeout> | undefined
let unsubscribe: (() => void) | null = null
let listening = false

let state: AccountState = { status: 'unavailable', email: null, busy: false, syncing: false, lastSync: null, error: null, notice: null }
const listeners = new Set<() => void>()
function set(patch: Partial<AccountState>) {
  state = { ...state, ...patch }
  listeners.forEach((l) => l())
}

export const getAccount = () => state
export function useAccount(): AccountState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => state,
  )
}

function readMeta(): Meta | null {
  try {
    return JSON.parse(localStorage.getItem(META_KEY) ?? 'null') as Meta | null
  } catch {
    return null
  }
}
function writeMeta(m: Meta | null) {
  meta = m
  if (m) localStorage.setItem(META_KEY, JSON.stringify(m))
  else localStorage.removeItem(META_KEY)
}

const message = (e: unknown) =>
  e instanceof AccountError ? e.message : e instanceof DOMException && e.name === 'OperationError' ? 'Mot de passe incorrect.' : 'Pas de connexion au serveur. Réessaie.'

/** Chooses the account server (null: accounts off). `pbkdf2Iterations` is lowered in tests only. */
export function configureAccount(b: AccountBackend | null, options: { pbkdf2Iterations?: number } = {}) {
  backend = b
  iterations = options.pbkdf2Iterations ?? PBKDF2_ITERATIONS
  dek = null
  meta = null
  clearTimeout(pushTimer)
  unsubscribe?.()
  unsubscribe = null
  state = { status: 'unavailable', email: null, busy: false, syncing: false, lastSync: null, error: null, notice: null }
}

/** Restores the session of this device, then keeps the data in sync. */
export async function initAccount() {
  if (!backend || !keystoreAvailable()) return set({ status: 'unavailable' })
  unsubscribe ??= onSavedChange((_saved, source) => source === 'local' && schedulePush())
  if (typeof window !== 'undefined' && !listening) {
    listening = true
    window.addEventListener('focus', () => void pull())
    document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && void pull())
  }
  const m = readMeta()
  const [session, key] = await Promise.all([backend.session().catch(() => null), getKey('dek').catch(() => undefined)])
  if (session && key && m && m.userId === session.userId) {
    dek = key
    meta = m
    set({ status: 'signedIn', email: m.email, lastSync: m.lastSync })
    await pull()
  } else set({ status: 'signedOut' })
}

function validate(email: string, password: string, creating: boolean) {
  if (!/^\S+@\S+\.\S+$/.test(email.trim())) throw new AccountError("Cette adresse e-mail n'est pas valide.")
  if (creating && password.length < 8) throw new AccountError("Choisis un mot de passe d'au moins 8 caractères.")
  if (!password) throw new AccountError('Entre ton mot de passe.')
}

export async function signUp(email: string, password: string) {
  if (!backend) return
  set({ busy: true, error: null, notice: null })
  try {
    validate(email, password, true)
    const keys = await deriveKeys(email, password, iterations)
    const { confirmEmail } = await backend.signUp(normalizeEmail(email), keys.authPassword)
    if (confirmEmail) return set({ busy: false, notice: "On t'a envoyé un e-mail : clique sur le lien, puis connecte-toi ici." })
    const session = await backend.session()
    if (!session) throw new AccountError('Compte créé : connecte-toi.')
    await openVault(session.userId, email, keys.kek)
  } catch (e) {
    set({ busy: false, error: message(e) })
  }
}

export async function signIn(email: string, password: string) {
  if (!backend) return
  set({ busy: true, error: null, notice: null })
  try {
    validate(email, password, false)
    const keys = await deriveKeys(email, password, iterations)
    const { userId } = await backend.signIn(normalizeEmail(email), keys.authPassword)
    await openVault(userId, email, keys.kek)
  } catch (e) {
    set({ busy: false, error: message(e) })
  }
}

/** First sign-in creates the vault with this device's data; later ones load the account's data. */
async function openVault(userId: string, email: string, kek: CryptoKey) {
  const vault = await backend!.getVault(userId)
  let notice: string | null = null
  if (!vault) {
    const fresh = await newDataKey()
    const wrapped = await wrapDataKey(fresh, kek)
    const box = await encryptJson(fresh, savedOf(getState()))
    const updatedAt = await backend!.putVault(userId, { wrappedKey: wrapped.data, wrapIv: wrapped.iv, data: box.data, dataIv: box.iv })
    dek = await lockKey(fresh)
    writeMeta({ userId, email: normalizeEmail(email), wrappedKey: wrapped.data, wrapIv: wrapped.iv, lastSync: updatedAt })
    notice = 'Compte prêt : tes données sont chiffrées et sauvegardées.'
  } else {
    dek = await unwrapDataKey({ data: vault.wrappedKey, iv: vault.wrapIv }, kek)
    replaceSaved(await decryptJson<Partial<SavedState>>(dek, { data: vault.data, iv: vault.dataIv }), 'remote')
    writeMeta({ userId, email: normalizeEmail(email), wrappedKey: vault.wrappedKey, wrapIv: vault.wrapIv, lastSync: vault.updatedAt })
    notice = 'Connecté : tes données ont été récupérées.'
  }
  await setKey('dek', dek)
  set({ status: 'signedIn', email: meta!.email, busy: false, lastSync: meta!.lastSync, notice })
}

function schedulePush() {
  if (!dek || !meta) return
  clearTimeout(pushTimer)
  pushTimer = setTimeout(() => void push(), PUSH_DELAY)
}

/** Sends the encrypted data now. */
export async function push() {
  clearTimeout(pushTimer)
  pushTimer = undefined
  if (!backend || !dek || !meta) return
  set({ syncing: true })
  try {
    const box = await encryptJson(dek, savedOf(getState()))
    const updatedAt = await backend.putVault(meta.userId, { wrappedKey: meta.wrappedKey, wrapIv: meta.wrapIv, data: box.data, dataIv: box.iv })
    writeMeta({ ...meta, lastSync: updatedAt })
    set({ syncing: false, lastSync: updatedAt, error: null })
  } catch (e) {
    set({ syncing: false, error: message(e) })
  }
}

/** Fetches newer data written by another device. Local changes not sent yet win. */
export async function pull() {
  if (!backend || !dek || !meta || pushTimer) return
  try {
    const vault = await backend.getVault(meta.userId)
    if (!vault || vault.updatedAt <= meta.lastSync) return
    replaceSaved(await decryptJson<Partial<SavedState>>(dek, { data: vault.data, iv: vault.dataIv }), 'remote')
    writeMeta({ ...meta, lastSync: vault.updatedAt })
    set({ lastSync: vault.updatedAt, error: null })
  } catch (e) {
    set({ error: message(e) })
  }
}

/** Sends what is pending, then forgets the account and its data on this device (they stay in the account). */
export async function signOut() {
  if (pushTimer) await push()
  await backend?.signOut().catch(() => {})
  await forgetDevice()
  set({ status: 'signedOut', email: null, lastSync: null, error: null, notice: 'Déconnecté : les données de cet appareil ont été effacées.' })
}

/** Deletes the encrypted data from the server, then signs out. */
export async function deleteAccountData() {
  if (!backend || !meta) return
  set({ busy: true, error: null })
  try {
    clearTimeout(pushTimer)
    pushTimer = undefined
    await backend.deleteVault(meta.userId)
    await backend.signOut().catch(() => {})
    await forgetDevice()
    set({ status: 'signedOut', busy: false, email: null, lastSync: null, notice: 'Tes données ont été supprimées du serveur.' })
  } catch (e) {
    set({ busy: false, error: message(e) })
  }
}

async function forgetDevice() {
  dek = null
  writeMeta(null)
  await deleteKey('dek').catch(() => {})
  resetState()
  await flushLocalData()
  clearLocalData()
}
