import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { configureAccount, deleteAccountData, getAccount, initAccount, pull, push, signIn, signOut, signUp } from './account'
import { AccountError, type AccountBackend, type Vault } from './backend'
import { getState, resetState, setState } from '../state/store'

/** In-memory account server that keeps everything it receives, to check it can read nothing. */
function fakeServer() {
  const users = new Map<string, { id: string; password: string }>()
  const vaults = new Map<string, Vault>()
  let current: { userId: string; email: string } | null = null
  let clock = 0
  const received: string[] = []
  const backend: AccountBackend = {
    async signUp(email, password) {
      received.push(email, password)
      if (users.has(email)) throw new AccountError('exists')
      const id = 'u' + (users.size + 1)
      users.set(email, { id, password })
      current = { userId: id, email }
      return { confirmEmail: false }
    },
    async signIn(email, password) {
      received.push(email, password)
      const u = users.get(email)
      if (!u || u.password !== password) throw new AccountError('E-mail ou mot de passe incorrect.')
      current = { userId: u.id, email }
      return { userId: u.id }
    },
    async signOut() {
      current = null
    },
    async session() {
      return current
    },
    async getVault(userId) {
      return vaults.get(userId) ?? null
    },
    async putVault(userId, v) {
      received.push(JSON.stringify(v))
      const updatedAt = new Date(Date.UTC(2026, 0, 1, 0, 0, ++clock)).toISOString()
      vaults.set(userId, { ...v, updatedAt })
      return updatedAt
    },
    async deleteVault(userId) {
      vaults.delete(userId)
    },
  }
  return { backend, vaults, received, users }
}

const EMAIL = 'moi@exemple.fr'
const PASSWORD = 'mon-mot-de-passe'

beforeEach(() => {
  localStorage.clear()
  resetState()
})
afterEach(() => configureAccount(null))

describe('account', () => {
  it('is unavailable without a server', async () => {
    configureAccount(null)
    await initAccount()
    expect(getAccount().status).toBe('unavailable')
  })

  it('syncs between two devices while the server only sees ciphertext', async () => {
    const server = fakeServer()
    configureAccount(server.backend, { pbkdf2Iterations: 1000 })
    await initAccount()
    expect(getAccount().status).toBe('signedOut')

    // Device A: some data, then an account.
    setState({ fridge: { oeufs: { qty: 6, unit: 'pc', expiresOn: null } }, liked: { r12: true } })
    await signUp(EMAIL, PASSWORD)
    expect(getAccount()).toMatchObject({ status: 'signedIn', email: EMAIL, error: null })

    setState({ lists: [{ id: 'l1', name: 'Soirs de semaine', recipeIds: ['r1'] }] })
    await push()

    // What the server got: never the password, never readable data.
    const everything = server.received.join('\n')
    expect(everything).not.toContain(PASSWORD)
    for (const secret of ['oeufs', 'Soirs de semaine', 'r12', 'fridge']) expect(everything).not.toContain(secret)

    // Device B (same account, empty device).
    await signOut()
    expect(getState().fridge).toEqual({})
    await signIn(EMAIL, PASSWORD)
    expect(getAccount().status).toBe('signedIn')
    expect(getState().fridge.oeufs.qty).toBe(6)
    expect(getState().lists[0].name).toBe('Soirs de semaine')
  })

  it('refuses a wrong password', async () => {
    const server = fakeServer()
    configureAccount(server.backend, { pbkdf2Iterations: 1000 })
    await initAccount()
    await signUp(EMAIL, PASSWORD)
    await signOut()
    await signIn(EMAIL, 'pas-le-bon')
    expect(getAccount()).toMatchObject({ status: 'signedOut', error: 'E-mail ou mot de passe incorrect.' })
  })

  it('pulls what another device wrote, and deletes everything on request', async () => {
    const server = fakeServer()
    configureAccount(server.backend, { pbkdf2Iterations: 1000 })
    await initAccount()
    await signUp(EMAIL, PASSWORD)

    // Another device pushes newer data (simulated by signing in elsewhere with the same keys).
    const other = { ...server.vaults.get('u1')! }
    setState({ prefs: { ...getState().prefs, diet: 'Vegan' } })
    await push()
    const newer = server.vaults.get('u1')!
    server.vaults.set('u1', { ...other, updatedAt: '2026-01-01T00:00:00.000Z' }) // older copy on the server
    await pull()
    expect(getState().prefs.diet).toBe('Vegan') // older data is ignored
    server.vaults.set('u1', { ...newer, updatedAt: '2030-01-01T00:00:00.000Z' })
    setState({ prefs: { ...getState().prefs, diet: 'Tout' } })
    await push() // local change first
    server.vaults.set('u1', { ...newer, updatedAt: '2031-01-01T00:00:00.000Z' })
    await pull()
    expect(getState().prefs.diet).toBe('Vegan') // newer data from "another device" wins

    await deleteAccountData()
    expect(server.vaults.size).toBe(0)
    expect(getAccount().status).toBe('signedOut')
    expect(getState().prefs.diet).toBe('Tout')
  })
})
