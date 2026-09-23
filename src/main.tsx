import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, MemoryRouter } from 'react-router'
import './index.css'
import App from './App.tsx'
import { fridgeStore } from './data/fridgeStore'
import { DeviceFrame } from './demo/DeviceFrame'
import { exampleFridge } from './demo/exampleFridge'

// Maquette publiée (npm run build:demo) : routes en mémoire, cadre iPhone et frigo d'exemple.
const isDemo = import.meta.env.VITE_DEMO === '1'

function hasSavedFridge(): boolean {
  try {
    return localStorage.getItem('food-app:fridge') !== null
  } catch {
    return false
  }
}

if (isDemo && !hasSavedFridge()) fridgeStore.set(exampleFridge())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isDemo ? (
      <MemoryRouter>
        <DeviceFrame>
          <App />
        </DeviceFrame>
      </MemoryRouter>
    ) : (
      <BrowserRouter>
        <App />
      </BrowserRouter>
    )}
  </StrictMode>,
)
