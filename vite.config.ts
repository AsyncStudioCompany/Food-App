/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { recipeHandler, storesHandler } from './server/nodeHandler.ts'

/**
 * Serves the API from `npm run dev` / `npm start`: POST /api/generate-recipe (with ANTHROPIC_API_KEY
 * from .env.local) and POST /api/stores (no key).
 */
function mijoteApi(apiKey: string | undefined): Plugin {
  const recipe = recipeHandler(() => apiKey)
  const stores = storesHandler()
  return {
    name: 'mijote-api',
    configureServer: (server) => {
      server.middlewares.use('/api/generate-recipe', recipe)
      server.middlewares.use('/api/stores', stores)
    },
    configurePreviewServer: (server) => {
      server.middlewares.use('/api/generate-recipe', recipe)
      server.middlewares.use('/api/stores', stores)
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [
      react(),
      mijoteApi(env.ANTHROPIC_API_KEY),
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
              // Recipe photos (TheMealDB, Flickr, Wikimedia) and TheMealDB searches, so seen recipes keep their photo offline.
              urlPattern: /^https:\/\/(www\.themealdb\.com|live\.staticflickr\.com|upload\.wikimedia\.org)\//,
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
