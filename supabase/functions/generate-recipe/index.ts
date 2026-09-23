// Supabase Edge Function: POST /functions/v1/generate-recipe
// Secret: `supabase secrets set ANTHROPIC_API_KEY=...`
import { handleGenerate } from '../../../server/recipeAI.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return new Response(null, { status: 405, headers: CORS })
  const body = await req.json().catch(() => null)
  const { status, json } = await handleGenerate(body, Deno.env.get('ANTHROPIC_API_KEY'))
  return Response.json(json, { status, headers: CORS })
})
