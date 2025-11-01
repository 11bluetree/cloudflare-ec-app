# Category（カテゴリー）

## テーブル: categories

商品のカテゴリー分類。階層構造をサポート。

### スキーマ

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | ULID | PRIMARY KEY | カテゴリーID |
| name | string | NOT NULL | カテゴリー名 |
| parent_id | ULID | FOREIGN KEY, NULLABLE | 親カテゴリーID |
| display_order | integer | NOT NULL | 表示順序 |
| created_at | timestamp | NOT NULL | 作成日時 |
| updated_at | timestamp | NOT NULL | 更新日時 |

## ドメイン制約

### 階層構造

- ✅ `parent_id`が`null`の場合、ルートカテゴリー（第1階層）
- ✅ `parent_id`を指定することで、サブカテゴリーを作成可能
- ⚠️ 循環参照は不可（自分自身や子孫を親に指定できない）

### カテゴリー管理

- ⚠️ **カテゴリー管理UIは実装しない**（PRDより）
- カテゴリーは固定値として扱う（マスタデータ）

## リレーション

- **1:N** → Products（カテゴリーは複数の商品を持つ）
- **1:N** → Categories（親カテゴリーは複数の子カテゴリーを持つ）
- **N:1** → Category（子カテゴリーは1つの親カテゴリーに属する）
