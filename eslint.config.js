import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

/**
 * モノレポ全体のESLint設定
 * プロジェクト固有の設定は各ワークスペースでオーバーライド可能
 */
export default [
  // グローバルな除外設定
  {
    ignores: [
      "**/dist/**",
      "**/.wrangler/**",
      "**/node_modules/**",
      "**/routeTree.gen.ts",
      "**/worker-configuration.d.ts",
    ],
  },

  // 全TypeScriptファイルに適用される基本設定
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
    },
    rules: {
      // console.log禁止
      "no-console": "error",

      // debugger禁止
      "no-debugger": "error",

      // 未使用変数の禁止（_で始まる変数は許可）
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],

      // any型の使用を禁止
      "@typescript-eslint/no-explicit-any": "error",

      // 空の関数を警告
      "@typescript-eslint/no-empty-function": "warn",

      // 文字列はシングルクォーテーションで統一
      quotes: ["error", "single", { avoidEscape: true }],

      // 厳格な等価演算子を強制（=== と !==）
      eqeqeq: ["error", "always"],

      // varの使用を禁止（const/letを使用）
      "no-var": "error",

      // constを優先
      "prefer-const": "error",

      // アロー関数の推奨
      "prefer-arrow-callback": "warn",

      // テンプレートリテラルの推奨
      "prefer-template": "warn",

      // 不要なreturnの禁止
      "no-useless-return": "error",

      // 重複したimportの禁止
      "no-duplicate-imports": "error",

      // 不要なコンストラクタの禁止
      "no-useless-constructor": "error",

      // プロミスのベストプラクティス
      "no-async-promise-executor": "error",
      "require-await": "warn",

      // 1行の最大文字数を120文字に制限
      "max-len": [
        "error",
        {
          code: 120,
          tabWidth: 2,
          ignoreUrls: true,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
          ignoreRegExpLiterals: true,
          ignoreComments: false,
        },
      ],
    },
  },

  // apps/web（React）固有の設定
  {
    files: ["apps/web/**/*.{ts,tsx}"],
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
    },
  },

  // apps/api（Cloudflare Workers）固有の設定
  {
    files: ["apps/api/**/*.{ts,tsx}"],
    languageOptions: {
      globals: {
        // Cloudflare Workers固有のグローバル変数があれば追加
      },
    },
  },
];
