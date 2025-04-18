import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/', // Changed from '/Filmila/' to '/' for Netlify deployment
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
}) 