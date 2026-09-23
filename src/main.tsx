import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { configureAccount, initAccount } from './account/account'
import { supabaseBackend } from './account/supabaseBackend'
import App from './App'
import { initLocalData } from './state/persist'
import './styles.css'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
configureAccount(SUPABASE_URL && SUPABASE_ANON_KEY ? supabaseBackend(SUPABASE_URL, SUPABASE_ANON_KEY) : null)

async function start() {
  // Decrypt the device data before the first render, so screens never flash empty.
  await initLocalData()
  void initAccount()
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>,
  )
}

void start()
