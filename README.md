# Cloudflare E-commerce App

DDDの勉強のためにCloudflare Workersを使って簡単なE-commerceアプリを作成しました。

## 開発コマンド

```bash
# 依存関係のインストール
pnpm install

# 開発サーバーの起動
pnpm dev              # api と web を同時起動
pnpm dev:api          # api のみ起動
pnpm dev:web          # web のみ起動

# ビルド
pnpm build

# Lint実行
pnpm lint             # 全プロジェクトでLintを実行
pnpm -F api lint      # apiのみLintを実行
pnpm -F web lint      # webのみLintを実行
```

## ESLint設定

全プロジェクト共通のESLint設定は `packages/config/eslint.config.js` で管理されています。
