import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/app1/',
  plugins: [react()],
  // Duas páginas no mesmo build: o app (index.html) e o painel admin
  // (admin/index.html, publicado em /app1/admin/). Bundles separados: o código
  // do painel não vai para quem usa o app.
  build: {
    rollupOptions: {
      input: {
        app: 'index.html',
        admin: 'admin/index.html',
      },
    },
  },
})
