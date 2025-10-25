import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // TanStack Routerプラグインはreactプラグインの前に配置する必要がある
    tanstackRouter(),
    react(),
    tailwindcss(),
  ],
})
