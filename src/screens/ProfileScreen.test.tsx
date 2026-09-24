import 'fake-indexeddb/auto'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { configureAccount } from '../account/account'
import { getState, resetState } from '../state/store'

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ meals: null }))))
  configureAccount(null)
  resetState({ prefs: { onboarded: true } })
})
afterEach(() => vi.unstubAllGlobals())

describe('profile', () => {
  it('groups the settings by what they do', () => {
    render(
      <MemoryRouter initialEntries={['/profil']}>
        <App />
      </MemoryRouter>,
    )
    for (const name of ['Ce que tu ne manges pas', 'Ce qui te fait envie', 'En cuisine', 'Ton adresse', 'Ton compte']) expect(screen.getByRole('heading', { name, level: 2 })).toBeInTheDocument()
    expect(screen.getByText(/Filtres stricts/)).toBeInTheDocument()
    expect(within(screen.getByRole('group', { name: 'Allergies & intolérances' })).getByText('Aucune')).toBeInTheDocument()
  })

  it('adds and removes ingredients to avoid, which hides their recipes', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/profil']}>
        <App />
      </MemoryRouter>,
    )
    const avoid = screen.getByRole('group', { name: 'Ingrédients à éviter' })
    await user.click(within(avoid).getByRole('button', { name: '+ Champignons' }))
    await user.type(within(avoid).getByRole('textbox', { name: 'Chercher un ingrédient à éviter' }), 'lard')
    await user.click(within(avoid).getByRole('button', { name: '+ Lardons' }))
    expect(getState().prefs.avoid).toEqual(['champignons', 'lardons'])
    expect(within(avoid).getByText('2 évités')).toBeInTheDocument()

    await user.click(within(avoid).getByRole('button', { name: 'Ne plus éviter : Champignons' }))
    expect(getState().prefs.avoid).toEqual(['lardons'])
  })
})
