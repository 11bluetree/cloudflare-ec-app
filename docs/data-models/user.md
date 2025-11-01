# User（ユーザー）

## テーブル: users

### スキーマ

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | ULID | PRIMARY KEY | ユーザーID |
| email | string | UNIQUE, NOT NULL | メールアドレス |
| password_hash | string | NOT NULL | パスワードハッシュ |
| name | string | NOT NULL | ユーザー名 |
| phone | string | NULLABLE | 電話番号 |
| role | enum | NOT NULL | ユーザーロール |
| created_at | timestamp | NOT NULL | 作成日時 |
| updated_at | timestamp | NOT NULL | 更新日時 |

### Enum: role

- `customer` - 一般顧客
- `admin` - 管理者

## ドメイン制約

- ✅ emailは一意である必要がある
- ✅ password_hashは平文パスワードではなくハッシュ化された値
- ✅ roleはcustomerまたはadminのみ

## リレーション

- **1:N** → Orders（ユーザーは複数の注文を持つ）
- **1:1** → Carts（ユーザーは1つのアクティブなカートを持つ）
