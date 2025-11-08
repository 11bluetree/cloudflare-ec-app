import type { Pagination, ProductListQuery, ProductListResponse } from '@cloudflare-ec-app/types';
import type { IProductRepository } from '../../ports/repositories/product-repository.interface';
import type { ICategoryRepository } from '../../ports/repositories/category-repository.interface';
import { AdminProductList, AdminProductListItem } from '../../../domain/entities/admin-product-list';
import { ProductMapper } from '../../../infrastructure/internal/mappers/product.mapper';

/**
 * 管理画面用商品一覧取得ユースケース
 *
 * 管理画面向けの商品一覧を取得する。
 * - バリアントなし（下書き中）の商品も含む
 * - コマース向けのProductListItemと異なり、バリアント必須制約がない
 */
export class ListAdminProductsUseCase {
  constructor(
    private readonly productRepository: IProductRepository,
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  async execute(query: ProductListQuery): Promise<ProductListResponse> {
    const searchQuery: ProductListQuery = query;

    // 1. Product集約を取得（options, variants, images込み）
    const { products, total } = await this.productRepository.findMany(searchQuery);

    if (products.length === 0) {
      // 空の結果を返す
      const pagination: Pagination = {
        page: searchQuery.page,
        perPage: searchQuery.perPage,
        total: 0,
        totalPages: 0,
      };
      return { items: [], pagination };
    }

    // 2. CategoryIDを抽出（重複排除）
    const categoryIds = [...new Set(products.map((p) => p.categoryId))];

    // 3. Category集約を一括取得（N+1問題の解消）
    const categoriesMap = await this.categoryRepository.findByIds(categoryIds);

    // 4. AdminProductListItemエンティティを構築（バリアントなしも許可）
    const adminProductListItems = products.map((productAggregate) => {
      const category = categoriesMap.get(productAggregate.categoryId);
      if (!category) {
        throw new Error(`Category not found: ${productAggregate.categoryId}`);
      }

      // ProductAggregateから必要な情報を取得（型安全）
      const { variants, images, ...product } = productAggregate;

      return AdminProductListItem.create(product, category, images, variants);
    });

    // 5. AdminProductListエンティティを生成
    const adminProductList = AdminProductList.create(adminProductListItems);

    // 6. ドメインエンティティ → レスポンスDTOに変換
    const items = adminProductList.items.map((item: AdminProductListItem) =>
      ProductMapper.toAdminProductListItemDTO(item),
    );

    // 7. ページネーション情報を計算
    const pagination: Pagination = {
      page: searchQuery.page,
      perPage: searchQuery.perPage,
      total,
      totalPages: Math.ceil(total / searchQuery.perPage),
    };

    // 8. レスポンスを構築
    return {
      items,
      pagination,
    };
  }
}
