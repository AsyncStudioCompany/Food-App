import 'fake-indexeddb/auto'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { configureAccount, getAccount, initAccount } from './account/account'
import { AccountError, type AccountBackend, type Vault } from './account/backend'
import { getState, resetState } from './state/store'

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  // No network in tests: TheMealDB searches find nothing, photos stay striped.
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ meals: null }))))
  configureAccount(null)
  resetState({ prefs: { onboarded: true } })
})
afterEach(() => vi.unstubAllGlobals())

describe('Mijote', () => {
  it('fridge → recipes → recipe → "J\'ai cuisiné" takes food out of the fridge', async () => {
    const user = userEvent.setup()
    renderAt('/')
    expect(screen.getByRole('heading', { name: '0 aliment dans ton frigo.' })).toBeInTheDocument()

    for (const name of ['Œufs', 'Crème fraîche']) {
      await user.click(screen.getByRole('button', { name }))
      await user.click(screen.getByRole('button', { name: 'Ajouter au frigo' }))
    }
    expect(screen.getByRole('heading', { name: '2 aliments dans ton frigo.' })).toBeInTheDocument()
    expect(getState().fridge.oeufs).toMatchObject({ qty: 6, unit: 'pc' })

    await user.click(screen.getByRole('button', { name: /Trouver des recettes/ }))
    expect(screen.getByRole('heading', { name: /recettes? avec ce que t'as/ })).toBeInTheDocument()
    // A breakfast dish: listed under "Tu as tout", not in the Top 3 (meals only).
    expect(screen.getByRole('heading', { name: 'Tu as tout' })).toBeInTheDocument()
    const card = screen.getAllByRole('link').find((l) => l.textContent?.includes('Œufs brouillés crémeux'))!
    expect(card).not.toHaveClass('topcard')

    await user.click(card)
    expect(screen.getByRole('heading', { name: 'Œufs brouillés crémeux' })).toBeInTheDocument()
    expect(screen.getByText('Tout est dans ton frigo')).toBeInTheDocument()
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Bats les œufs/ }))
    expect(screen.getByText('Étape 1 sur 3')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: "J'ai cuisiné" }))
    expect(screen.getByText('Bon appétit !')).toBeInTheDocument()
    expect(getState().fridge.oeufs.qty).toBe(3)
    expect(getState().fridge.creme.qty).toBe(15)
  })

  it('hides recipes that break the diet', async () => {
    const user = userEvent.setup()
    renderAt('/profil')
    await user.click(screen.getByRole('button', { name: 'Végétarien' }))
    await user.click(screen.getByRole('link', { name: 'Chercher' }))
    await user.type(screen.getByRole('textbox'), 'carbonara')
    expect(screen.getByText('Rien trouvé. Essaie un autre ingrédient.')).toBeInTheDocument()
  })

  it('likes a recipe into "Coups de cœur"', async () => {
    const user = userEvent.setup()
    renderAt('/recette/r9')
    await user.click(screen.getByRole('button', { name: 'Ajouter aux coups de cœur' }))
    await user.click(screen.getByRole('button', { name: '+ Liste' }))
    const dialog = screen.getByRole('dialog', { name: 'Ajouter à une liste' })
    expect(within(dialog).getByRole('button', { name: /Coups de cœur/ })).toHaveAttribute('aria-pressed', 'true')
    await user.type(within(dialog).getByRole('textbox'), 'Pour recevoir')
    await user.click(within(dialog).getByRole('button', { name: 'Créer' }))
    expect(getState().lists).toEqual([expect.objectContaining({ name: 'Pour recevoir', recipeIds: ['r9'] })])
  })

  it('invents a recipe with the AI and opens it', async () => {
    const draft = {
      name: 'Omelette aux épinards',
      cuisine: 'Française',
      course: 'Plat',
      minutes: 10,
      servings: 2,
      ingredients: [{ id: 'oeufs', qty: 4 }, { id: 'epinards', qty: 100 }],
      steps: ['Bats les œufs.', 'Fais tomber les épinards, verse les œufs.'],
      photoQuery: 'omelette',
    }
    const fetchMock = vi.fn(async (url: string, _init?: RequestInit) =>
      url.includes('generate-recipe') ? new Response(JSON.stringify({ draft })) : new Response(JSON.stringify({ meals: null })),
    )
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()
    renderAt('/recettes')
    await user.click(screen.getByRole('button', { name: /Invente-moi une recette/ }))
    await user.type(screen.getByRole('textbox', { name: 'Ton envie' }), 'léger')
    await user.click(screen.getByRole('button', { name: 'Inventer' }))

    expect(await screen.findByRole('heading', { name: 'Omelette aux épinards' })).toBeInTheDocument()
    expect(screen.getByText(/Inventée pour toi/)).toBeInTheDocument()
    expect(screen.getByText('Il te manque 2 trucs')).toBeInTheDocument()
    const body = JSON.parse(fetchMock.mock.calls.find(([u]) => u.includes('generate-recipe'))![1]!.body as string)
    expect(body).toMatchObject({ wish: 'léger', prefs: { diet: 'Tout' } })
    expect(getState().generated).toHaveLength(1)
  })

  it('hides the AI entry point when the AI is switched off', async () => {
    const user = userEvent.setup()
    renderAt('/profil')
    const toggle = screen.getByRole('switch', { name: "Recettes inventées par l'IA" })
    expect(toggle).toHaveAttribute('aria-checked', 'true')
    await user.click(toggle)
    expect(getState().prefs.ai).toBe(false)
    await user.click(screen.getByRole('link', { name: 'Recettes' }))
    expect(screen.queryByRole('button', { name: /Invente-moi une recette/ })).not.toBeInTheDocument()
  })

  it('shows imported recipes with their pantry and source', () => {
    renderAt('/recette/m52908')
    expect(screen.getByRole('heading', { name: 'Ratatouille' })).toBeInTheDocument()
    expect(screen.getByText(/via TheMealDB/)).toBeInTheDocument()
    expect(screen.getByText("Du placard : sel, poivre, huile d'olive, basilic, vinaigre, sucre.")).toBeInTheDocument()
  })

  it('explains when the AI is not configured', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => new Response(JSON.stringify(url.includes('generate-recipe') ? { error: 'not_configured' } : { meals: null }), { status: url.includes('generate-recipe') ? 503 : 200 })))
    const user = userEvent.setup()
    renderAt('/recettes')
    await user.click(screen.getByRole('button', { name: /Invente-moi une recette/ }))
    await user.click(screen.getByRole('button', { name: 'Inventer' }))
    expect(await screen.findByRole('alert')).toHaveTextContent("L'IA n'est pas encore branchée sur ce serveur.")
  })
})

/** Minimal in-memory account server. */
function fakeBackend(): AccountBackend {
  const users = new Map<string, string>()
  const vaults = new Map<string, Vault>()
  let current: { userId: string; email: string } | null = null
  return {
    async signUp(email, password) {
      if (users.has(email)) throw new AccountError('exists')
      users.set(email, password)
      current = { userId: email, email }
      return { confirmEmail: false }
    },
    async signIn(email, password) {
      if (users.get(email) !== password) throw new AccountError('E-mail ou mot de passe incorrect.')
      current = { userId: email, email }
      return { userId: email }
    },
    async signOut() {
      current = null
    },
    async session() {
      return current
    },
    async getVault(id) {
      return vaults.get(id) ?? null
    },
    async putVault(id, v) {
      const updatedAt = new Date().toISOString()
      vaults.set(id, { ...v, updatedAt })
      return updatedAt
    },
    async deleteVault(id) {
      vaults.delete(id)
    },
  }
}

describe('welcome and setup', () => {
  it('shows no recipe before signing in, then sets up diet, goal and fridge after sign-up', async () => {
    localStorage.clear()
    resetState()
    configureAccount(fakeBackend(), { pbkdf2Iterations: 1000 })
    await initAccount()
    const user = userEvent.setup()
    renderAt('/recettes')
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
    expect(screen.queryByText('Les plus adaptées')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Créer mon compte' }))
    await user.type(screen.getByLabelText('E-mail'), 'moi@exemple.fr')
    await user.type(screen.getByLabelText('Mot de passe'), 'mon-mot-de-passe')
    await user.click(screen.getByRole('button', { name: 'Créer mon compte' }))

    expect(await screen.findByText('1/4')).toBeInTheDocument()
    expect(getAccount().status).toBe('signedIn')
    await user.click(screen.getByRole('button', { name: 'Végétarien' }))
    await user.click(screen.getByRole('button', { name: 'Continuer' }))
    await user.click(screen.getByRole('button', { name: /^Protéines/ }))
    await user.click(screen.getByRole('button', { name: 'Continuer' }))
    await user.click(screen.getByRole('button', { name: 'Italienne' }))
    await user.click(screen.getByRole('button', { name: 'Continuer' }))
    await user.click(screen.getByRole('button', { name: 'Œufs' }))
    await user.click(screen.getByRole('button', { name: /C'est parti/ }))

    expect(getState().prefs).toMatchObject({ diet: 'Végétarien', goal: 'Protéines', cuisines: ['Italienne'], onboarded: true })
    expect(getState().fridge.oeufs.qty).toBe(6)
    expect(screen.getByRole('navigation')).toBeInTheDocument()
    expect(screen.getAllByText(/g de protéines/).length).toBeGreaterThan(0)

    await user.click(screen.getByRole('link', { name: 'Profil' }))
    await user.click(screen.getByRole('button', { name: 'Se déconnecter' }))
    expect(await screen.findByRole('button', { name: "J'ai déjà un compte" })).toBeInTheDocument()
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })

  it('works without an account server, with a local profile', async () => {
    resetState()
    const user = userEvent.setup()
    renderAt('/')
    await user.click(screen.getByRole('button', { name: 'Commencer' }))
    for (let i = 0; i < 3; i++) await user.click(screen.getByRole('button', { name: 'Continuer' }))
    await user.click(screen.getByRole('button', { name: /C'est parti/ }))
    expect(getState().prefs.onboarded).toBe(true)
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })
})

