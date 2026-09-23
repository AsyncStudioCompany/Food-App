/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { handleGenerate } from './server/recipeAI.ts'

/** Serves POST /api/generate-recipe from `npm run dev` / `npm run preview`, with ANTHROPIC_API_KEY from .env.local. */
function recipeApi(apiKey: string | undefined): Plugin {
  const handler = async (req: IncomingMessage, res: ServerResponse) => {
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
    const { status, json } = await handleGenerate(body, apiKey)
    res.statusCode = status
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(json))
  }
  return {
    name: 'mijote-recipe-api',
    configureServer: (server) => void server.middlewares.use('/api/generate-recipe', handler),
    configurePreviewServer: (server) => void server.middlewares.use('/api/generate-recipe', handler),
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [
      react(),
      recipeApi(env.ANTHROPIC_API_KEY),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
        manifest: {
          name: 'Mijote',
          short_name: 'Mijote',
          description: 'Des recettes avec ce que t’as dans ton frigo.',
          lang: 'fr',
          theme_color: '#121110',
          background_color: '#121110',
          display: 'standalone',
          start_url: '/',
          icons: [
            { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          navigateFallbackDenylist: [/^\/api\//],
          runtimeCaching: [
            {
              // TheMealDB stand-in photos and search results, so seen recipes keep their photo offline.
              urlPattern: /^https:\/\/www\.themealdb\.com\//,
              handler: 'CacheFirst',
              options: {
                cacheName: 'themealdb',
                expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 30 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
      }),
    ],
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
    },
  }
})
