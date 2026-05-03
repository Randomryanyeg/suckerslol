import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = __dirname
const DIST = path.resolve(ROOT, 'dist')

export default defineConfig({
  root: ROOT,
  server: {
    allowedHosts: true
  },

  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpeg}'],
        maximumFileSizeToCacheInBytes: 5000000
      },
      manifest: {
        name: "Scotiabank Mobile",
        short_name: "Scotia",
        description: "Securely manage your accounts, pay bills, and transfer money with the Scotiabank Mobile app.",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#ED0711",
        theme_color: "#ED0711",
        categories: ["finance", "productivity"],
        icons: [
          {
            src: "https://cdn.brandfetch.io/idpIpGPfn2/w/400/h/400/theme/dark/icon.jpeg?c=1dxbfHSJFAPEGdCLU4o5B",
            sizes: "192x192",
            type: "image/jpeg",
            purpose: "any"
          },
          {
            src: "https://cdn.brandfetch.io/idpIpGPfn2/w/400/h/400/theme/dark/icon.jpeg?c=1dxbfHSJFAPEGdCLU4o5B",
            sizes: "512x512",
            type: "image/jpeg",
            purpose: "any"
          },
          {
            src: "https://cdn.brandfetch.io/idpIpGPfn2/w/400/h/400/theme/dark/icon.jpeg?c=1dxbfHSJFAPEGdCLU4o5B",
            sizes: "192x192",
            type: "image/jpeg",
            purpose: "maskable"
          },
          {
            src: "https://cdn.brandfetch.io/idpIpGPfn2/w/400/h/400/theme/dark/icon.jpeg?c=1dxbfHSJFAPEGdCLU4o5B",
            sizes: "512x512",
            type: "image/jpeg",
            purpose: "maskable"
          }
        ],
        shortcuts: [
          {
            name: "Payments",
            short_name: "Pay",
            description: "Send a payment or transfer",
            url: "/?tab=payments",
            icons: [{ "src": "https://cdn.brandfetch.io/idpIpGPfn2/w/400/h/400/theme/dark/icon.jpeg?c=1dxbfHSJFAPEGdCLU4o5B", "sizes": "192x192" }]
          },
          {
            name: "Accounts",
            short_name: "Accounts",
            description: "View account balances",
            url: "/?tab=accounts",
            icons: [{ "src": "https://cdn.brandfetch.io/idpIpGPfn2/w/400/h/400/theme/dark/icon.jpeg?c=1dxbfHSJFAPEGdCLU4o5B", "sizes": "192x192" }]
          }
        ],
        screenshots: [
          {
            src: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80",
            sizes: "800x600",
            type: "image/jpeg",
            form_factor: "wide",
            label: "Banking Dashboard"
          },
          {
            src: "https://images.unsplash.com/photo-1616077168079-7e09a677fb2c?auto=format&fit=crop&w=400&h=800&q=80",
            sizes: "400x800",
            type: "image/jpeg",
            form_factor: "narrow",
            label: "Mobile View"
          }
        ]
      }
    })
  ],

  resolve: {
    alias: {
      '@': ROOT
    }
  },

  build: {
    outDir: DIST,
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(ROOT, 'index.html')
    }
  }
})