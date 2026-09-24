// Supabase Edge Function: POST /functions/v1/stores (shops near the user and prices of missing ingredients).
import { handleStores } from '../../../server/stores.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return new Response(null, { status: 405, headers: CORS })
  const body = await req.json().catch(() => null)
  const { status, json } = await handleStores(body)
  return Response.json(json, { status, headers: CORS })
})
