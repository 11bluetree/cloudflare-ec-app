import { describe, it, expect } from 'vitest';
import { CategoryMapper } from '../category.mapper';
import { Category } from '../../../../domain/entities/category';
import { faker } from '@faker-js/faker';

describe('CategoryMapper', () => {
  describe('toCategoryTreeDTO', () => {
    it('空の配列の場合は空のツリーを返す', () => {
      // Arrange
      const categories: Category[] = [];

      // Act
      const result = CategoryMapper.toCategoryTreeDTO(categories);

      // Assert
      expect(result).toEqual([]);
    });

    it('単一のルートカテゴリーをツリーに変換する', () => {
      // Arrange
      const category = Category.create(
        faker.string.alphanumeric(26),
        'ルートカテゴリー',
        null,
        0,
        new Date('2024-01-01T00:00:00Z'),
        new Date('2024-01-02T00:00:00Z'),
      );

      // Act
      const result = CategoryMapper.toCategoryTreeDTO([category]);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(category.id);
      expect(result[0].name).toBe('ルートカテゴリー');
      expect(result[0].parentId).toBeNull();
      expect(result[0].children).toEqual([]);
    });

    it('複数のルートカテゴリーを表示順序でソートする', () => {
      // Arrange
      const category1 = Category.create(
        faker.string.alphanumeric(26),
        'カテゴリー1',
        null,
        2, // display_order: 2
        new Date('2024-01-01T00:00:00Z'),
        new Date('2024-01-02T00:00:00Z'),
      );
      const category2 = Category.create(
        faker.string.alphanumeric(26),
        'カテゴリー2',
        null,
        0, // display_order: 0
        new Date('2024-01-01T00:00:00Z'),
        new Date('2024-01-02T00:00:00Z'),
      );
      const category3 = Category.create(
        faker.string.alphanumeric(26),
        'カテゴリー3',
        null,
        1, // display_order: 1
        new Date('2024-01-01T00:00:00Z'),
        new Date('2024-01-02T00:00:00Z'),
      );

      // Act
      const result = CategoryMapper.toCategoryTreeDTO([category1, category2, category3]);

      // Assert
      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('カテゴリー2'); // display_order: 0
      expect(result[1].name).toBe('カテゴリー3'); // display_order: 1
      expect(result[2].name).toBe('カテゴリー1'); // display_order: 2
    });

    it('親子関係を正しく構築する', () => {
      // Arrange
      const parentId = faker.string.alphanumeric(26);
      const parent = Category.create(
        parentId,
        '親カテゴリー',
        null,
        0,
        new Date('2024-01-01T00:00:00Z'),
        new Date('2024-01-02T00:00:00Z'),
      );
      const child = Category.create(
        faker.string.alphanumeric(26),
        '子カテゴリー',
        parentId,
        0,
        new Date('2024-01-01T00:00:00Z'),
        new Date('2024-01-02T00:00:00Z'),
      );

      // Act
      const result = CategoryMapper.toCategoryTreeDTO([parent, child]);

      // Assert
      expect(result).toHaveLength(1); // ルートは1つ
      expect(result[0].id).toBe(parentId);
      expect(result[0].children).toHaveLength(1);
      expect(result[0].children[0].id).toBe(child.id);
      expect(result[0].children[0].name).toBe('子カテゴリー');
      expect(result[0].children[0].parentId).toBe(parentId);
    });

    it('3階層のツリー構造を正しく構築する', () => {
      // Arrange
      const rootId = faker.string.alphanumeric(26);
      const childId = faker.string.alphanumeric(26);

      const root = Category.create(
        rootId,
        'ルート',
        null,
        0,
        new Date('2024-01-01T00:00:00Z'),
        new Date('2024-01-02T00:00:00Z'),
      );
      const child = Category.create(
        childId,
        '子',
        rootId,
        0,
        new Date('2024-01-01T00:00:00Z'),
        new Date('2024-01-02T00:00:00Z'),
      );
      const grandchild = Category.create(
        faker.string.alphanumeric(26),
        '孫',
        childId,
        0,
        new Date('2024-01-01T00:00:00Z'),
        new Date('2024-01-02T00:00:00Z'),
      );

      // Act
      const result = CategoryMapper.toCategoryTreeDTO([root, child, grandchild]);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(rootId);
      expect(result[0].children).toHaveLength(1);
      expect(result[0].children[0].id).toBe(childId);
      expect(result[0].children[0].children).toHaveLength(1);
      expect(result[0].children[0].children[0].id).toBe(grandchild.id);
      expect(result[0].children[0].children[0].name).toBe('孫');
    });

    it('子カテゴリーも表示順序でソートする', () => {
      // Arrange
      const parentId = faker.string.alphanumeric(26);
      const parent = Category.create(
        parentId,
        '親',
        null,
        0,
        new Date('2024-01-01T00:00:00Z'),
        new Date('2024-01-02T00:00:00Z'),
      );
      const child1 = Category.create(
        faker.string.alphanumeric(26),
        '子1',
        parentId,
        2, // display_order: 2
        new Date('2024-01-01T00:00:00Z'),
        new Date('2024-01-02T00:00:00Z'),
      );
      const child2 = Category.create(
        faker.string.alphanumeric(26),
        '子2',
        parentId,
        0, // display_order: 0
        new Date('2024-01-01T00:00:00Z'),
        new Date('2024-01-02T00:00:00Z'),
      );
      const child3 = Category.create(
        faker.string.alphanumeric(26),
        '子3',
        parentId,
        1, // display_order: 1
        new Date('2024-01-01T00:00:00Z'),
        new Date('2024-01-02T00:00:00Z'),
      );

      // Act
      const result = CategoryMapper.toCategoryTreeDTO([parent, child1, child2, child3]);

      // Assert
      expect(result[0].children).toHaveLength(3);
      expect(result[0].children[0].name).toBe('子2'); // display_order: 0
      expect(result[0].children[1].name).toBe('子3'); // display_order: 1
      expect(result[0].children[2].name).toBe('子1'); // display_order: 2
    });

    it('複雑なツリー構造を正しく構築する', () => {
      // Arrange
      const root1Id = faker.string.alphanumeric(26);
      const root2Id = faker.string.alphanumeric(26);
      const child1Id = faker.string.alphanumeric(26);
      const child2Id = faker.string.alphanumeric(26);

      const root1 = Category.create(
        root1Id,
        'ルート1',
        null,
        0,
        new Date('2024-01-01T00:00:00Z'),
        new Date('2024-01-02T00:00:00Z'),
      );
      const root2 = Category.create(
        root2Id,
        'ルート2',
        null,
        1,
        new Date('2024-01-01T00:00:00Z'),
        new Date('2024-01-02T00:00:00Z'),
      );
      const child1 = Category.create(
        child1Id,
        '子1',
        root1Id,
        0,
        new Date('2024-01-01T00:00:00Z'),
        new Date('2024-01-02T00:00:00Z'),
      );
      const child2 = Category.create(
        child2Id,
        '子2',
        root2Id,
        0,
        new Date('2024-01-01T00:00:00Z'),
        new Date('2024-01-02T00:00:00Z'),
      );
      const grandchild1 = Category.create(
        faker.string.alphanumeric(26),
        '孫1',
        child1Id,
        0,
        new Date('2024-01-01T00:00:00Z'),
        new Date('2024-01-02T00:00:00Z'),
      );

      // Act
      const result = CategoryMapper.toCategoryTreeDTO([root1, root2, child1, child2, grandchild1]);

      // Assert
      expect(result).toHaveLength(2); // 2つのルート
      expect(result[0].id).toBe(root1Id);
      expect(result[0].children).toHaveLength(1);
      expect(result[0].children[0].id).toBe(child1Id);
      expect(result[0].children[0].children).toHaveLength(1);
      expect(result[0].children[0].children[0].name).toBe('孫1');

      expect(result[1].id).toBe(root2Id);
      expect(result[1].children).toHaveLength(1);
      expect(result[1].children[0].id).toBe(child2Id);
      expect(result[1].children[0].children).toHaveLength(0);
    });

    it('親が存在しない子カテゴリーは無視される', () => {
      // Arrange
      const nonExistentParentId = faker.string.alphanumeric(26);
      const orphan = Category.create(
        faker.string.alphanumeric(26),
        '孤立した子',
        nonExistentParentId,
        0,
        new Date('2024-01-01T00:00:00Z'),
        new Date('2024-01-02T00:00:00Z'),
      );
      const root = Category.create(
        faker.string.alphanumeric(26),
        'ルート',
        null,
        0,
        new Date('2024-01-01T00:00:00Z'),
        new Date('2024-01-02T00:00:00Z'),
      );

      // Act
      const result = CategoryMapper.toCategoryTreeDTO([orphan, root]);

      // Assert
      expect(result).toHaveLength(1); // ルートのみ
      expect(result[0].name).toBe('ルート');
      expect(result[0].children).toHaveLength(0);
    });

    it('ビジネス制約違反の場合はエラー（ルートが最大数を超える）', () => {
      // Arrange
      const categories: Category[] = [];
      for (let i = 0; i < 21; i++) {
        categories.push(
          Category.create(
            faker.string.alphanumeric(26),
            `ルート${i}`,
            null,
            i,
            new Date('2024-01-01T00:00:00Z'),
            new Date('2024-01-02T00:00:00Z'),
          ),
        );
      }

      // Act & Assert
      expect(() => CategoryMapper.toCategoryTreeDTO(categories)).toThrow('ルートカテゴリーは20個までです');
    });

    it('ビジネス制約違反の場合はエラー（子が最大数を超える）', () => {
      // Arrange
      const parentId = faker.string.alphanumeric(26);
      const parent = Category.create(
        parentId,
        '親',
        null,
        0,
        new Date('2024-01-01T00:00:00Z'),
        new Date('2024-01-02T00:00:00Z'),
      );
      const children: Category[] = [parent];
      for (let i = 0; i < 31; i++) {
        children.push(
          Category.create(
            faker.string.alphanumeric(26),
            `子${i}`,
            parentId,
            i,
            new Date('2024-01-01T00:00:00Z'),
            new Date('2024-01-02T00:00:00Z'),
          ),
        );
      }

      // Act & Assert
      expect(() => CategoryMapper.toCategoryTreeDTO(children)).toThrow(
        '1つの親カテゴリーに登録できる子カテゴリーは30個までです',
      );
    });
  });
});
