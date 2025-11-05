import type { ICategoryRepository } from '../../ports/repositories/category-repository.interface';
import type { CategoryListResponse } from '@cloudflare-ec-app/types';
import { CategoryMapper } from '../../../infrastructure/internal/mappers/category.mapper';

/**
 * カテゴリー一覧取得ユースケース
 */
export class ListCategoriesUseCase {
  constructor(private readonly categoryRepository: ICategoryRepository) {}

  async execute(): Promise<CategoryListResponse> {
    const categories = await this.categoryRepository.findAll();

    // マッパーを使ってエンティティをDTOに変換
    // この時点でビジネス制約（3階層まで、30個まで等）が検証される
    const categoryTree = CategoryMapper.toCategoryTreeDTO(categories);

    return {
      categories: categoryTree,
    };
  }
}
