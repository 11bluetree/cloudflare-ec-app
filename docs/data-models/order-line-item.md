# OrderLineItem（注文明細）

## テーブル: order_line_items

注文に含まれる商品の明細。

### スキーマ

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | ULID | PRIMARY KEY | 明細ID |
| order_id | ULID | FOREIGN KEY, NOT NULL | 注文ID |
| product_id | ULID | FOREIGN KEY, NOT NULL | 商品ID |
| product_variant_id | ULID | FOREIGN KEY, NOT NULL | バリアントID |
| quantity | integer | NOT NULL | 数量 |
| unit_price | decimal | NOT NULL | 単価 |
| subtotal | decimal | NOT NULL | 小計 |
| created_at | timestamp | NOT NULL | 作成日時 |

## ドメイン制約

### 数量

- ✅ `quantity`は**1以上**である必要がある

### 価格

- ✅ `unit_price`は注文時点の`ProductVariant.price`を記録
- ✅ `subtotal = unit_price × quantity`
- ⚠️ 後から商品価格が変更されても、注文明細の価格は変わらない

### 商品参照

- ✅ `product_id`と`product_variant_id`は両方必須
- ⚠️ 商品やバリアントが削除されても、注文履歴として残す必要がある

## リレーション

- **N:1** → Order（明細は1つの注文に属する）
- **N:1** → Product（参照のみ、削除時も保持）
- **N:1** → ProductVariant（参照のみ、削除時も保持）

## ビジネスルール

- 注文確定時に`ProductVariant.stock_quantity`を減らす
- キャンセル時に在庫を戻す
- 価格は注文時点でスナップショット
