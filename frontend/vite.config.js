import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Base path for GitHub Pages deployment
  base: '/MANAGEMENT_MCA_PROJECT/',
  server: {
    port: 5173,
    open: true
  }
})
