import { z } from 'zod';
import { Category } from './category';

const MAX_DEPTH = 3;
const MAX_ROOT_CATEGORIES = 20;
const MAX_CHILDREN_PER_PARENT = 30;

/**
 * displayOrderが一意かチェックするヘルパー関数
 */
const hasUniqueDisplayOrders = <T extends { displayOrder: number }>(items: T[]): boolean => {
  const displayOrders = items.map((item) => item.displayOrder);
  return displayOrders.length === new Set(displayOrders).size;
};

/**
 * displayOrderでソートするヘルパー関数
 */
const sortByDisplayOrder = <T extends { displayOrder: number }>(items: T[]): T[] => {
  return [...items].sort((a, b) => a.displayOrder - b.displayOrder);
};

/**
 * カテゴリーツリーのノード
 * 階層構造における1つのカテゴリーとその子カテゴリーを表す
 */
export class CategoryTreeNode {
  private constructor(
    public readonly category: Category,
    public readonly children: CategoryTreeNode[],
    public readonly depth: number,
  ) {}

  static create(category: Category, children: CategoryTreeNode[], depth: number): CategoryTreeNode {
    // 深さのバリデーション
    if (depth < 1 || depth > MAX_DEPTH) {
      throw new Error(`カテゴリーの階層は${MAX_DEPTH}階層までです`);
    }

    // 子カテゴリーの数のバリデーション
    if (children.length > MAX_CHILDREN_PER_PARENT) {
      throw new Error(`1つの親カテゴリーに登録できる子カテゴリーは${MAX_CHILDREN_PER_PARENT}個までです`);
    }

    // 子カテゴリーの深さが最大深さを超えないかチェック
    for (const child of children) {
      if (child.depth !== depth + 1) {
        throw new Error('子カテゴリーの階層が不正です');
      }
    }

    // 子カテゴリーがすべて現在のカテゴリーを親として持つかチェック
    for (const child of children) {
      if (child.category.parentId !== category.id) {
        throw new Error('子カテゴリーの親IDが一致しません');
      }
    }

    // 子カテゴリーのdisplayOrderが一意かチェック
    if (!hasUniqueDisplayOrders(children.map((c) => c.category))) {
      throw new Error('同じ親を持つカテゴリー間でdisplayOrderは一意である必要があります');
    }

    return new CategoryTreeNode(category, children, depth);
  }
}

const categoryTreeSchema = z.object({
  roots: z
    .array(z.custom<CategoryTreeNode>())
    .max(MAX_ROOT_CATEGORIES, {
      message: `ルートカテゴリーは${MAX_ROOT_CATEGORIES}個までです`,
    })
    .refine((roots) => hasUniqueDisplayOrders(roots.map((r) => r.category)), {
      message: 'ルートカテゴリー間でdisplayOrderは一意である必要があります',
    }),
});

/**
 * カテゴリーツリー全体を表すエンティティ
 * 階層構造の制約を強制する
 */
export class CategoryTree {
  private constructor(public readonly roots: CategoryTreeNode[]) {}

  static create(roots: CategoryTreeNode[]): CategoryTree {
    // 全てのノードがルート（depth=1）であることを確認
    for (const root of roots) {
      if (root.depth !== 1) {
        throw new Error('ルートノードの階層は1である必要があります');
      }
      if (root.category.parentId !== null) {
        throw new Error('ルートカテゴリーはparentIdがnullである必要があります');
      }
    }

    // Zodバリデーション
    const validated = categoryTreeSchema.parse({ roots });

    return new CategoryTree(validated.roots);
  }

  /**
   * フラットなカテゴリー配列からツリー構造を構築
   */
  static fromFlatArray(categories: Category[]): CategoryTree {
    // カテゴリーをIDでマッピング
    const categoryMap = new Map<string, Category>();
    for (const category of categories) {
      categoryMap.set(category.id, category);
    }

    // 親子関係を構築
    const childrenMap = new Map<string | null, Category[]>();
    for (const category of categories) {
      const parentId = category.parentId;
      if (!childrenMap.has(parentId)) {
        childrenMap.set(parentId, []);
      }
      childrenMap.get(parentId)!.push(category);
    }

    // ツリーノードを再帰的に構築
    const buildNode = (category: Category, depth: number): CategoryTreeNode => {
      const children = childrenMap.get(category.id) || [];
      const childNodes = sortByDisplayOrder(children).map((child) => buildNode(child, depth + 1));

      return CategoryTreeNode.create(category, childNodes, depth);
    };

    // ルートカテゴリーからツリーを構築
    const rootCategories = childrenMap.get(null) || [];
    const rootNodes = sortByDisplayOrder(rootCategories).map((root) => buildNode(root, 1));

    return CategoryTree.create(rootNodes);
  }
}
