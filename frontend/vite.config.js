import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // No dev, podemos manter compatível para quem usar /api
      '/api': {
        target: 'http://localhost',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/backend/api'),
      },
    },
  },
  // Importante: quando o site é servido em subpasta (ex: /AgendasBarber/frontend/dist),
  // o build precisa de base relativo para os assets carregarem.
  base: './',
})


