import { baseConfig } from "@cloudflare-ec-app/config/eslint";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["dist", ".wrangler", "worker-configuration.d.ts"]),
  ...baseConfig,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      // Cloudflare Workers環境用のグローバル変数
      globals: {
        // Workersのグローバル変数をここに追加可能
      },
    },
  },
]);
