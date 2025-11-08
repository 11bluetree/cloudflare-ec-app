import { cloudflare } from '@cloudflare/vite-plugin';
import { defineConfig, PluginOption } from 'vite';
import ssrPlugin from 'vite-ssr-components/plugin';

export default defineConfig({
  // プラグインの型定義がViteのバージョンと互換性がないため、型アサーションを使用
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  plugins: [cloudflare(), ssrPlugin()] as PluginOption[],
  server: {
    port: 3000, // APIサーバーのポートを3000に固定
  },
});
