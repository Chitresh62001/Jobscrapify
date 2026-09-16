import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // GitHub Pages serves from /Jobscrapify/ — change this to match your exact repo name
  base: '/Jobscrapify/',
})
