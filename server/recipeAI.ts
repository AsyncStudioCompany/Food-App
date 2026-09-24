import Anthropic from '@anthropic-ai/sdk'
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod'
import { z } from 'zod'
import { INGREDIENTS } from '../src/data/catalog.ts'
import { checkDraft, type AiRecipeDraft, type AiRecipeRequest } from '../src/domain/aiRecipe.ts'
import { indexIngredients } from '../src/domain/matching.ts'
import { ALLERGENS, COURSES, CUISINES, DIETS, GOALS } from '../src/domain/types.ts'
import { qtyLabel } from '../src/domain/units.ts'

const byId = indexIngredients(INGREDIENTS)
const ids = INGREDIENTS.map((i) => i.id) as [string, ...string[]]

const DraftSchema = z.object({
  name: z.string().describe('Nom du plat en français, court et appétissant'),
  cuisine: z.enum(CUISINES),
  course: z.enum(COURSES).describe('Type de plat ; « Plat » sauf si on demande autre chose'),
  minutes: z.number().int().describe('Temps total en minutes'),
  servings: z.number().int(),
  ingredients: z
    .array(z.object({ id: z.enum(ids), qty: z.number().describe("Quantité dans l'unité du catalogue") }))
    .describe('Ingrédients du catalogue uniquement, sans les basiques du placard'),
  steps: z.array(z.string()).describe('3 à 6 étapes courtes, au tutoiement'),
  photoQuery: z.string().describe('Nom anglais usuel du plat, 1 à 3 mots, pour trouver sa photo (ex. "chicken curry", "omelette")'),
})

const UNIT_WORD = { g: 'grammes', cl: 'centilitres', pc: 'pièces' } as const

const GOAL_TEXT = {
  'Prise de masse': 'prise de masse, un plat copieux et riche en protéines',
  Protéines: 'manger plus de protéines',
  'Perte de poids': 'perdre du poids, un plat léger mais rassasiant',
} as const

// Stable across requests so the prefix can be cached: the catalog never changes at runtime.
const SYSTEM = `Tu es le cuisinier de Mijote, une app anti-gaspillage en français. Tu inventes une recette maison, simple et réaliste, à partir du frigo de l'utilisateur.

Catalogue (identifiant : nom, unité des quantités) :
${INGREDIENTS.map((i) => `- ${i.id} : ${i.name}, en ${UNIT_WORD[i.unit]}`).join('\n')}

Règles :
- N'utilise que des identifiants du catalogue. Sel, poivre, huile, eau, épices et herbes sèches sont supposés au placard : ne les liste pas.
- Pars de ce qu'il y a dans le frigo et utilise en priorité ce qui périme bientôt. Tu peux ajouter au plus 2 ingrédients du catalogue absents du frigo, seulement s'ils rendent le plat nettement meilleur.
- Respecte strictement le régime et les allergies : ils sont non négociables.
- Donne les quantités pour le nombre de portions demandé, dans l'unité du catalogue.
- Écris les étapes au tutoiement, en phrases courtes qui commencent par un verbe (« Émince… », « Fais revenir… », « Mijote… »), comme un ami qui cuisine avec toi.
- Le nom du plat est en français, sans emoji.`

function userPrompt(req: AiRecipeRequest): string {
  const fridge = req.fridge
    .filter((f) => byId.has(f.id))
    .map((f) => {
      const ing = byId.get(f.id)!
      const exp = f.days == null ? '' : f.days <= 0 ? ", à finir aujourd'hui" : `, périme dans ${f.days} j`
      return `- ${f.id} (${ing.name}) : ${qtyLabel(f.qty, ing.unit)}${exp}`
    })
  const p = req.prefs
  return [
    'Mon frigo :',
    fridge.length ? fridge.join('\n') : '(vide)',
    '',
    `Régime : ${p.diet === 'Tout' ? 'aucun' : p.diet}.`,
    `Allergies : ${p.allergies.length ? p.allergies.join(', ') : 'aucune'}.`,
    `Cuisines que j'aime : ${p.cuisines.length ? p.cuisines.join(', ') : 'toutes'}.`,
    `Portions : ${p.portions}.`,
    p.goal && p.goal !== 'Équilibré' ? `Mon objectif : ${GOAL_TEXT[p.goal]}.` : '',
    req.wish.trim() ? `Mon envie : ${req.wish.trim()}` : '',
  ]
    .filter((l) => l !== '')
    .join('\n')
}

/** Validates the untrusted request body. */
export function parseRequest(body: unknown): AiRecipeRequest {
  const schema = z.object({
    fridge: z.array(z.object({ id: z.string(), qty: z.number(), days: z.number().nullable() })).max(200),
    prefs: z.object({
      diet: z.enum(DIETS),
      allergies: z.array(z.enum(ALLERGENS)),
      cuisines: z.array(z.enum(CUISINES)),
      portions: z.number().int().min(1).max(12),
      goal: z.enum(GOALS).optional(),
    }),
    wish: z.string().max(200),
  })
  return schema.parse(body)
}

export class RecipeGenerationError extends Error {}

export async function generateRecipe(client: Anthropic, req: AiRecipeRequest): Promise<AiRecipeDraft> {
  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: 'user', content: userPrompt(req) }]
  // One retry when the draft breaks a rule the schema cannot express (diet, duplicates…).
  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await client.beta.messages.parse({
      model: 'claude-opus-5',
      max_tokens: 16000,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'medium', format: betaZodOutputFormat(DraftSchema) },
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
      messages,
    })
    if (response.stop_reason === 'refusal') throw new RecipeGenerationError('refusal')
    const draft = response.parsed_output
    if (!draft) throw new RecipeGenerationError('no_output')
    const errors = checkDraft(draft, byId, req.prefs)
    if (errors.length === 0) return draft
    messages.push(
      { role: 'assistant', content: response.content },
      { role: 'user', content: `Cette recette ne va pas :\n- ${errors.join('\n- ')}\nPropose une recette corrigée.` },
    )
  }
  throw new RecipeGenerationError('invalid_draft')
}

/** Framework-agnostic HTTP handler shared by the Vite dev server and the Supabase function. */
export async function handleGenerate(body: unknown, apiKey: string | undefined): Promise<{ status: number; json: unknown }> {
  if (!apiKey) return { status: 503, json: { error: 'not_configured' } }
  let req: AiRecipeRequest
  try {
    req = parseRequest(body)
  } catch {
    return { status: 400, json: { error: 'bad_request' } }
  }
  try {
    const draft = await generateRecipe(new Anthropic({ apiKey }), req)
    return { status: 200, json: { draft } }
  } catch (e) {
    if (e instanceof RecipeGenerationError) return { status: 422, json: { error: e.message } }
    if (e instanceof Anthropic.RateLimitError) return { status: 429, json: { error: 'rate_limited' } }
    if (e instanceof Anthropic.APIError) return { status: 502, json: { error: 'upstream', status: e.status } }
    throw e
  }
}
