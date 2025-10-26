# Cloudflare ECアプリ開発ガイド

## プロジェクト概要

このプロジェクトは**DDD（ドメイン駆動設計）の学習を目的**とした、Cloudflareインフラ上で動作するECプラットフォームです。クリーンな関心の分離とCloudflareのエッジコンピューティング機能を活用した設計を重視しています。

## アーキテクチャ

### モノレポ構成（pnpmワークスペース）

- `apps/api` - Honoフレームワークを使用したCloudflare Workersバックエンド
- `apps/web` - TanStack Router + Radix UI + Tailwind CSSを使用したSPAフロントエンド（Cloudflare Pagesにデプロイ）
- `packages/library` - 共有ドメインロジックとビジネスルール（DDDコア）
- `packages/types` - フロントエンド/バックエンド間で共有するTypeScript型定義
- `packages/config` - 共有設定

### 技術スタック

- **バックエンド**: Cloudflare Workers + Hono（Node.js APIは使用不可）
- **データベース**: Cloudflare D1（SQLiteベースのエッジデータベース）
- **ストレージ**: Cloudflare R2（S3互換オブジェクトストレージ）
- **認証**: Auth.js（エッジランタイム対応版）
- **決済**: Stripe
- **フロントエンド**: TanStack Router（型安全なルーティング）+ Radix UI + Tailwind CSS

## DDD原則

このプロジェクトはドメイン駆動設計パターンに従います：

- **ドメインモデル**は `packages/library` に配置し、フレームワーク非依存にする
- **エンティティ、値オブジェクト、集約、ドメインサービス**を分離する
- **リポジトリ**でデータアクセス（D1/R2）を抽象化する
- APIレイヤー（`apps/api`）は薄く保ち、ドメインロジックに委譲する
- 貧血ドメインモデルを避ける - ビジネスロジックはサービスではなくドメインオブジェクトに配置
- **まずはオブジェクトの関心事の分離を主とする** - 高度なDDDパターン（イベントソーシング、CQRS等）は使用しない

### コアドメイン概念（PRDより）

**集約**: Order（OrderLineItemsを含む）、Cart（CartLineItemsを含む）、Product（ProductImagesを含む）

**エンティティ**: User、Product、Order、Cart

**値オブジェクト**: ShippingAddress、Money/Price

## 開発ワークフロー

### デプロイメント

- **本番環境**: mainブランチへのマージで自動デプロイ
- **環境**: PoC（概念実証）のため、本番環境の概念はなし

### pnpmの使い方

```bash
pnpm install                    # 全依存関係をインストール
pnpm --filter api <command>     # apiワークスペースでコマンド実行
pnpm --filter web <command>     # webワークスペースでコマンド実行
pnpm -r <command>              # 全ワークスペースでコマンド実行
```

### Cloudflare固有のコマンド

```bash
wrangler dev                    # Workersのローカル開発
wrangler d1 execute <db> --file=<sql>  # DBマイグレーション実行
wrangler r2 bucket create <name>        # R2バケット作成
wrangler pages dev <dir>        # Pagesのローカル開発
```

## 重要な制約と規約

### 環境変数と設定

- **Viteのビルトイン環境変数を優先使用**: [Vite 環境変数とモード](https://ja.vite.dev/guide/env-and-mode)に記載されている`import.meta.env`の組み込み変数を活用する
- クライアント公開用の環境変数には`VITE_`プレフィックスを使用
- `.env.production`はViteが自動で読み込む（`vite.config.ts`で`define`を使わない）
- Cloudflare Workers固有の環境変数が必要な場合のみ、`wrangler.jsonc`の`vars`や`.dev.vars`を使用

### バリデーション

- **Zod**を使用してリクエスト/レスポンスのバリデーションを実施
- APIエンドポイントの入力検証は必須
- 型安全性を保つため、Zodスキーマから型を導出する

### Cloudflare Workersランタイム

- **Node.js APIは使用不可** - Web APIのみ使用（fetch、Request、Response）
- Honoで `c.env` を使用してバインディング（D1、R2、シークレット）にアクセス
- バンドル後のWorkersは1MB以下に保つ
- コールドスタートのパフォーマンスを考慮 - 重い初期化処理を避ける

### データベース（D1）

- D1はエッジロケーション間で**結果整合性**
- SQLインジェクション防止のため**プリペアドステートメント**を必ず使用
- 接続はDrizzle ORMを通じて行う
- 可能な限りバッチ操作を使用（D1にはリクエストごとのクエリ制限あり）
- スキーマはPRDセクション4.1で定義 - 厳密に従う

### API設計

全エンドポイントはPRDセクション5のREST規約に従います：
- `/api/auth/*` - 認証
- `/api/products/*` - 商品管理
- `/api/cart/*` - ショッピングカート
- `/api/orders/*` - 注文処理
- `/api/users/*` - ユーザープロフィール

**認証**: 保護されたエンドポイントでは、ミドルウェアで `role`（customer vs admin）をチェック

### データモデル

完全なスキーマは `docs/prd.md` セクション4.1を参照。重要な注意点：
- 全IDに**UUID**を使用
- `status` enumは重要（Order: pending/processing/shipped/completed/cancelled）
- Ordersテーブルの `shipping_address` はJSONで保存
- **お気に入りテーブルはなし** - スコープから明示的に除外

### 実装しない機能

PRDにより、以下は**明示的に実装しない**：
- お気に入り/ウィッシュリスト機能
- カテゴリー管理UI（カテゴリーは固定値として扱う）
- 分析/レポート機能

## コード構成パターン

### APIルート（apps/api）

```typescript
// HTTPメソッドではなくドメイン集約でグループ化
// 良い例: routes/orders/create.ts, routes/orders/update.ts
// 悪い例: routes/post.ts, routes/put.ts
```

### 共有型（packages/types）

```typescript
// PRDのデータモデルを正確に反映
// APIリクエスト/レスポンス用のDTOをエクスポート
// IDにはブランド型を使用: type UserId = string & { __brand: 'UserId' }
```

### ドメインロジック（packages/library）

```typescript
// 純粋なTypeScript - フレームワーク依存なし
// ドメインエンティティ、値オブジェクト、サービスをエクスポート
// ビジネスルールをここに配置（例: Order.calculateTotal()、Product.isInStock()）
```

## テスト戦略

- **テストフレームワーク**: Jest
- **API**: Workers テスト環境を使用した統合テスト
- **ドメインロジック**: 単体テスト（純粋TypeScript、高速）
- **フロントエンド**: Testing Libraryを使用したコンポーネントテスト

## セキュリティチェックリスト

PRDセクション3.2より：
- 常にプリペアドステートメントを使用（SQLインジェクション対策）
- ユーザー入力のサニタイズ（XSS対策）
- 変更操作にCSRFトークンを使用
- 保護されたエンドポイントで毎回認証を検証
- 機密データ（パスワード、決済情報）をログに記録しない

## 参考ドキュメント

- 完全な要件: `docs/prd.md`
- データモデル: `docs/prd.md` セクション4.1
- API仕様: `docs/prd.md` セクション5
