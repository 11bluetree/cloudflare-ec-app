# Cloudflare Pages Deployment Guide

このドキュメントはフロントエンド（`apps/web`）をCloudflare Pagesにデプロイする手順を説明します。

## デプロイ方法

### 方法1: Cloudflareダッシュボード経由（推奨 - 初回）

#### 1. Cloudflare Dashboardでプロジェクトを作成

1. [Cloudflare Dashboard](https://dash.cloudflare.com/)にログイン
2. **Workers & Pages** セクションに移動
3. **Create application** > **Pages** > **Connect to Git** をクリック
4. GitHubリポジトリ `11bluetree/cloudflare-ec-app` を選択

#### 2. ビルド設定

以下の設定を入力します：

| 設定項目 | 値 |
|---------|-----|
| **Project name** | `cloudflare-ec-app-web` |
| **Production branch** | `main` |
| **Framework preset** | `Vite` |
| **Build command** | `cd apps/web && pnpm install && pnpm build` |
| **Build output directory** | `apps/web/dist` |
| **Root directory** | `/` (プロジェクトルート) |

#### 3. 環境変数（オプション）

必要に応じて以下の環境変数を設定：

```
NODE_VERSION=22
PNPM_VERSION=9
```

#### 4. デプロイ実行

**Save and Deploy** をクリックしてデプロイを開始します。

### 方法2: Wrangler CLI経由

Wrangler CLIを使用してローカルから直接デプロイできます。

#### 前提条件

```bash
# Wrangler CLIがインストールされていることを確認
npx wrangler --version

# Cloudflareにログイン（初回のみ）
npx wrangler login
```

#### デプロイコマンド

```bash
# 1. プロジェクトルートから実行
cd /home/bluetree/cloudflare-ec-app

# 2. フロントエンドをビルド
pnpm --filter web build

# 3. Cloudflare Pagesにデプロイ
cd apps/web
npx wrangler pages deploy dist --project-name=cloudflare-ec-app-web
```

#### 初回デプロイ時

プロジェクトが存在しない場合、Wranglerが自動的に作成を提案します：

```bash
npx wrangler pages deploy dist --project-name=cloudflare-ec-app-web
```

### 方法3: CI/CD（GitHub Actions）

GitHub Actionsを使用した自動デプロイも設定可能です。

ワークフローファイルは [`.github/workflows/deploy-pages.yml`](../../.github/workflows/deploy-pages.yml) を参照してください。

**必要なGitHubシークレット**:

GitHubリポジトリの **Settings** > **Secrets and variables** > **Actions** で以下を設定：

- `CLOUDFLARE_API_TOKEN`: Cloudflare APIトークン（[Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)で作成）
- `CLOUDFLARE_ACCOUNT_ID`: CloudflareアカウントID（ダッシュボードのURLまたは `wrangler whoami` で確認可能）

## デプロイ後の確認

デプロイが完了すると、以下のようなURLでアクセスできます：

- **Production**: `https://cloudflare-ec-app-web.pages.dev`
- **Preview (ブランチ)**: `https://<branch-name>.cloudflare-ec-app-web.pages.dev`

## トラブルシューティング

### ビルドエラー

#### pnpmが見つからない

Cloudflare Pagesのデフォルトはnpmです。ビルドコマンドで明示的にpnpmをインストール：

```bash
npm install -g pnpm && cd apps/web && pnpm install && pnpm build
```

または環境変数 `PNPM_VERSION=9` を設定。

#### モノレポのパス問題

ビルドコマンドは必ず `cd apps/web &&` でディレクトリを移動してから実行してください。

### デプロイ後にページが表示されない

1. **ビルド出力ディレクトリの確認**: `apps/web/dist` が正しく設定されているか
2. **SPAルーティングの設定**: TanStack Routerを使用しているため、404エラーが発生する場合は `_redirects` ファイルが必要な場合があります

`apps/web/public/_redirects` を作成：

```plaintext
/*    /index.html   200
```

## カスタムドメイン設定

1. Cloudflare Dashboardで **Custom domains** に移動
2. **Set up a custom domain** をクリック
3. ドメインを入力（例: `shop.example.com`）
4. DNS設定を確認（CloudflareがDNSを管理している場合は自動）

## 環境変数の管理

本番環境とプレビュー環境で異なる設定が必要な場合：

1. Cloudflare Dashboard > プロジェクト > **Settings** > **Environment variables**
2. 環境（Production / Preview）ごとに変数を設定
3. 例：
   - `VITE_API_URL`: バックエンドAPIのURL
   - `VITE_STRIPE_PUBLIC_KEY`: Stripeの公開キー

**注意**: Viteアプリの環境変数は `VITE_` プレフィックスが必要です。

## ローカルでのPages環境シミュレーション

Wranglerを使用してローカルでPages環境をテストできます：

```bash
cd apps/web
pnpm build
npx wrangler pages dev dist
```

## 参考リンク

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [TanStack Router Deployment](https://tanstack.com/router/latest/docs/framework/react/guide/routing#spa-deployment)
