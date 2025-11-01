# CartLineItem（カート明細）

## テーブル: cart_line_items

カートに入れられた商品の明細。

### スキーマ

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | ULID | PRIMARY KEY | 明細ID |
| cart_id | ULID | FOREIGN KEY, NOT NULL | カートID |
| product_id | ULID | FOREIGN KEY, NOT NULL | 商品ID |
| product_variant_id | ULID | FOREIGN KEY, NOT NULL | バリアントID |
| quantity | integer | NOT NULL | 数量 |
| created_at | timestamp | NOT NULL | 作成日時 |
| updated_at | timestamp | NOT NULL | 更新日時 |

## ドメイン制約

### 数量

- ✅ `quantity`は**1以上**である必要がある
- ✅ 在庫数を超える数量は追加不可

### ユニーク制約

- ✅ 同じカート内に同じ`product_variant_id`は1つまで
- 同じバリアントを追加する場合は`quantity`を増やす

### 商品参照

- ✅ `product_id`と`product_variant_id`は両方必須
- ⚠️ 商品が削除された場合、カート明細も削除するか検討が必要

## リレーション

- **N:1** → Cart（明細は1つのカートに属する）
- **N:1** → Product（参照）
- **N:1** → ProductVariant（参照）

## ビジネスルール

- カート内の商品数量を変更する際、在庫チェックを行う
- 商品が`archived`になった場合、カートから削除または警告
- 価格は都度`ProductVariant`から取得（カート内では保持しない）
