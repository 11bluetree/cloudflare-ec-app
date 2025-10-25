# Web Frontend

TanStack Router + Material-UIを使用したSPAフロントエンドアプリケーション。

## 技術スタック

- **React 19** - UIライブラリ
- **TanStack Router** - 型安全なファイルベースルーティング
- **Material-UI (MUI)** - UIコンポーネントライブラリ
- **Vite** - ビルドツール
- **TypeScript** - 型安全性

## 開発

```bash
# 開発サーバー起動
pnpm dev

# ビルド
pnpm build

# プレビュー
pnpm preview
```

## プロジェクト構造

このプロジェクトは以下の手順で作成されました：

1. Vite公式テンプレートでReact + TypeScriptプロジェクトを初期化

   ```bash
   pnpm create vite web --template react-ts
   ```

2. TanStack Routerとプラグインをインストール

   ```bash
   pnpm add @tanstack/react-router
   pnpm add -D @tanstack/router-plugin @tanstack/router-devtools
   ```

3. Material-UIをインストール

   ```bash
   pnpm add @mui/material @emotion/react @emotion/styled
   ```

4. `vite.config.ts`にTanStack Routerプラグインを追加（reactプラグインの前に配置）

5. ファイルベースルーティング用のディレクトリとファイルを作成
   - `src/routes/__root.tsx` - ルートレイアウト
   - `src/routes/index.tsx` - ホームページ

## ディレクトリ構造

```
src/
  routes/           # ファイルベースルーティング
    __root.tsx      # ルートレイアウト（Material-UIテーマ設定を含む）
    index.tsx       # ホームページ (/)
  routeTree.gen.ts  # 自動生成されたルートツリー（Git管理外）
  main.tsx          # エントリーポイント
  index.css         # グローバルスタイル
```

## ルーティング

TanStack Routerのファイルベースルーティングを使用：

- `src/routes/index.tsx` → `/`
- `src/routes/about.tsx` → `/about`
- `src/routes/products/index.tsx` → `/products`
- `src/routes/products/$id.tsx` → `/products/:id`

`routeTree.gen.ts`は`@tanstack/router-plugin`によって自動生成されます。

## デプロイ

Cloudflare Pagesにデプロイされます。

```bash
# ビルド成果物は dist/ に出力される
pnpm build
```
