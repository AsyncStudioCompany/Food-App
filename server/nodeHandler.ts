import type { IncomingMessage, ServerResponse } from 'node:http'
import { handleGenerate } from './recipeAI.ts'
import { handleStores } from './stores.ts'

type Handle = (body: unknown) => Promise<{ status: number; json: unknown }>

/** Node HTTP handler for a JSON POST route, shared by the local server (Vite) and Vercel. */
function jsonHandler(handle: Handle) {
  return async (req: IncomingMessage, res: ServerResponse) => {
    if (req.method !== 'POST') {
      res.statusCode = 405
      return res.end()
    }
    let raw = ''
    for await (const chunk of req) raw += chunk
    let body: unknown = null
    try {
      body = JSON.parse(raw)
    } catch {
      // The handlers answer 400 on a null body
    }
    const { status, json } = await handle(body)
    res.statusCode = status
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(json))
  }
}

/** POST /api/generate-recipe */
export const recipeHandler = (getApiKey: () => string | undefined) => jsonHandler((body) => handleGenerate(body, getApiKey()))

/** POST /api/stores */
export const storesHandler = () => jsonHandler((body) => handleStores(body))
