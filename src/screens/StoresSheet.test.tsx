import 'fake-indexeddb/auto'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { configureAccount } from '../account/account'
import { clearLocalData } from '../state/persist'
import { getState, resetState } from '../state/store'

const home = { lat: 48.8566, lon: 2.3522, label: '8 Place de l’Hôtel de Ville 75004 Paris' }

/** Two shops: the nearest knows no price, the other knows the pasta price. */
const storesAnswer = {
  stores: [
    { id: 'node/1', name: 'Chez Paul', brand: null, kind: 'convenience', lat: 48.857, lon: 2.353, hours: null, distance: 120, prices: {} },
    {
      id: 'way/2',
      name: 'Franprix',
      brand: 'Franprix',
      kind: 'supermarket',
      lat: 48.86,
      lon: 2.36,
      hours: 'Mo-Su 08:00-21:00',
      distance: 850,
      prices: { pates: { perGram: 0.002, from: 'brand', count: 4 }, oeufs: { perGram: 0.007, from: 'store', count: 2 } },
    },
  ],
  pricesComplete: true,
  updatedAt: '2026-09-24T10:00:00.000Z',
}

type Route = (url: URL, init?: RequestInit) => Response | Promise<Response>
function stubFetch(route: Route) {
  const fn = vi.fn(async (input: string | URL | Request, init?: RequestInit) => route(new URL(String(input), 'http://localhost'), init))
  vi.stubGlobal('fetch', fn)
  return fn
}
const apis: Route = (url) => {
  if (url.pathname === '/api/stores') return Response.json(storesAnswer)
  if (url.host === 'data.geopf.fr') {
    return Response.json({ features: [{ geometry: { coordinates: [home.lon, home.lat] }, properties: { label: home.label, context: '75, Paris, Île-de-France' } }] })
  }
  return Response.json({ meals: null })
}

function openCarbonara() {
  render(
    <MemoryRouter initialEntries={['/recette/r3']}>
      <App />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  configureAccount(null)
  clearLocalData()
  resetState({ prefs: { onboarded: true } })
})
afterEach(() => vi.unstubAllGlobals())

describe('Où les trouver ?', () => {
  it('asks for an address first, then lists the shops around it', async () => {
    const fetch = stubFetch(apis)
    const user = userEvent.setup()
    openCarbonara()
    expect(screen.getByText(/^Manque : /)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Où les trouver ?' }))
    const sheet = screen.getByRole('dialog', { name: 'Où les trouver ?' })
    expect(within(sheet).getByText('Dis-nous où tu es')).toBeInTheDocument()

    await user.type(within(sheet).getByRole('textbox', { name: 'Ton adresse' }), '8 place de l')
    await user.click(await within(sheet).findByRole('option', { name: /Hôtel de Ville/ }))
    expect(getState().prefs.location).toEqual(home)

    expect(await within(sheet).findByRole('link', { name: 'Itinéraire vers Franprix' })).toBeInTheDocument()
    // Only a rounded position and catalog ids reach the server.
    const call = fetch.mock.calls.find(([u]) => String(u) === '/api/stores')!
    expect(JSON.parse(String(call[1]!.body))).toEqual({ lat: 48.857, lon: 2.352, ids: ['pates', 'oeufs', 'lardons', 'fromage'] })
  })

  it('prices the basket, sorts by distance or known price, and opens directions', async () => {
    stubFetch(apis)
    resetState({ prefs: { onboarded: true, location: home } })
    const user = userEvent.setup()
    openCarbonara()
    await user.click(screen.getByRole('button', { name: 'Où les trouver ?' }))
    const sheet = screen.getByRole('dialog', { name: 'Où les trouver ?' })
    expect(within(sheet).getByText(`Autour de ${home.label}`)).toBeInTheDocument()

    const franprix = await within(sheet).findByRole('link', { name: 'Itinéraire vers Franprix' })
    expect(franprix).toHaveAttribute('href', 'https://maps.apple.com/?daddr=48.86,2.36&q=Franprix')
    expect(franprix).toHaveTextContent('850 m')
    expect(franprix).toHaveTextContent('2 prix connus sur 4')
    // Carbonara for 2: 200 g of pasta at 2 €/kg + 2 eggs (110 g) at 7 €/kg.
    expect(franprix).toHaveTextContent('≈ 1,17 €')
    const paul = within(sheet).getByRole('link', { name: 'Itinéraire vers Chez Paul' })
    expect(paul).toHaveTextContent('prix inconnu')
    expect(paul).toHaveTextContent('Aucun prix relevé')

    const names = () => within(sheet).getAllByRole('link', { name: /^Itinéraire vers/ }).map((l) => l.getAttribute('aria-label'))
    expect(names()).toEqual(['Itinéraire vers Chez Paul', 'Itinéraire vers Franprix'])
    await user.click(within(sheet).getByRole('button', { name: 'Le moins cher' }))
    expect(names()).toEqual(['Itinéraire vers Franprix', 'Itinéraire vers Chez Paul'])
    expect(within(sheet).getByText(/On ne compare que les prix connus/)).toBeInTheDocument()

    // Unticking the eggs: only the pasta counts, and the eggs price came from the shop itself.
    await user.click(within(sheet).getByRole('button', { name: 'Œufs' }))
    expect(franprix).toHaveTextContent('≈ 0,40 €')
    expect(franprix).toHaveTextContent("1 prix connu sur 3 · prix de l'enseigne")
  })

  it('shows every shop, or only those with a known price', async () => {
    stubFetch(apis)
    resetState({ prefs: { onboarded: true, location: home } })
    const user = userEvent.setup()
    openCarbonara()
    await user.click(screen.getByRole('button', { name: 'Où les trouver ?' }))
    const sheet = screen.getByRole('dialog', { name: 'Où les trouver ?' })
    await within(sheet).findByRole('link', { name: 'Itinéraire vers Franprix' })
    expect(within(sheet).getByRole('button', { name: 'Tous (2)' })).toHaveAttribute('aria-pressed', 'true')

    await user.click(within(sheet).getByRole('button', { name: 'Avec un prix (1)' }))
    expect(within(sheet).queryByRole('link', { name: 'Itinéraire vers Chez Paul' })).not.toBeInTheDocument()
    expect(within(sheet).getByRole('link', { name: 'Itinéraire vers Franprix' })).toBeInTheDocument()

    // Only the bacon ticked: no shop knows its price.
    for (const name of ['Pâtes', 'Œufs', 'Parmesan']) await user.click(within(sheet).getByRole('button', { name }))
    expect(within(sheet).getByRole('button', { name: 'Avec un prix (0)' })).toBeInTheDocument()
    expect(within(sheet).getByText(/Choisis « Tous » pour les voir/)).toBeInTheDocument()
    await user.click(within(sheet).getByRole('button', { name: 'Tous (2)' }))
    expect(within(sheet).getAllByRole('link', { name: /^Itinéraire vers/ })).toHaveLength(2)
  })

  it('shows the last result when offline', async () => {
    stubFetch(apis)
    resetState({ prefs: { onboarded: true, location: home } })
    const user = userEvent.setup()
    openCarbonara()
    await user.click(screen.getByRole('button', { name: 'Où les trouver ?' }))
    await screen.findByRole('link', { name: 'Itinéraire vers Franprix' })
    await user.click(screen.getByRole('button', { name: 'Fermer' }))

    stubFetch((url) => {
      if (url.pathname === '/api/stores') throw new TypeError('offline')
      return Response.json({ meals: null })
    })
    await user.click(screen.getByRole('button', { name: 'Où les trouver ?' }))
    expect(await screen.findByText(/Hors connexion : résultats du/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Itinéraire vers Franprix' })).toBeInTheDocument()
  })

  it('keeps the address in the profile, where it can be removed', async () => {
    stubFetch(apis)
    resetState({ prefs: { onboarded: true, location: home } })
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/profil']}>
        <App />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: 'Ton adresse' })).toBeInTheDocument()
    expect(screen.getByText(home.label)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retirer' }))
    expect(getState().prefs.location).toBeNull()
    expect(screen.getByRole('button', { name: 'Utiliser ma position' })).toBeInTheDocument()
  })
})
