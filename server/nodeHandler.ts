import type { IncomingMessage, ServerResponse } from 'node:http'
import { handleGenerate } from './recipeAI.ts'

/** Node HTTP handler for POST /api/generate-recipe, shared by the local server (Vite) and Vercel. */
export function recipeHandler(getApiKey: () => string | undefined) {
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
      // handleGenerate answers 400 on a null body
    }
    const { status, json } = await handleGenerate(body, getApiKey())
    res.statusCode = status
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(json))
  }
}
