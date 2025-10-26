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
  server: {
    port: 5173, // Webサーバーのポートを5173に固定
  },
  define: {
    // 環境変数をクライアントに公開
    'import.meta.env.VITE_API_URL': JSON.stringify(
      process.env.VITE_API_URL || 'http://localhost:3000'
    ),
  },
})
