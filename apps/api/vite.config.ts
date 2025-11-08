import { cloudflare } from '@cloudflare/vite-plugin';
import { defineConfig, PluginOption } from 'vite';
import ssrPlugin from 'vite-ssr-components/plugin';

export default defineConfig({
  plugins: [cloudflare(), ssrPlugin()] as PluginOption[],
  server: {
    port: 3000, // APIサーバーのポートを3000に固定
  },
});
