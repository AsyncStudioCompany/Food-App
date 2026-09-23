// Netlify Function: POST /api/generate-recipe (same path as the dev server, so the app needs no config).
// Set ANTHROPIC_API_KEY in Netlify → Site configuration → Environment variables.
import type { Config } from '@netlify/functions'
import { handleGenerate } from '../../server/recipeAI.ts'

export default async (req: Request) => {
  if (req.method !== 'POST') return new Response(null, { status: 405 })
  const body = await req.json().catch(() => null)
  const { status, json } = await handleGenerate(body, process.env.ANTHROPIC_API_KEY)
  return Response.json(json, { status })
}

export const config: Config = { path: '/api/generate-recipe' }
