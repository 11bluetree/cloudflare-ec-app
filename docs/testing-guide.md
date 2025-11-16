# テストガイド

テスト作成の原則をまとめる。

## 閾値が変更されても、テストケース名は変更不要にすること

### ❌ 悪い例：具体的な数字を含める

```typescript
it('オプションが0個の場合はエラー', () => { ... });
it('文字数が200文字を超えた場合はエラー', () => { ... });
```

### ✅ 良い例：概念的な表現を使う

```typescript
it('オプションが最小数未満の場合はエラー', () => { ... });
it('最大文字数を超えた場合はエラー', () => { ... });
```

### アサーションはハードコーディングでOK

```typescript
it('最大文字数を超えた場合はエラー', () => {
  const name = 'あ'.repeat(MAX_NAME_LENGTH + 1); // 定数でテストデータ生成
  expect(() => {
    Product.create(..., name, ...);
  }).toThrow('商品名は200文字以内である必要があります'); // ハードコーディング
});
```

### 定数の使い方

- ✅ テストデータ生成に使用
- ❌ テストケース名やアサーションに使用しない

```typescript
// ✅ 良い
const name = 'あ'.repeat(MAX_LENGTH + 1);
expect(() => ...).toThrow('名前は200文字以内である必要があります');

// ❌ 悪い
it(`オプションが${MIN_OPTIONS}個未満の場合はエラー`, () => { ... });
expect(() => ...).toThrow(`オプションは最低${MIN_OPTIONS}個必要です`);
```

## テストデータの生成

### Fakerを使用する

モックデータの生成には [Faker](https://fakerjs.dev/) を使用する。

```typescript
import { faker } from '@faker-js/faker';

// ランダムな商品名
const name = faker.commerce.productName();

// ランダムな説明文
const description = faker.commerce.productDescription();

// ランダムなUUID
const id = faker.string.uuid();

// ランダムな価格
const price = faker.number.int({ min: 0, max: 999999 });

// ランダムなURL
const imageUrl = faker.image.url();
```

### 境界値テストでは固定値を使用

```typescript
// ✅ 境界値テストは制御された値を使う
it('最大文字数の場合は成功', () => {
  const name = 'あ'.repeat(MAX_LENGTH);
  expect(() => Product.create(..., name, ...)).not.toThrow();
});

// ❌ 境界値テストでランダム値は使わない
it('最大文字数の場合は成功', () => {
  const name = faker.string.alpha(MAX_LENGTH); // 長さが不確定
  expect(() => Product.create(..., name, ...)).not.toThrow();
});
```

## 仕様の変更は先にテストケースを修正すること

仕様変更が発生した場合、まずテストケースを修正し、その後に実装を更新する。これにより、テストが最新の仕様を反映し、実装が正しく動作していることを保証できる。

## リポジトリテストでのデータベース利用

### `getPlatformProxy` の使用

テスト環境では、wranglerの`getPlatformProxy` APIを使用して、本番環境と同じD1Databaseインスタンスを取得します。

```typescript
import { getEnv } from '../../../../test/setup';
import { createDbConnection } from '../../db/connection';

describe('CategoryRepository', () => {
  let db: ReturnType<typeof createDbConnection>;

  beforeEach(async () => {
    // envからD1Databaseを取得
    const env = getEnv();
    
    // テーブルをクリーンアップ
    await env.DB.exec('DELETE FROM categories');

    // Drizzle ORMのコネクションを作成
    db = createDbConnection(env.DB);
  });

  // テストケース...
});
```

### 環境別のデータベース

| 環境 | データベース | 実際のエンジン | アクセス方法 |
|------|------------|--------------|------------|
| 本番 | Cloudflare D1 | 分散SQLite | D1 API（ネイティブ） |
| ローカル開発 | miniflare | better-sqlite3 | D1 API（wrangler devが起動） |
| テスト | miniflare | better-sqlite3 | D1 API（getPlatformProxyが起動） |

### 仕組みの説明

**ローカル開発（`wrangler dev`）の場合:**

- `wrangler dev`コマンドが内部で`miniflare`を起動
- miniflareがbetter-sqlite3をD1 APIでラップ
- コードは`env.DB`として本番と同じインターフェースでアクセス

**テスト（Vitest）の場合:**

- `getPlatformProxy` APIを呼び出す
- wranglerが内部で`miniflare`を起動
- `wrangler.test.jsonc`の設定を読み込む
- miniflareがbetter-sqlite3をD1 APIでラップ
- `env.DB`として本番と同じインターフェースを提供

### セットアップの実装場所

**`src/test/setup.ts`**: グローバルセットアップ

```typescript
import { getPlatformProxy } from 'wrangler';

let platformProxy: Awaited<ReturnType<typeof getPlatformProxy<Env>>>;

beforeAll(async () => {
  // wrangler.test.jsonc の設定でプラットフォームプロキシを起動
  platformProxy = await getPlatformProxy<Env>({
    configPath: 'wrangler.test.jsonc',
  });
});

afterAll(async () => {
  await platformProxy?.dispose();
});

export function getEnv() {
  if (!platformProxy) {
    throw new Error('Platform proxy not initialized');
  }
  return platformProxy.env;
}
```

### 重要な注意点

- ✅ `getEnv()`を使用してD1Databaseインスタンスを取得
- ✅ `beforeEach`でテーブルをクリーンアップして、テスト間の独立性を確保
- ✅ 本番・ローカル・テストで完全に同じD1 APIを使用
- ❌ better-sqlite3を直接使用しない（不要）
- ❌ 各テストファイルで個別に`getPlatformProxy`を呼び出さない（`setup.ts`で一元管理）
