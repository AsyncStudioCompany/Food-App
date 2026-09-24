import 'fake-indexeddb/auto'
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { configureAccount } from '../account/account'
import { resetState } from '../state/store'

function openRecipe(id: string) {
  render(
    <MemoryRouter initialEntries={[`/recette/${id}`]}>
      <App />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ meals: null }))))
  configureAccount(null)
  resetState({ prefs: { onboarded: true } })
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('recipe page', () => {
  it('lists the tools and explains a technique', async () => {
    const user = userEvent.setup()
    openRecipe('r2')
    expect(screen.getByRole('heading', { name: 'Avant de commencer' })).toBeInTheDocument()
    expect(screen.getByText('Casserole')).toBeInTheDocument()
    expect(screen.getByText(/techniques? expliquée/)).toBeInTheDocument()

    await user.click(screen.getAllByRole('button', { name: "C'est quoi : Faire revenir ?" })[0])
    const sheet = screen.getByRole('dialog', { name: 'Faire revenir' })
    expect(within(sheet).getByText('Astuce')).toBeInTheDocument()
    expect(within(sheet).getByText(/Cuire à feu moyen/)).toBeInTheDocument()
    await user.click(within(sheet).getByRole('button', { name: 'Compris' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('runs a step timer and rings at the end', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    openRecipe('r2')
    await user.click(screen.getByRole('button', { name: 'Lancer un minuteur de 6 min' }))
    expect(screen.getByRole('button', { name: /Arrêter le minuteur, 6:00 restantes/ })).toBeInTheDocument()
    await act(async () => {
      vi.advanceTimersByTime(60_000)
    })
    expect(screen.getByRole('button', { name: /5:00 restantes/ })).toBeInTheDocument()
    await act(async () => {
      vi.advanceTimersByTime(5 * 60_000)
    })
    expect(screen.getByRole('button', { name: 'Terminé !' })).toBeInTheDocument()
    expect(screen.getByText('Minuteur terminé : étape 2')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Terminé !' }))
    expect(screen.getByRole('button', { name: 'Lancer un minuteur de 6 min' })).toBeInTheDocument()
  })

  it('shows the oven temperature', () => {
    openRecipe('r18')
    expect(screen.getByText('Four à 200 °C')).toBeInTheDocument()
  })
})
