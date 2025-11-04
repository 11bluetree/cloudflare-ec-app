import { describe, it, expect } from 'vitest';
import { testClient } from 'hono/testing';
import category from '../categories';

// テスト用のモックD1データベース
const createMockD1 = () => {
  const mockStmt = {
    bind: function () {
      return this;
    },
    all: () => Promise.resolve({ results: [], success: true, meta: {} }),
    run: () => Promise.resolve({ success: true, meta: {} }),
    first: () => Promise.resolve(null),
    raw: () => Promise.resolve([]),
  };

  return {
    prepare: () => mockStmt,
    batch: () => Promise.resolve([{ results: [], success: true, meta: {} }]),
    exec: () => Promise.resolve({ count: 0, duration: 0 }),
    dump: () => Promise.resolve(new ArrayBuffer(0)),
  } as unknown as D1Database;
};

describe('GET /api/categories - E2E', () => {
  it.skip('カテゴリー一覧が取得できる', async () => {
    // Arrange
    const mockDB = createMockD1();
    const client = testClient(category, { DB: mockDB });

    // Act
    const res = await client.index.$get();

    // Assert
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('categories');
    expect(Array.isArray(body.categories)).toBe(true);
  });

  it.skip('カテゴリーが存在しない場合は空配列を返す', async () => {
    // Arrange
    const mockDB = createMockD1();
    const client = testClient(category, { DB: mockDB });

    // Act
    const res = await client.index.$get();

    // Assert
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.categories).toEqual([]);
  });
});
