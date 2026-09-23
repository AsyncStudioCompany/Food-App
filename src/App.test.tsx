import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'
import { fridgeStore } from './data/fridgeStore'
import { preferencesStore } from './data/preferencesStore'
import { defaultPreferences } from './domain/preferences'
import { ingredients } from './data/seed'

function renderApp(path = '/') {
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

async function addToFridge(name: string, increments = 0) {
  await userEvent.click(screen.getByRole('button', { name: new RegExp(`^${name}`) }))
  const dialog = screen.getByRole('dialog')
  for (let i = 0; i < increments; i++) await userEvent.click(within(dialog).getByRole('button', { name: 'Augmenter' }))
  await userEvent.click(within(dialog).getByRole('button', { name: 'Ajouter au frigo' }))
}

describe('App', () => {
  beforeEach(() => {
    localStorage.clear()
    fridgeStore.set([])
    preferencesStore.set(defaultPreferences(ingredients))
  })

  it('fills the fridge with quantities and finds recipes, ready ones first', async () => {
    renderApp()
    expect(screen.getByRole('heading', { name: /Qu'est-ce que t'as/ })).toBeInTheDocument()

    await addToFridge('Œuf', 5) // 6 œufs
    await addToFridge('Champignons de Paris') // 250 g
    await addToFridge('Beurre') // 250 g
    expect(screen.getByRole('button', { name: /Œuf/, pressed: true })).toHaveTextContent('6')

    await userEvent.click(screen.getByRole('button', { name: /Trouver des recettes/ }))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/recettes? avec ce que t'as/)
    const first = screen.getAllByRole('link', { name: /Omelette aux champignons/ })[0]
    expect(first).toHaveTextContent('Tu as tout')

    await userEvent.click(first)
    expect(screen.getByRole('heading', { name: 'Omelette aux champignons' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /J'ai cuisiné/ }))
    expect(fridgeStore.get().find((item) => item.ingredientId === 'egg')?.quantity).toBe(3)
  })

  it('hides recipes excluded by the diet', async () => {
    fridgeStore.set([
      { id: '1', ingredientId: 'spaghetti', quantity: 500, unit: 'g', addedAt: '2026-09-20' },
      { id: '2', ingredientId: 'bacon', quantity: 200, unit: 'g', addedAt: '2026-09-20' },
      { id: '3', ingredientId: 'egg', quantity: 6, unit: 'piece', addedAt: '2026-09-20' },
      { id: '4', ingredientId: 'parmesan', quantity: 100, unit: 'g', addedAt: '2026-09-20' },
    ])
    renderApp('/resultats')
    expect(screen.getAllByRole('link', { name: /Pâtes carbonara/ }).length).toBeGreaterThan(0)
    await userEvent.selectOptions(screen.getByLabelText('Régime'), 'vegetarian')
    expect(screen.queryByRole('link', { name: /Pâtes carbonara/ })).not.toBeInTheDocument()
  })
})
