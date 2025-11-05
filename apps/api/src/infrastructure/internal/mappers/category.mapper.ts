import type { CategoryTreeNode as CategoryTreeNodeDTO } from '@cloudflare-ec-app/types';
import type { Category } from '../../../domain/entities/category';
import { CategoryTree, CategoryTreeNode } from '../../../domain/entities/category-tree';

/**
 * カテゴリードメインエンティティをレスポンスDTOにマッピングするクラス
 */
export class CategoryMapper {
  /**
   * CategoryTreeNode (Domain) → CategoryTreeNodeDTO (Response)
   * ドメインのツリーノードをDTOに変換（再帰的）
   */
  static toCategoryTreeNodeDTO(node: CategoryTreeNode): CategoryTreeNodeDTO {
    return {
      id: node.category.id,
      name: node.category.name,
      parentId: node.category.parentId,
      displayOrder: node.category.displayOrder,
      createdAt: node.category.createdAt.toISOString(),
      updatedAt: node.category.updatedAt.toISOString(),
      children: node.children.map((child) => this.toCategoryTreeNodeDTO(child)),
    };
  }

  /**
   * Category[] (Domain) → CategoryTreeNodeDTO[] (Response)
   * フラットな配列をツリー構造に変換し、ビジネス制約を検証
   */
  static toCategoryTreeDTO(categories: Category[]): CategoryTreeNodeDTO[] {
    // ドメインエンティティでツリーを構築（ビジネス制約を検証）
    const tree = CategoryTree.fromFlatArray(categories);

    // DTOに変換
    return tree.roots.map((root) => this.toCategoryTreeNodeDTO(root));
  }
}
