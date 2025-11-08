import { describe, it, expect } from 'vitest';
import { faker } from '@faker-js/faker';
import { testClient } from 'hono/testing';
import product from '../products';
import type { CreateProductRequest } from '@cloudflare-ec-app/types';

// テスト用のモックD1データベース
// D1Databaseの完全な型実装は複雑なため、必要最小限のメソッドのみをモック
const mockDB: D1Database = (() => {
  const mockPreparedStatement = {
    bind: () => mockPreparedStatement,
    all: () => Promise.resolve({ results: [], success: true, meta: {} }),
    run: () => Promise.resolve({ success: true, meta: {} }),
    first: () => Promise.resolve(null),
    raw: () => Promise.resolve([]),
  };

  return {
    prepare: () => mockPreparedStatement,
    batch: () => Promise.resolve([]),
    exec: () => Promise.resolve({ count: 0, duration: 0 }),
    dump: () => Promise.resolve(new ArrayBuffer(0)),
    withSession: () => {
      throw new Error('withSession not implemented in mock');
    },
  } as unknown;
})() as D1Database;

// testClientはproductから型を自動推論するため、環境変数のみを渡す
const client = testClient(product, { DB: mockDB });

describe('POST /api/products - E2E', () => {
  describe('正常系', () => {
    it.skip('商品定義のみの登録が201を返す', async () => {
      // Arrange
      const requestBody: CreateProductRequest = {
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        categoryId: faker.string.alphanumeric(26),
        status: 'draft',
      };

      // Act
      const res = await client.index.$post({ json: requestBody });

      // Assert
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.name).toBe(requestBody.name);
      expect(body.options).toEqual([]);
      expect(body.variants).toEqual([]);
    });

    it.skip('複数バリアント指定の登録が201を返す', async () => {
      // Arrange
      const optionName = faker.commerce.productAdjective();
      const request: CreateProductRequest = {
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        categoryId: faker.string.alphanumeric(26),
        status: 'published',
        options: [{ optionName, displayOrder: 1 }],
        variants: [
          {
            sku: faker.string.alphanumeric(10),
            price: faker.number.int({ min: 100, max: 99999 }),
            displayOrder: 1,
            options: [{ optionName, optionValue: faker.commerce.productMaterial(), displayOrder: 1 }],
          },
          {
            sku: faker.string.alphanumeric(10),
            price: faker.number.int({ min: 100, max: 99999 }),
            displayOrder: 2,
            options: [{ optionName, optionValue: faker.commerce.productMaterial(), displayOrder: 1 }],
          },
        ],
      };

      // Act
      const res = await client.index.$post({ json: request });

      // Assert
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.variants).toHaveLength(2);
    });
  });

  describe('異常系', () => {
    it.skip('バリデーションエラー時に400を返す', () => {
      // Arrange
      const invalidRequest = {
        name: '', // 空文字（バリデーションエラー）
        description: faker.commerce.productDescription(),
        categoryId: faker.string.alphanumeric(26),
        status: 'draft',
      };

      // TODO: Cloudflare Workers環境でのE2Eテスト実装
      expect(invalidRequest.name).toBe('');
    });

    it.skip('カテゴリー不正時に404を返す', () => {
      // Arrange
      const request: CreateProductRequest = {
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        categoryId: 'invalid-category-id',
        status: 'draft',
      };

      // TODO: Cloudflare Workers環境でのE2Eテスト実装
      expect(request.categoryId).toBe('invalid-category-id');
    });

    it.skip('バリアント数超過時に400を返す', () => {
      // Arrange
      const MAX_VARIANTS = 100;
      const optionName = faker.commerce.productAdjective();

      // 101個のバリアントを生成
      const variants = Array.from({ length: MAX_VARIANTS + 1 }, (_, i) => ({
        sku: faker.string.alphanumeric(10),
        price: faker.number.int({ min: 100, max: 99999 }),
        displayOrder: i + 1,
        options: [{ optionName, optionValue: faker.commerce.productMaterial(), displayOrder: 1 }],
      }));

      const request = {
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        categoryId: faker.string.alphanumeric(26),
        status: 'draft',
        options: [{ optionName, displayOrder: 1 }],
        variants,
      };

      // TODO: Cloudflare Workers環境でのE2Eテスト実装
      expect(request.variants).toHaveLength(MAX_VARIANTS + 1);
    });
  });
});
