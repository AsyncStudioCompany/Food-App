/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
const isDemo = process.env.VITE_DEMO === '1'

export default defineConfig({
  build: isDemo ? { outDir: 'dist-demo', assetsInlineLimit: 100_000_000 } : undefined,
  plugins: [
    react(),
    tailwindcss(),
    !isDemo &&
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'popote',
        short_name: 'popote',
        description: 'Des recettes selon ce que vous avez dans votre frigo.',
        lang: 'fr',
        theme_color: '#0c0a09',
        background_color: '#0c0a09',
        display: 'standalone',
        start_url: '/',
        icons: [{ src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
