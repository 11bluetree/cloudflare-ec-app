# ProductImage（商品画像）

## テーブル: product_images

商品または商品バリアントに関連付けられた画像。

### スキーマ

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | ULID | PRIMARY KEY | 画像ID |
| product_id | ULID | FOREIGN KEY, NOT NULL | 商品ID |
| product_variant_id | ULID | FOREIGN KEY, NULLABLE | バリアントID（バリアント専用画像の場合に指定） |
| image_key | string(500) | NOT NULL | 画像キー（R2のオブジェクトキー） |
| display_order | integer | NOT NULL | 商品全体での表示順序（1〜100の通し番号） |
| variant_display_order | integer | NULLABLE | バリアント内での表示順序（1〜2、バリアント専用画像の場合のみ） |
| created_at | timestamp | NOT NULL | 作成日時 |
| updated_at | timestamp | NOT NULL | 更新日時 |

## ドメイン制約

### 所属の制約

- ✅ `product_id`は**必須**（画像は必ず商品に属する）
- ✅ `product_variant_id`は**NULLABLE**（バリアント専用画像の場合に指定）
- ✅ バリアント専用画像の場合、両方のIDが設定される

### 画像枚数制約

- ✅ 1商品全体で**最大100枚**まで登録可能（現在のバリアント最大数に依存）
  - 将来的にバリアント1つあたり2枚対応時は**最大200枚**
- ✅ 1バリアントあたり**最大1枚**まで登録可能（`product_variant_id`が同じレコード数）
  - 将来的に**最大2枚**まで拡張予定
- ✅ 商品共通画像とバリアント専用画像の合計が商品全体の上限を超えてはならない
  - 例: 100バリアントすべてに画像を設定した場合、商品共通画像は追加不可

### 表示順序制約

#### display_order（商品全体での順序）

- ✅ **1から開始**し、商品全体で連番（1, 2, 3... 最大100）
- ✅ 商品共通画像とバリアント専用画像を含めた通し番号
- ✅ 商品詳細ページのギャラリー表示順序として使用

#### variant_display_order（バリアント内での順序）

- ✅ バリアント専用画像（`product_variant_id`が指定されている）の場合のみ設定
- ✅ **1から開始**し、バリアント内で連番（1, 2... 現在は最大1、将来は最大2）
- ✅ 商品共通画像（`product_variant_id`がnull）の場合は**null**
- ✅ バリアント選択時の画像表示順序として使用

### URL制約

- ✅ `image_url`は**500文字以内**
- ✅ Cloudflare R2のURL形式を推奨（例: `https://pub-xxxxx.r2.dev/products/...`）

### 画像種別とデータパターン

#### 1. 商品共通画像（product_id のみ指定）

```text
product_id: "01234...", product_variant_id: null, display_order: 1, variant_display_order: null
product_id: "01234...", product_variant_id: null, display_order: 2, variant_display_order: null
```

- 商品全体の共通画像
- 全バリアントで共有される画像
- 商品詳細ページのギャラリーに表示
- `variant_display_order`は**null**

#### 2. バリアント専用画像（両方指定）

```text
product_id: "01234...", product_variant_id: "abc...", display_order: 10, variant_display_order: 1
product_id: "01234...", product_variant_id: "def...", display_order: 11, variant_display_order: 1
```

- 特定バリアント固有の画像
- バリアント登録画面で画像を追加すると、`product_id`と`product_variant_id`が両方セットされる
- バリアント選択時に優先的に表示される
- `variant_display_order`は**1から開始**（現在は1のみ、将来は1〜2）

### UI動作フロー

1. **バリアント登録画面で画像追加**:
   - 画像アップロード時に`product_id`と`product_variant_id`を両方指定
   - `display_order`は商品全体で自動採番
   - `variant_display_order`はバリアント内で自動採番（現在は常に1）

2. **表示ロジック**:
   - バリアント選択時: `product_variant_id`が一致する画像を`variant_display_order`順で表示
   - バリアント未選択時: `product_variant_id`がnullの画像を`display_order`順で表示

## リレーション

- **N:1** → Product（商品画像の場合）
- **N:1** → ProductVariant（バリアント画像の場合）

## ストレージ

- 画像実体はCloudflare R2に保存
- `image_url`はR2の公開URLまたはパス
