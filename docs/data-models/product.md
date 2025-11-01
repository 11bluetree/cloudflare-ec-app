# Product（商品）

## テーブル: products

### スキーマ

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | ULID | PRIMARY KEY | 商品ID |
| name | string(200) | NOT NULL | 商品名 |
| description | text(4096) | NOT NULL | 商品説明 |
| category_id | ULID | FOREIGN KEY | カテゴリーID |
| status | enum | NOT NULL | 商品ステータス |
| created_at | timestamp | NOT NULL | 作成日時 |
| updated_at | timestamp | NOT NULL | 更新日時 |

### Enum: status

- `draft` - 下書き（非公開）
- `published` - 公開中
- `archived` - アーカイブ済み

## ドメイン制約

### 文字数制約

- ✅ `name`は**200文字以内**
- ✅ `description`は**4096文字以内**

### 画像制約

- ✅ 商品画像は`ProductImage`テーブルで管理（複数枚登録可能）
- ✅ 商品一覧のサムネイルは`ProductImage`の`display_order=1`の画像を使用
- ⚠️ 画像が1枚もない場合は、プレースホルダー画像を表示

### ステータス遷移制約

- ✅ `published`に遷移するには、最低1つの`ProductVariant`が必要
- ✅ `archived`からは`published`にも`draft`にも戻せない
  - 監査やトレーサビリティの観点から
  - 複製して新規作成してもらうフロー
- ✅ `published` → `draft` は可能（unpublish）
- ✅ 任意の状態から`archived`への遷移は可能

## リレーション

- **N:1** → Category（商品は1つのカテゴリーに属する）
- **1:N** → ProductVariants（商品は複数のバリアントを持つ）
- **1:N** → ProductImages（商品は複数の画像を持つ）
