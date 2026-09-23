// Builds the app for Vercel with the Build Output API (https://vercel.com/docs/build-output-api):
// the static site from dist/ and the /api/generate-recipe function, bundled into a single file.
// Run by Vercel through `npm run build:vercel` (see vercel.json).
import { build } from 'esbuild'
import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'

const OUT = '.vercel/output'
rmSync(OUT, { recursive: true, force: true })

// Static site (npm run build has produced dist/).
cpSync('dist', `${OUT}/static`, { recursive: true })

// AI function.
const fn = `${OUT}/functions/api/generate-recipe.func`
mkdirSync(fn, { recursive: true })
await build({
  entryPoints: ['server/vercelFunction.ts'],
  outfile: `${fn}/index.mjs`,
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  // Some dependencies still call require(): give the ESM bundle one.
  banner: { js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);" },
})
writeFileSync(
  `${fn}/.vc-config.json`,
  JSON.stringify({ runtime: 'nodejs22.x', handler: 'index.mjs', launcherType: 'Nodejs', shouldAddHelpers: false, maxDuration: 60 }, null, 2),
)

writeFileSync(
  `${OUT}/config.json`,
  JSON.stringify(
    {
      version: 3,
      routes: [
        // The service worker must never be cached, so updates reach the installed app.
        { src: '/sw\\.js', headers: { 'cache-control': 'public, max-age=0, must-revalidate' }, continue: true },
        { handle: 'filesystem' },
        // Single-page app: every other route serves index.html.
        { src: '/(.*)', dest: '/index.html' },
      ],
    },
    null,
    2,
  ),
)
console.log(`Vercel output ready in ${OUT}`)
