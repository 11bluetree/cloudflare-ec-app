import { describe, it, expect } from 'vitest';
import { CategoryTree, CategoryTreeNode } from '../category-tree';
import { Category } from '../category';
import { faker } from '@faker-js/faker';

describe('CategoryTreeNode', () => {
  describe('create', () => {
    it('正常なノードを作成できる', () => {
      // Arrange
      const category = Category.create(
        faker.string.alphanumeric(26),
        'テストカテゴリー',
        null,
        0,
        new Date(),
        new Date(),
      );

      // Act
      const node = CategoryTreeNode.create(category, [], 1);

      // Assert
      expect(node.category).toBe(category);
      expect(node.children).toEqual([]);
      expect(node.depth).toBe(1);
    });

    it('子カテゴリーを持つノードを作成できる', () => {
      // Arrange
      const parentId = faker.string.alphanumeric(26);
      const parent = Category.create(parentId, '親', null, 0, new Date(), new Date());
      const child = Category.create(faker.string.alphanumeric(26), '子', parentId, 0, new Date(), new Date());
      const childNode = CategoryTreeNode.create(child, [], 2);

      // Act
      const parentNode = CategoryTreeNode.create(parent, [childNode], 1);

      // Assert
      expect(parentNode.children).toHaveLength(1);
      expect(parentNode.children[0]).toBe(childNode);
    });

    it('最大階層を超える場合はエラー', () => {
      // Arrange
      const category = Category.create(
        faker.string.alphanumeric(26),
        'テストカテゴリー',
        null,
        0,
        new Date(),
        new Date(),
      );

      // Act & Assert
      expect(() => CategoryTreeNode.create(category, [], 4)).toThrow('カテゴリーの階層は3階層までです');
    });

    it('階層が最小値未満の場合はエラー', () => {
      // Arrange
      const category = Category.create(
        faker.string.alphanumeric(26),
        'テストカテゴリー',
        null,
        0,
        new Date(),
        new Date(),
      );

      // Act & Assert
      expect(() => CategoryTreeNode.create(category, [], 0)).toThrow('カテゴリーの階層は3階層までです');
    });

    it('子カテゴリーの数が最大数を超える場合はエラー', () => {
      // Arrange
      const parentId = faker.string.alphanumeric(26);
      const parent = Category.create(parentId, '親', null, 0, new Date(), new Date());
      const children: CategoryTreeNode[] = [];

      // 31個の子ノードを作成
      for (let i = 0; i < 31; i++) {
        const child = Category.create(faker.string.alphanumeric(26), `子${i}`, parentId, i, new Date(), new Date());
        children.push(CategoryTreeNode.create(child, [], 2));
      }

      // Act & Assert
      expect(() => CategoryTreeNode.create(parent, children, 1)).toThrow(
        '1つの親カテゴリーに登録できる子カテゴリーは30個までです',
      );
    });

    it('子カテゴリーの階層が不正な場合はエラー', () => {
      // Arrange
      const parentId = faker.string.alphanumeric(26);
      const parent = Category.create(parentId, '親', null, 0, new Date(), new Date());
      const child = Category.create(faker.string.alphanumeric(26), '子', parentId, 0, new Date(), new Date());
      const childNode = CategoryTreeNode.create(child, [], 3); // 深さが合わない

      // Act & Assert
      expect(() => CategoryTreeNode.create(parent, [childNode], 1)).toThrow('子カテゴリーの階層が不正です');
    });

    it('子カテゴリーの親IDが一致しない場合はエラー', () => {
      // Arrange
      const parentId = faker.string.alphanumeric(26);
      const wrongParentId = faker.string.alphanumeric(26);
      const parent = Category.create(parentId, '親', null, 0, new Date(), new Date());
      const child = Category.create(faker.string.alphanumeric(26), '子', wrongParentId, 0, new Date(), new Date());
      const childNode = CategoryTreeNode.create(child, [], 2);

      // Act & Assert
      expect(() => CategoryTreeNode.create(parent, [childNode], 1)).toThrow('子カテゴリーの親IDが一致しません');
    });

    it('子カテゴリーのdisplayOrderが重複する場合はエラー', () => {
      // Arrange
      const parentId = faker.string.alphanumeric(26);
      const parent = Category.create(parentId, '親', null, 0, new Date(), new Date());
      const child1 = Category.create(faker.string.alphanumeric(26), '子1', parentId, 0, new Date(), new Date());
      const child2 = Category.create(faker.string.alphanumeric(26), '子2', parentId, 0, new Date(), new Date()); // 同じdisplayOrder
      const childNode1 = CategoryTreeNode.create(child1, [], 2);
      const childNode2 = CategoryTreeNode.create(child2, [], 2);

      // Act & Assert
      expect(() => CategoryTreeNode.create(parent, [childNode1, childNode2], 1)).toThrow(
        '同じ親を持つカテゴリー間でdisplayOrderは一意である必要があります',
      );
    });
  });
});

describe('CategoryTree', () => {
  describe('fromFlatArray', () => {
    it('空の配列から空のツリーを作成する', () => {
      // Act
      const tree = CategoryTree.fromFlatArray([]);

      // Assert
      expect(tree.roots).toHaveLength(0);
    });

    it('単一のルートカテゴリーからツリーを作成する', () => {
      // Arrange
      const root = Category.create(faker.string.alphanumeric(26), 'ルート', null, 0, new Date(), new Date());

      // Act
      const tree = CategoryTree.fromFlatArray([root]);

      // Assert
      expect(tree.roots).toHaveLength(1);
      expect(tree.roots[0].category.name).toBe('ルート');
      expect(tree.roots[0].children).toHaveLength(0);
    });

    it('親子関係を正しく構築する', () => {
      // Arrange
      const rootId = faker.string.alphanumeric(26);
      const root = Category.create(rootId, '親', null, 0, new Date(), new Date());
      const child = Category.create(faker.string.alphanumeric(26), '子', rootId, 0, new Date(), new Date());

      // Act
      const tree = CategoryTree.fromFlatArray([root, child]);

      // Assert
      expect(tree.roots).toHaveLength(1);
      expect(tree.roots[0].children).toHaveLength(1);
      expect(tree.roots[0].children[0].category.name).toBe('子');
    });

    it('3階層のツリーを正しく構築する', () => {
      // Arrange
      const rootId = faker.string.alphanumeric(26);
      const childId = faker.string.alphanumeric(26);
      const root = Category.create(rootId, 'ルート', null, 0, new Date(), new Date());
      const child = Category.create(childId, '子', rootId, 0, new Date(), new Date());
      const grandchild = Category.create(faker.string.alphanumeric(26), '孫', childId, 0, new Date(), new Date());

      // Act
      const tree = CategoryTree.fromFlatArray([root, child, grandchild]);

      // Assert
      expect(tree.roots).toHaveLength(1);
      expect(tree.roots[0].children).toHaveLength(1);
      expect(tree.roots[0].children[0].children).toHaveLength(1);
      expect(tree.roots[0].children[0].children[0].category.name).toBe('孫');
    });

    it('複数のルートと子を持つツリーを構築する', () => {
      // Arrange
      const root1Id = faker.string.alphanumeric(26);
      const root2Id = faker.string.alphanumeric(26);
      const root1 = Category.create(root1Id, 'ルート1', null, 0, new Date(), new Date());
      const root2 = Category.create(root2Id, 'ルート2', null, 1, new Date(), new Date());
      const child1 = Category.create(faker.string.alphanumeric(26), '子1', root1Id, 0, new Date(), new Date());
      const child2 = Category.create(faker.string.alphanumeric(26), '子2', root2Id, 0, new Date(), new Date());

      // Act
      const tree = CategoryTree.fromFlatArray([root1, root2, child1, child2]);

      // Assert
      expect(tree.roots).toHaveLength(2);
      expect(tree.roots[0].children).toHaveLength(1);
      expect(tree.roots[1].children).toHaveLength(1);
    });

    it('表示順序でソートされる', () => {
      // Arrange
      const root1 = Category.create(faker.string.alphanumeric(26), 'ルート1', null, 2, new Date(), new Date());
      const root2 = Category.create(faker.string.alphanumeric(26), 'ルート2', null, 0, new Date(), new Date());
      const root3 = Category.create(faker.string.alphanumeric(26), 'ルート3', null, 1, new Date(), new Date());

      // Act
      const tree = CategoryTree.fromFlatArray([root1, root2, root3]);

      // Assert
      expect(tree.roots[0].category.name).toBe('ルート2'); // displayOrder: 0
      expect(tree.roots[1].category.name).toBe('ルート3'); // displayOrder: 1
      expect(tree.roots[2].category.name).toBe('ルート1'); // displayOrder: 2
    });
  });
});
