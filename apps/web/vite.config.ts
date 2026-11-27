import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

function versionPwaUrls(): Plugin {
  return {
    name: 'nexopos-version-pwa-urls',
    apply: 'build',
    enforce: 'post',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        const version = html.match(/\/assets\/index-([A-Za-z0-9_-]+)\.js/)?.[1]
        if (!version) throw new Error('Cannot identify the POS application bundle')
        const withManifest = html.replace(/(["'])\/manifest\.webmanifest\1/g, (_, quote) => quote + '/manifest.webmanifest?v=' + version + quote)
        const withWorker = withManifest.replace(/(["'])\/sw\.js\1/g, (_, quote) => quote + '/sw.js?v=' + version + quote)
        if (withManifest === html || withWorker === withManifest) throw new Error('Cannot version the PWA resource URLs')
        return withWorker
      },
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'inline',
      includeAssets: ['pwa/icon-192.png', 'pwa/icon-512.png', 'isotipo.png', 'logo.png'],
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
          { src: '/pwa/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/pwa/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
        categories: ['business', 'productivity'],
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        globPatterns: ['index.html', 'assets/**/*.{js,css,woff,woff2}'],
        navigateFallbackDenylist: [/^\/api(?:\/|$)/, /^\/socket\.io(?:\/|$)/],
        runtimeCaching: [
          {
            urlPattern: ({ url, sameOrigin }) => sameOrigin && /^\/api(?:\/|$)/.test(url.pathname),
            handler: 'NetworkOnly',
          },
        ],
      },
      devOptions: { enabled: false },
    }),
    versionPwaUrls(),
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
        target: 'http://localhost:3000',
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
