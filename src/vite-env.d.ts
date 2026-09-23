/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Recipe generator endpoint; defaults to the dev server's /api/generate-recipe. */
  readonly VITE_RECIPE_AI_URL?: string
  /** Supabase anon key, sent as Bearer token to the Supabase function. */
  readonly VITE_SUPABASE_ANON_KEY?: string
}
