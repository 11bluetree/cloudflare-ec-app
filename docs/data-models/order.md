# Order（注文）

## テーブル: orders

顧客の注文情報。

### スキーマ

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | ULID | PRIMARY KEY | 注文ID |
| user_id | ULID | FOREIGN KEY, NOT NULL | ユーザーID |
| order_number | string | UNIQUE, NOT NULL | 注文番号 |
| status | enum | NOT NULL | 注文ステータス |
| total_amount | decimal | NOT NULL | 合計金額 |
| shipping_address | json | NOT NULL | 配送先住所 |
| payment_method | string | NOT NULL | 決済方法 |
| created_at | timestamp | NOT NULL | 作成日時 |
| updated_at | timestamp | NOT NULL | 更新日時 |

### Enum: status

- `pending` - 保留中（注文受付直後）
- `processing` - 処理中（決済確認後）
- `shipped` - 発送済み
- `completed` - 完了（配達完了）
- `cancelled` - キャンセル

## ドメイン制約

### ステータス遷移

```
pending → processing → shipped → completed
   ↓
cancelled
```

- ✅ `pending` → `processing` : 決済確認後
- ✅ `processing` → `shipped` : 発送時
- ✅ `shipped` → `completed` : 配達完了時
- ✅ `pending` or `processing` → `cancelled` : キャンセル時
- ❌ `shipped`以降はキャンセル不可
- ❌ `completed`または`cancelled`からは遷移不可

### 金額計算

- `total_amount`は全`OrderLineItems`の`subtotal`の合計
- 計算式: `Σ(unit_price × quantity)`

### 配送先住所（shipping_address JSON）

```json
{
  "postal_code": "123-4567",
  "prefecture": "東京都",
  "city": "渋谷区",
  "address_line1": "神宮前1-2-3",
  "address_line2": "マンション名 101号室",
  "recipient_name": "山田太郎",
  "phone": "090-1234-5678"
}
```

## リレーション

- **N:1** → User（注文は1人のユーザーに属する）
- **1:N** → OrderLineItems（注文は複数の明細を持つ）

## ビジネスルール

- 注文作成時に在庫チェックが必要
- 注文確定時に在庫を減らす
- キャンセル時に在庫を戻す
