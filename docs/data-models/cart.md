# Cart（カート）

## テーブル: carts

ユーザーのショッピングカート。

### スキーマ

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | ULID | PRIMARY KEY | カートID |
| user_id | ULID | FOREIGN KEY, NOT NULL | ユーザーID |
| status | enum | NOT NULL | カートステータス |
| created_at | timestamp | NOT NULL | 作成日時 |
| updated_at | timestamp | NOT NULL | 更新日時 |

### Enum: status

- `active` - アクティブ（現在使用中）
- `abandoned` - 放棄された（一定期間未使用）
- `ordered` - 注文済み（注文作成時に遷移）
- `merged` - 統合済み（ゲスト→ログイン時に統合）

## ドメイン制約

### ステータス遷移

```
active → ordered (注文確定時)
active → abandoned (一定期間未使用)
active → merged (ゲストカートとログインユーザーカートの統合)
```

- ✅ ユーザーは1つの`active`カートのみ持つ
- ✅ 注文確定時に`active` → `ordered`へ遷移
- ✅ 新しい`active`カートが自動作成される

### カート管理

- 1ユーザー = 1つの`active`カート
- `ordered`または`merged`になったカートは履歴として保持

## リレーション

- **N:1** → User（カートは1人のユーザーに属する）
- **1:N** → CartLineItems（カートは複数の明細を持つ）

## ビジネスルール

- ゲストユーザーもセッションベースでカートを持てる
- ログイン時にゲストカートとユーザーカートを統合
- 一定期間（例: 30日）未使用のカートは`abandoned`にする
