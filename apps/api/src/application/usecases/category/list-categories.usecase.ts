import type { ICategoryRepository } from '../../ports/repositories/category-repository.interface';
import type { CategoryListResponse } from '@cloudflare-ec-app/types';

/**
 * カテゴリー一覧取得ユースケース
 */
export class ListCategoriesUseCase {
  constructor(private readonly categoryRepository: ICategoryRepository) {}

  async execute(): Promise<CategoryListResponse> {
    const categories = await this.categoryRepository.findAll();

    return {
      categories: categories.map((category) => ({
        id: category.id,
        name: category.name,
        parentId: category.parentId,
        displayOrder: category.displayOrder,
        createdAt: category.createdAt.toISOString(),
        updatedAt: category.updatedAt.toISOString(),
      })),
    };
  }
}
