# ProductImage（商品画像）

## テーブル: product_images

商品または商品バリアントに関連付けられた画像。

### スキーマ

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | ULID | PRIMARY KEY | 画像ID |
| product_id | ULID | FOREIGN KEY, NOT NULL | 商品ID |
| product_variant_id | ULID | FOREIGN KEY, NULLABLE | バリアントID（バリアント専用画像の場合に指定） |
| image_url | string(500) | NOT NULL | 画像URL（R2） |
| display_order | integer | NOT NULL | 表示順序 |
| created_at | timestamp | NOT NULL | 作成日時 |
| updated_at | timestamp | NOT NULL | 更新日時 |

## ドメイン制約

### 所属の制約

- ✅ `product_id`は**必須**（画像は必ず商品に属する）
- ✅ `product_variant_id`は**NULLABLE**（バリアント専用画像の場合に指定）
- ✅ 両方指定可能（商品の画像をバリアントでも使用する場合）

### 画像枚数制約

- ✅ 1商品あたり**最大10枚**まで登録可能（`product_id`が同じレコード数）
- ✅ 1バリアントあたり**最大5枚**まで登録可能（`product_variant_id`が同じレコード数）
- ✅ `display_order`は**1から開始**し、連番である必要がある（1, 2, 3...）

### URL制約

- ✅ `image_url`は**500文字以内**
- ✅ Cloudflare R2のURL形式を推奨（例: `https://pub-xxxxx.r2.dev/products/...`）

### 画像種別

#### 1. 商品共通画像（product_id のみ指定）

```text
product_id: "01234...", product_variant_id: null
```

- 商品全体の共通画像
- 全バリアントで共有される画像
- 商品詳細ページのギャラリーに表示

#### 2. バリアント専用画像（両方指定）

```text
product_id: "01234...", product_variant_id: "56789..."
```

- 特定バリアント固有の画像
- UIで商品画像一覧から選択してバリアントに割り当てる
- バリアント選択時に優先的に表示される

### UI動作フロー

1. **画像アップロード**: 商品に画像を登録（`product_id`のみ指定）
2. **バリアント割り当て**: 商品画像一覧から選択してバリアントに設定（`product_variant_id`を追加で指定）
3. **表示ロジック**:
   - バリアント選択時: `product_variant_id`が一致する画像を表示
   - 未選択時: `product_variant_id`がnullの画像を表示

## リレーション

- **N:1** → Product（商品画像の場合）
- **N:1** → ProductVariant（バリアント画像の場合）

## ストレージ

- 画像実体はCloudflare R2に保存
- `image_url`はR2の公開URLまたはパス
