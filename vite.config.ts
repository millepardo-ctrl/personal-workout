/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// BASE se define en GitHub Pages (/personal-workout/); en local es "/".
const base = process.env.BASE_PATH ?? '/'

export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'exercises/**/*.jpg'],
      manifest: {
        name: 'Mi Plan – Milena',
        short_name: 'Mi Plan',
        description: 'Entrenamiento y alimentación personal',
        lang: 'es',
        theme_color: '#7c3aed',
        background_color: '#faf7ff',
        display: 'standalone',
        start_url: base,
        scope: base,
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,svg,png,jpg,webmanifest}'] },
    }),
  ],
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
})
