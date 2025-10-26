# Product Requirements Document (PRD)

## ECサイト

### プロダクト概要

#### 目的

基本的なECサイトを構築し、ユーザーが商品を閲覧・検索・購入できるプラットフォームを提供する。

#### ターゲットユーザー

- **エンドユーザー**: 商品を購入したい一般消費者
- **管理者**: 商品管理、注文管理、顧客管理を行う運営者

#### 技術スタック

- **フロントエンド**: TanStack Router (SPA) / Radix UI + Tailwind CSS
- **ホスティング**: Cloudflare Pages
- **バックエンド**: Cloudflare Workers / Hono
- **データベース**: Cloudflare D1
- **ストレージ**: Cloudflare R2
- **認証**: Auth.js
- **決済**: Stripe

---

### 主要機能

#### ユーザー機能

##### 会員機能

- **ユーザー登録**
  - メールアドレスとパスワードでの登録
  - ソーシャルログイン（Google）対応
- **ログイン/ログアウト**
- **プロフィール管理**
  - 名前、住所、電話番号の登録・編集
  - パスワード変更
- **注文履歴閲覧**

##### 商品閲覧機能

- **商品一覧表示**
  - カテゴリー別表示
  - ページネーション対応
  - サムネイル画像表示
- **商品検索**
  - キーワード検索
  - カテゴリーフィルター
  - 価格帯フィルター
  - 並び替え（新着順、価格順、人気順）
- **商品詳細表示**
  - 商品名、説明文、価格
  - 商品画像（複数枚対応）
  - 在庫状況

##### カート機能

- **カートへの追加**
  - 数量選択
  - サイズ・カラー等のオプション選択
- **カート内容の表示**
  - 商品一覧と合計金額
- **カート内容の編集**
  - 数量変更
  - 商品削除

##### 購入機能

- **配送先情報入力**
  - 複数配送先の登録・選択
- **支払い方法選択**
  - Stripe によるクレジットカード決済
- **注文確認**
  - 注文内容の最終確認
- **注文完了**
  - 注文完了メール送信
  - 注文番号発行

> **注意**: お気に入り機能は実装しません。

#### 管理者機能

##### 商品管理

- **商品登録**
  - 商品名、説明文、価格、カテゴリー
  - 画像アップロード（複数枚）
  - 在庫数設定
  - 公開/非公開設定
- **商品編集**
- **商品削除**
- **在庫管理**
  - 在庫数の確認・更新
  - 在庫切れ通知

##### 注文管理

- **注文一覧表示**
  - ステータスフィルター（未処理、処理中、発送済み、完了）
  - 日付フィルター
- **注文詳細表示**
  - 顧客情報
  - 注文内容
  - 配送先情報
- **注文ステータス更新**
  - 発送処理
  - キャンセル処理
- **配送伝票番号登録**

##### 顧客管理

- **顧客一覧表示**
- **顧客詳細表示**
  - 基本情報
  - 購入履歴
- **顧客検索**

> **注意**: カテゴリー管理機能は実装しません（カテゴリーは固定値として扱います）。

> **注意**: レポート機能は実装しません。

---

### 非機能要件

#### パフォーマンス

- ページロード時間: 3秒以内
- API応答時間: 500ms以内
- 同時接続数: 1000ユーザー対応

#### セキュリティ

- HTTPS通信の強制
- SQLインジェクション対策
- XSS対策
- CSRF対策
- 個人情報の暗号化
- PCI DSS準拠（決済情報）

#### 可用性

- 稼働率: 99.9%以上
- 定期メンテナンス: 月1回（深夜時間帯）

#### スケーラビリティ

- Cloudflareのエッジネットワークを活用
- 自動スケーリング対応

#### ユーザビリティ

- レスポンシブデザイン対応（PC、タブレット、スマートフォン）
- アクセシビリティ対応（WCAG 2.1 AA準拠）
- 多言語対応（日本語、英語）

---

### API設計

#### 認証API

- `POST /api/auth/register` - ユーザー登録
- `POST /api/auth/login` - ログイン
- `POST /api/auth/logout` - ログアウト
- `GET /api/auth/me` - 現在のユーザー情報取得

#### 商品API

- `GET /api/products` - 商品一覧取得
- `GET /api/products/:id` - 商品詳細取得
- `POST /api/products` - 商品登録（管理者のみ）
- `PUT /api/products/:id` - 商品更新（管理者のみ）
- `DELETE /api/products/:id` - 商品削除（管理者のみ）

#### カテゴリーAPI

- `GET /api/categories` - カテゴリー一覧取得
- `POST /api/categories` - カテゴリー登録（管理者のみ）
- `PUT /api/categories/:id` - カテゴリー更新（管理者のみ）
- `DELETE /api/categories/:id` - カテゴリー削除（管理者のみ）

#### カートAPI

- `GET /api/cart` - カート内容取得
- `POST /api/cart` - カートに追加
- `PUT /api/cart/:id` - カート内容更新
- `DELETE /api/cart/:id` - カートから削除

#### 注文API

- `GET /api/orders` - 注文一覧取得
- `GET /api/orders/:id` - 注文詳細取得
- `POST /api/orders` - 注文作成
- `PUT /api/orders/:id` - 注文更新（管理者のみ）

#### ユーザーAPI

- `GET /api/users/me` - 自分のプロフィール取得
- `PUT /api/users/me` - プロフィール更新
- `GET /api/users/me/orders` - 自分の注文履歴取得

---

### UI/UX設計

#### 主要画面

- トップページ
- 商品一覧ページ
- 商品詳細ページ
- カートページ
- チェックアウトページ
- 注文完了ページ
- マイページ
- ログイン/登録ページ
- 管理画面（ダッシュボード、商品管理、注文管理等）

#### デザインガイドライン

- Radix UI + Tailwind CSS を使用
- シンプルで直感的なUI
- 統一されたカラースキーム
- わかりやすいナビゲーション
- モバイルファーストデザイン

---

### リスクと対策

| リスク | 影響 | 対策 |
|--------|------|------|
| セキュリティ侵害 | 高 | 定期的なセキュリティ監査、脆弱性対策 |
| 決済エラー | 高 | 複数決済手段の用意、エラーハンドリングの徹底 |
| 在庫管理の不一致 | 中 | リアルタイム在庫管理、在庫切れ通知 |
| パフォーマンス低下 | 中 | CDN活用、キャッシュ戦略、負荷分散 |
| ユーザビリティの問題 | 中 | ユーザーテスト、フィードバック収集 |

---

### 参考資料

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [TanStack Router Documentation](https://tanstack.com/router)
- [Radix UI Documentation](https://www.radix-ui.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Hono Framework](https://hono.dev/)
- [Stripe Documentation](https://stripe.com/docs)
- [PCI DSS Requirements](https://www.pcisecuritystandards.org/)
