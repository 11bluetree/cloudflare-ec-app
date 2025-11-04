import type { ICategoryRepository } from '../../ports/repositories/category-repository.interface';
import type { CategoryListResponse, CategoryTreeNode } from '@cloudflare-ec-app/types';

/**
 * カテゴリー一覧取得ユースケース
 */
export class ListCategoriesUseCase {
  constructor(private readonly categoryRepository: ICategoryRepository) {}

  async execute(): Promise<CategoryListResponse> {
    const categories = await this.categoryRepository.findAll();

    // フラットな配列をツリー構造に変換
    const categoryMap = new Map<string, CategoryTreeNode>();
    const rootCategories: CategoryTreeNode[] = [];

    // まず全カテゴリーをMapに登録
    for (const category of categories) {
      categoryMap.set(category.id, {
        id: category.id,
        name: category.name,
        parentId: category.parentId,
        displayOrder: category.displayOrder,
        createdAt: category.createdAt.toISOString(),
        updatedAt: category.updatedAt.toISOString(),
        children: [],
      });
    }

    // 親子関係を構築
    for (const node of categoryMap.values()) {
      if (node.parentId === null) {
        // ルートカテゴリー
        rootCategories.push(node);
      } else {
        // 子カテゴリー
        const parent = categoryMap.get(node.parentId);
        if (parent) {
          parent.children.push(node);
        }
      }
    }

    // display_orderでソート（各階層ごと）
    const sortByDisplayOrder = (nodes: CategoryTreeNode[]) => {
      nodes.sort((a, b) => a.displayOrder - b.displayOrder);
      for (const node of nodes) {
        if (node.children.length > 0) {
          sortByDisplayOrder(node.children);
        }
      }
    };

    sortByDisplayOrder(rootCategories);

    return {
      categories: rootCategories,
    };
  }
}
