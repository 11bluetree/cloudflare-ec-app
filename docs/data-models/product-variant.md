# ProductVariant（商品バリアント）

## テーブル: product_variants

商品のバリエーション（サイズ・色などの違い）を表す。

### スキーマ

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | ULID | PRIMARY KEY | バリアントID |
| product_id | ULID | FOREIGN KEY, NOT NULL | 商品ID |
| sku | string(100) | UNIQUE, NOT NULL | 商品管理コード |
| barcode | string(100) | UNIQUE, NULLABLE | バーコード（JAN/EAN/UPCなど） |
| image_url | string(500) | NULLABLE | バリアント画像URL |
| price | decimal | NOT NULL | 価格 |
| display_order | integer | NOT NULL | 表示順序 |
| created_at | timestamp | NOT NULL | 作成日時 |
| updated_at | timestamp | NOT NULL | 更新日時 |

> **注意**:
>
> - バリアントの種類（サイズ、色など）は[ProductVariantOption](./product-variant-option.md)テーブルで管理
> - 在庫情報は[Inventory](./inventory.md)テーブルで管理

## ドメイン制約

### バリアント種類

- バリアントの種類（サイズ、色、容量など）は[ProductVariantOption](./product-variant-option.md)テーブルで管理
- ✅ **すべてのバリアントには最低1つのオプションが必須**
- ✅ オプションがない場合は、**デフォルトバリアント**（`title:default`）として扱う
- ✅ オプションは**1〜5個**
- ✅ 1つのオプションに対して**最大50個まで**の値
- ✅ 商品全体で**最大100種類**のバリアント

### バリアント名の生成ルール

[ProductVariantOption](./product-variant-option.md)の`display_order`順に連結：

```typescript
// 例1: 複数オプション
オプション: [{"色": "赤"}, {"サイズ": "L"}, {"容量": "200ml"}]
→ バリアント名: "赤 / L / 200ml"

// 例2: デフォルトバリアント（オプションなし商品）
オプション: [{"title": "default"}]
→ バリアント名: "default"
```

### 価格制約

- ✅ `price`は**0以上1,000,000円未満**である必要がある（`0 <= price < 1000000`）
- ⚠️ 100万円以上の商品は決済手数料・チャージバックリスクの観点から非推奨

### SKU制約

- ✅ `sku`は**100文字以内**
- ✅ `sku`は**一意**である必要がある
- ✅ 空文字列は不可

### バーコード制約

- ✅ `barcode`は**100文字以内**（JAN-13: 13桁、EAN-13: 13桁、UPC-A: 12桁など）
- ✅ `barcode`は**一意**である必要がある（同じバーコードは1つのバリアントのみ）
- ✅ nullを許可（バーコードがない商品もある）

### 画像制約

- ✅ `image_url`は**500文字以内**
  - cloudeflare R2や外部CDNのURLを想定
- ✅ nullを許可（画像がない場合は商品の画像を表示）
- ⚠️ nullの場合、フロントエンドは商品レベルの画像（`ProductImage`）を表示する

### 画像表示ルール（フロントエンド）

```typescript
// バリアント選択時
if (selectedVariant.image_url) {
  // バリアント専用画像を表示
  displayImage = selectedVariant.image_url;
} else {
  // 商品の画像を表示
  displayImage = product.images[0].image_url;
}
```

### 表示順序制約

- ✅ `display_order`は**0以上100以下**である必要がある（`0 <= display_order <= 100`）
- 商品あたり最大100バリアントのため、0〜100の範囲（1〜100でも可）

## リレーション

- **N:1** → Product（バリアントは1つの商品に属する）
- **1:N** → ProductVariantOptions（バリアントは複数のオプションを持つ）
- **1:1** → Inventory（バリアントは1つの在庫情報を持つ）
- **1:N** → ProductImages（バリアントは複数の画像を持てる）
- **1:N** → OrderLineItems（注文明細で参照される）
- **1:N** → CartLineItems（カート明細で参照される）
