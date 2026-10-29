import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Aplikacja działa pod https://dyskna.github.io/pdf-reader/
  base: '/pdf-reader/',
  plugins: [react()],
})
