# データベース操作ガイド

## 概要

このプロジェクトではCloudflare D1（SQLiteベース）をデータベースとして使用しています。Drizzle ORMでスキーマを管理し、wranglerでマイグレーションを適用します。

## なぜローカルSQLiteが使えないのか

Cloudflare Workersは**V8エンジン（Webブラウザと同じ）**で動作するため、以下の制約があります：

- ❌ Node.jsのファイルシステムAPI（`fs`モジュール等）が使えない
- ❌ `file:`プロトコルでのローカルファイルアクセス不可
- ✅ Web標準API（fetch、Request、Response等）のみ使用可能

つまり、`file:./local.db`のようなローカルSQLiteファイルに直接アクセスできません。

## D1の仕組み

### ローカル開発

`wrangler dev`を実行すると、**D1エミュレータ**が起動します：

- 実体: `.wrangler/state/v3/d1/`配下にSQLiteファイルが作成される
- アクセス: HTTP API経由（Web標準に準拠）
- データ永続化: ファイルベースなので再起動後も残る（`.wrangler`フォルダを削除しない限り）

### 本番環境

Cloudflareのエッジネットワーク上で動作する実際のD1データベースに接続します。

### コード側の切り替え

`wrangler.jsonc`の設定により自動的に切り替わります：

```typescript
// コード側は環境を意識しない
const db = createDb(c.env.DB)
```

- ローカル: `wrangler dev` → ローカルD1エミュレータ
- 本番: `wrangler deploy` → 本番D1データベース

## DrizzleとWranglerの役割分担

### Drizzle ORMの役割

1. **スキーマ定義** (`src/infrastructure/internal/db/schema.ts`)
2. **マイグレーションSQLファイル生成** (`drizzle/`フォルダ)
3. **型安全なクエリビルダー提供**

### Wranglerの役割

1. **D1データベースの作成**
2. **マイグレーションの適用**（生成されたSQLファイルを実行）
3. **ローカルD1エミュレータの起動**

### なぜ分かれているのか

- Drizzle: D1に**直接接続できない**（HTTP API経由のみ）
- Wrangler: CloudflareのツールなのでD1と連携可能

## データベース操作の流れ

### 1. スキーマ定義

`apps/api/src/infrastructure/internal/db/schema.ts`でテーブルを定義：

```typescript
import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const usersTable = sqliteTable("users_table", {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  age: int().notNull(),
  email: text().notNull().unique(),
});
```

### 2. マイグレーションファイル生成

```bash
cd apps/api
pnpm db:generate
```

実行内容: `drizzle-kit generate`  
結果: `drizzle/0000_xxx.sql`のようなファイルが生成される

### 3. マイグレーション適用

#### ローカル環境

```bash
npx wrangler d1 migrations apply DB --local
```

#### 本番環境

```bash
npx wrangler d1 migrations apply DB --remote
```

### 4. データベース操作（コード）

```typescript
import { createDb } from './infrastructure/internal/db'
import { usersTable } from './infrastructure/internal/db/schema'

// Honoのハンドラー内
app.get('/api/users', async (c) => {
  const db = createDb(c.env.DB)
  
  // レコード挿入
  await db.insert(usersTable).values({
    name: 'John',
    age: 30,
    email: 'john@example.com',
  })
  
  // レコード取得
  const users = await db.select().from(usersTable)
  
  return c.json({ users })
})
```

## 設定ファイル

### wrangler.jsonc

```jsonc
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "ec-app-production",
      "database_id": "4a472e75-3ca9-4cd0-a2d8-006f2a016a1d",
      "migrations_dir": "drizzle"  // マイグレーションフォルダを指定
    }
  ],
  "env": {
    "dev": {
      "d1_databases": [
        {
          "binding": "DB",
          "database_name": "ec-app-dev",
          "preview_database_id": "local"  // ローカルエミュレータ使用
        }
      ]
    }
  }
}
```

### drizzle.config.ts

```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './drizzle',  // マイグレーションファイルの出力先
  schema: './src/infrastructure/internal/db/schema.ts',
  dialect: 'sqlite',
  driver: 'd1-http',  // D1用のドライバー
  dbCredentials: {
    // drizzle-kit migrate 用（本番DBに適用する場合）
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
    databaseId: process.env.CLOUDFLARE_DATABASE_ID!,
    token: process.env.CLOUDFLARE_D1_TOKEN!,
  },
});
```

## よくある操作

### 新しいD1データベースを作成

```bash
npx wrangler d1 create my-database-name
```

結果として表示される`database_id`を`wrangler.jsonc`に設定します。

### スキーマ変更の流れ

1. `schema.ts`を編集（テーブル追加、カラム追加等）
2. `pnpm db:generate` でマイグレーションファイル生成
3. `npx wrangler d1 migrations apply DB --local` でローカルに適用
4. 動作確認
5. `npx wrangler d1 migrations apply DB --remote` で本番に適用

### データベースの中身を確認

```bash
# ローカル
npx wrangler d1 execute DB --local --command "SELECT * FROM users_table"

# 本番
npx wrangler d1 execute DB --remote --command "SELECT * FROM users_table"
```

### マイグレーション履歴を確認

```bash
npx wrangler d1 migrations list DB --local
```

## トラブルシューティング

### `no such table: xxx` エラー

マイグレーションが適用されていません：

```bash
npx wrangler d1 migrations apply DB --local
```

### `URL_SCHEME_NOT_SUPPORTED: file:` エラー

Workersでは`file:`プロトコルは使えません。D1を使用してください。

### データが消えた（ローカル）

`.wrangler`フォルダを削除すると、ローカルD1のデータも消えます。  
再度マイグレーションを適用してください。

### 型エラー: `D1Database`が見つからない

型定義を生成してください：

```bash
pnpm cf-typegen
```

## 参考リンク

- [Cloudflare D1 公式ドキュメント](https://developers.cloudflare.com/d1/)
- [Drizzle ORM - D1](https://orm.drizzle.team/docs/get-started/d1-new)
- [Wrangler コマンドリファレンス](https://developers.cloudflare.com/workers/wrangler/commands/)
