/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Recipe generator endpoint; defaults to the dev server's /api/generate-recipe. */
  readonly VITE_RECIPE_AI_URL?: string
  /** Shops and prices endpoint ("Où les trouver ?"); defaults to /api/stores. */
  readonly VITE_STORES_URL?: string
  /** Supabase project URL: turns the accounts on. */
  readonly VITE_SUPABASE_URL?: string
  /** Supabase anon (public) key; the `vaults` table is protected by row level security. */
  readonly VITE_SUPABASE_ANON_KEY?: string
}
