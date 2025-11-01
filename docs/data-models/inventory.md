# Inventory（在庫）

## テーブル: inventory

商品バリアントの在庫情報を管理。実在庫と予約在庫を分離して管理する。

### スキーマ

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | ULID | PRIMARY KEY | 在庫ID |
| product_variant_id | ULID | FOREIGN KEY, UNIQUE, NOT NULL | バリアントID |
| physical_stock | integer | NOT NULL | 実在庫数 |
| reserved_stock | integer | NOT NULL | 予約済み在庫数 |
| available_stock | integer | NOT NULL | 販売可能在庫数（計算値） |
| lot_number | string(100) | NULLABLE | ロット番号 |
| created_at | timestamp | NOT NULL | 作成日時 |
| updated_at | timestamp | NOT NULL | 更新日時 |

### 計算ルール

```typescript
available_stock = physical_stock - reserved_stock
```

- `physical_stock`: 実際に倉庫にある在庫数
- `reserved_stock`: 予約販売で確保されている数
- `available_stock`: 今すぐ販売可能な数

## ドメイン制約

### 在庫数の制約

- ✅ `physical_stock`は**0以上100,000未満**である必要がある（`0 <= physical_stock < 100000`）
- ✅ `reserved_stock`は**0以上1,000,000未満**である必要がある（`0 <= reserved_stock < 1000000`）
- ✅ `available_stock = physical_stock - reserved_stock`
- ✅ `available_stock`は**マイナスになり得る**（予約オーバー時）
- ✅ `lot_number`は**100文字以内**の文字列（nullable）

### 在庫操作の制約

#### 通常販売

- 注文時: `available_stock >= 注文数`をチェック
- 在庫減算: `physical_stock -= 注文数`

#### 予約販売

- 予約受付時: 制限なし（または予約上限をビジネスロジックで管理）
- 予約確定時: `reserved_stock += 予約数`
- 商品入荷時: `physical_stock += 入荷数`
- 出荷時（コミット時）:
  - `physical_stock >= reserved_stock`をチェック
  - `reserved_stock -= 出荷数`
  - `physical_stock -= 出荷数`

### 整合性制約

- ✅ 1つの`product_variant_id`に対して1つの`inventory`レコードのみ（UNIQUE制約）
- ✅ `reserved_stock`は`physical_stock`を超えることがある（予約オーバーコミット）
- ✅ 在庫更新はトランザクション内で実行

## ビジネスルール

### 在庫チェックのタイミング

| 販売方式 | チェックタイミング | チェック内容 |
|---------|------------------|------------|
| 通常販売 | 注文確定時 | `available_stock >= quantity` |
| 予約販売 | 出荷時（コミット時） | `physical_stock >= reserved_stock` |

### 在庫不足時の挙動

- **通常販売**: 注文を即座に失敗させる
- **予約販売**: 予約受付は可能、出荷時に在庫不足なら管理者に通知

### 売り越し対策

トランザクション内でアトミックに更新：

```sql
-- 通常販売時の在庫減算
UPDATE inventory 
SET physical_stock = physical_stock - ?, 
    available_stock = physical_stock - reserved_stock - ?
WHERE product_variant_id = ? 
  AND available_stock >= ?
```

## リレーション

- **1:1** → ProductVariant（在庫は1つのバリアントに対応）

## ロット管理

### ロット番号（lot_number）

- 期限管理が必要な商品（食品、化粧品など）のロット追跡用
- 将来的に有効期限（`expiry_date`）カラムを追加する可能性あり
- 現時点では参照のみ（ロット単位の在庫管理はしない）

## 将来的な拡張

以下の機能は現時点では実装しないが、将来的に拡張可能：

- ❌ 複数倉庫管理（`warehouse_id`の追加）
- ❌ ロット別在庫管理（ロット単位での在庫数管理）
- ❌ 有効期限管理（`expiry_date`の追加）
- ❌ 在庫移動履歴（別テーブル`inventory_transactions`）
- ❌ 安全在庫・発注点管理（`safety_stock`, `reorder_point`）
