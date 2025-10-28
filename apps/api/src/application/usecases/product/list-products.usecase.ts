import type { IProductRepository, ProductSearchCriteria, PaginatedResult, ProductWithDetails } from '../../ports/repositories';

/**
 * 商品一覧取得ユースケース
 */
export class ListProductsUseCase {
  constructor(private readonly productRepository: IProductRepository) {}

  async execute(criteria: ProductSearchCriteria): Promise<PaginatedResult<ProductWithDetails>> {
    // 公開済み商品のみを取得（管理者以外の場合）
    const searchCriteria: ProductSearchCriteria = {
      ...criteria,
      status: criteria.status || 'published',
    };

    return await this.productRepository.search(searchCriteria);
  }
}
