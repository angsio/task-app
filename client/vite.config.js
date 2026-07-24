import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  // Dev only: the client fetches the relative '/api' (same as production). In
  // production that path is served from the same origin as the built client;
  // in `npm run dev` Vite serves on :5173, so proxy '/api' to the local Express
  // server on :5001. This keeps the client's API base identical in both worlds.
  server: {
    proxy: {
      '/api': 'http://localhost:5001',
    },
  },
})
