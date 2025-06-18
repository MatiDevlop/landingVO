// vite.config.js
import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    proxy: {
      // Todas las peticiones a /login, /profile, /events, /events/:id…
      // se reenviarán al backend en http://localhost:3000
      '/login':  { target: 'http://localhost:3000', changeOrigin: true },
      '/profile':{ target: 'http://localhost:3000', changeOrigin: true },
      '/events': { target: 'http://localhost:3000', changeOrigin: true }
    }
  }
})