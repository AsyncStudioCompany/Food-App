// Construit la maquette interactive en un seul fichier HTML autonome (dist-demo/popote.html),
// prêt à être publié comme page : JS et CSS inlinés, pas de service worker, routes en mémoire.
import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

execSync('npx vite build', { stdio: 'inherit', env: { ...process.env, VITE_DEMO: '1' } })

const dist = 'dist-demo'
const html = readFileSync(join(dist, 'index.html'), 'utf8')
const asset = (pattern) => {
  const match = html.match(pattern)
  if (!match) throw new Error(`Fichier introuvable dans index.html : ${pattern}`)
  return readFileSync(join(dist, match[1].replace(/^\.?\//, '')), 'utf8')
}
const js = asset(/<script type="module" crossorigin src="([^"]+)"/).replaceAll('</script', '<\\/script')
const css = asset(/<link rel="stylesheet" crossorigin href="([^"]+)"/)

// La page gère elle-même les zones de sécurité de l'iPhone : on neutralise le padding du squelette.
const page = `<title>popote</title>
<meta name="theme-color" content="#0c0a09">
<style>${css}
:root{padding-top:0!important;padding-bottom:0!important;background:#0c0a09}</style>
<div id="root"></div>
<script type="module">${js}</script>
`
writeFileSync(join(dist, 'popote.html'), page)
console.log(`dist-demo/popote.html (${Math.round(page.length / 1024)} Ko)`)
