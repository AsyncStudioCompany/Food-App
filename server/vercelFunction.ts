// Entry point of the Vercel function /api/generate-recipe, bundled by scripts/build-vercel.mjs.
// Set ANTHROPIC_API_KEY in Vercel → Project → Settings → Environment Variables.
import { recipeHandler } from './nodeHandler.ts'

export default recipeHandler(() => process.env.ANTHROPIC_API_KEY)
