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
