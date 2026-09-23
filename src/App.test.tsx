import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('opens on the suggestions tab and navigates to the recipes', async () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: 'Que puis-je cuisiner ?' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('link', { name: /Recettes/ }))
    expect(screen.getByRole('heading', { name: 'Recettes' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Pâtes carbonara' })).toBeInTheDocument()
  })
})
