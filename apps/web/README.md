# Web Frontend

TanStack Router + Radix UI + Tailwind CSSを使用したSPAフロントエンドアプリケーション。

## 技術スタック

- **React 19** - UIライブラリ
- **TanStack Router** - 型安全なファイルベースルーティング
- **Radix UI** - ヘッドレスUIコンポーネント
- **Tailwind CSS** - ユーティリティファーストCSSフレームワーク
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

3. Radix UIとTailwind CSSをインストール

   ```bash
   pnpm add @radix-ui/react-slot @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-label @radix-ui/react-separator
   pnpm add -D tailwindcss
   ```

4. `vite.config.ts`にTanStack Routerプラグインを追加（reactプラグインの前に配置）

5. ファイルベースルーティング用のディレクトリとファイルを作成
   - `src/routes/__root.tsx` - ルートレイアウト
   - `src/routes/index.tsx` - ホームページ

## ディレクトリ構造

```
src/
  routes/           # ファイルベースルーティング
    __root.tsx      # ルートレイアウト
    index.tsx       # ホームページ (/)
  routeTree.gen.ts  # 自動生成されたルートツリー（Git管理外）
  main.tsx          # エントリーポイント
  index.css         # グローバルスタイル（Tailwind CSSディレクティブを含む）
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
