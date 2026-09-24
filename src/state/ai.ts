import { checkDraft, draftToRecipe, fridgeSnapshot, type AiRecipeDraft } from '../domain/aiRecipe'
import type { Recipe } from '../domain/types'
import { BY_ID, today } from './recipes'
import { getState, setState } from './store'

/** Dev server: /api/generate-recipe (vite.config.ts). Production: the Supabase function URL. */
const ENDPOINT = import.meta.env.VITE_RECIPE_AI_URL || '/api/generate-recipe'
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export class AiError extends Error {}

function messageFor(status: number, code: string | undefined): string {
  if (status === 503 && code === 'not_configured') return "L'IA n'est pas encore branchée sur ce serveur."
  if (status === 429) return "L'IA est débordée, réessaie dans un instant."
  return "L'IA n'a pas trouvé de recette qui te va. Réessaie avec une autre envie."
}

/** Asks the AI for a recipe, checks it, and saves it with the user's recipes. */
export async function inventRecipe(wish: string): Promise<Recipe> {
  const s = getState()
  let res: Response
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(ANON_KEY ? { Authorization: `Bearer ${ANON_KEY}` } : {}) },
      body: JSON.stringify({ fridge: fridgeSnapshot(s.fridge, today()), prefs: { diet: s.prefs.diet, allergies: s.prefs.allergies, cuisines: s.prefs.cuisines, portions: s.prefs.portions, goal: s.prefs.goal, avoid: s.prefs.avoid }, wish }),
    })
  } catch {
    throw new AiError("Impossible de joindre l'IA. Vérifie ta connexion.")
  }
  const json = (await res.json().catch(() => ({}))) as { draft?: AiRecipeDraft; error?: string }
  if (!res.ok || !json.draft) throw new AiError(messageFor(res.status, json.error))
  // The server already checked it; check again against the current prefs, which may have changed meanwhile.
  if (checkDraft(json.draft, BY_ID, getState().prefs).length) throw new AiError(messageFor(422, undefined))
  const recipe = draftToRecipe(json.draft, 'ia-' + Date.now())
  setState((st) => ({ generated: [recipe, ...st.generated] }))
  return recipe
}

export function deleteGenerated(id: string) {
  setState((s) => ({
    generated: s.generated.filter((r) => r.id !== id),
    liked: Object.fromEntries(Object.entries(s.liked).filter(([k]) => k !== id)),
    lists: s.lists.map((l) => ({ ...l, recipeIds: l.recipeIds.filter((x) => x !== id) })),
  }))
}
