import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['isotipo.png', 'logo.png'],
      manifest: {
        name: 'NexoPOS',
        short_name: 'NexoPOS',
        description: 'Sistema de Gestión Integral para PYMES chilenas',
        theme_color: '#4f46e5',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'landscape',
        start_url: '/pos',
        scope: '/',
        icons: [
          { src: '/isotipo.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/isotipo.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
        categories: ['business', 'productivity'],
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /\/api\/.*/,
            handler: 'NetworkOnly',
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@nexopos/shared': path.resolve(__dirname, '../../packages/shared/index.ts'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        // Keep SSE connections alive through the proxy
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        configure: (proxy: any) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          proxy.on('proxyReq', (proxyReq: any) => {
            proxyReq.setHeader('Connection', 'keep-alive');
          });
        },
      },
    },
  },
})
