// Entry point of the Vercel function /api/stores, bundled by scripts/build-vercel.mjs. No key needed.
import { storesHandler } from './nodeHandler.ts'

export default storesHandler()
