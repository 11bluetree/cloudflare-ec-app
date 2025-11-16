import { faker } from '@faker-js/faker';
import { beforeEach, describe, expect, it } from 'vitest';
import { CategoryRepository } from '../category.repository';
import { createDbConnection } from '../../db/connection';
import { categories } from '../../db/schema';
import { getEnv } from '../../../../test/setup';
import { cleanupAllTables } from '../../../../test/helpers/db-cleanup';

describe('CategoryRepository', () => {
  let repository: CategoryRepository;
  let db: ReturnType<typeof createDbConnection>;

  beforeEach(async () => {
    // envからD1Databaseを取得
    const env = getEnv();
    db = createDbConnection(env.DB);

    // すべてのテーブルをクリーンアップ
    await cleanupAllTables(db);

    repository = new CategoryRepository(db);
  });

  describe('findByIds', () => {
    it('指定されたIDのカテゴリーを取得できる', async () => {
      // テストデータを挿入
      const now = new Date();
      const category1Id = faker.string.alphanumeric(26);
      const category2Id = faker.string.alphanumeric(26);

      await db.insert(categories).values([
        {
          id: category1Id,
          name: 'エレクトロニクス',
          parentId: null,
          displayOrder: 1,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: category2Id,
          name: 'ファッション',
          parentId: null,
          displayOrder: 2,
          createdAt: now,
          updatedAt: now,
        },
      ]);

      // テスト実行
      const result = await repository.findByIds([category1Id, category2Id]);

      // 検証
      expect(result.size).toBe(2);
      expect(result.get(category1Id)?.name).toBe('エレクトロニクス');
      expect(result.get(category2Id)?.name).toBe('ファッション');
    });

    it('存在しないIDを指定した場合は結果に含まれない', async () => {
      // テストデータを挿入
      const now = new Date();
      const existingId = faker.string.alphanumeric(26);
      const nonExistentId = faker.string.alphanumeric(26);

      await db.insert(categories).values({
        id: existingId,
        name: 'スポーツ',
        parentId: null,
        displayOrder: 1,
        createdAt: now,
        updatedAt: now,
      });

      // テスト実行
      const result = await repository.findByIds([existingId, nonExistentId]);

      // 検証
      expect(result.size).toBe(1);
      expect(result.has(existingId)).toBe(true);
      expect(result.has(nonExistentId)).toBe(false);
    });

    it('空の配列を渡した場合は空のMapを返す', async () => {
      // テスト実行
      const result = await repository.findByIds([]);

      // 検証
      expect(result.size).toBe(0);
    });

    it('親カテゴリーを持つカテゴリーを取得できる', async () => {
      // テストデータを挿入
      const now = new Date();
      const parentId = faker.string.alphanumeric(26);
      const childId = faker.string.alphanumeric(26);

      await db.insert(categories).values([
        {
          id: parentId,
          name: 'エレクトロニクス',
          parentId: null,
          displayOrder: 1,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: childId,
          name: 'スマートフォン',
          parentId: parentId,
          displayOrder: 1,
          createdAt: now,
          updatedAt: now,
        },
      ]);

      // テスト実行
      const result = await repository.findByIds([childId]);

      // 検証
      expect(result.size).toBe(1);
      const childCategory = result.get(childId);
      expect(childCategory?.name).toBe('スマートフォン');
      expect(childCategory?.parentId).toBe(parentId);
    });
  });

  describe('findAll', () => {
    it('全カテゴリーをdisplay_order順で取得できる', async () => {
      // テストデータを挿入
      const now = new Date();

      await db.insert(categories).values([
        {
          id: faker.string.alphanumeric(26),
          name: 'ホーム＆ガーデン',
          parentId: null,
          displayOrder: 3,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: faker.string.alphanumeric(26),
          name: 'エレクトロニクス',
          parentId: null,
          displayOrder: 1,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: faker.string.alphanumeric(26),
          name: 'ファッション',
          parentId: null,
          displayOrder: 2,
          createdAt: now,
          updatedAt: now,
        },
      ]);

      // テスト実行
      const result = await repository.findAll();

      // 検証
      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('エレクトロニクス');
      expect(result[0].displayOrder).toBe(1);
      expect(result[1].name).toBe('ファッション');
      expect(result[1].displayOrder).toBe(2);
      expect(result[2].name).toBe('ホーム＆ガーデン');
      expect(result[2].displayOrder).toBe(3);
    });

    it('カテゴリーが存在しない場合は空配列を返す', async () => {
      // テスト実行
      const result = await repository.findAll();

      // 検証
      expect(result).toEqual([]);
    });

    it('親子関係のあるカテゴリーを全て取得できる', async () => {
      // テストデータを挿入
      const now = new Date();
      const parentId = faker.string.alphanumeric(26);

      await db.insert(categories).values([
        {
          id: parentId,
          name: 'エレクトロニクス',
          parentId: null,
          displayOrder: 1,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: faker.string.alphanumeric(26),
          name: 'スマートフォン',
          parentId: parentId,
          displayOrder: 2,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: faker.string.alphanumeric(26),
          name: 'ノートパソコン',
          parentId: parentId,
          displayOrder: 3,
          createdAt: now,
          updatedAt: now,
        },
      ]);

      // テスト実行
      const result = await repository.findAll();

      // 検証
      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('エレクトロニクス');
      expect(result[0].parentId).toBeNull();
      expect(result[1].parentId).toBe(parentId);
      expect(result[2].parentId).toBe(parentId);
    });
  });
});
