import type {
  Pagination,
  ProductListQuery,
  ProductListResponse,
} from '@cloudflare-ec-app/types';
import type { IProductRepository } from '../../ports/repositories/product-repository.interface';
import type { ICategoryRepository } from '../../ports/repositories/category-repository.interface';
import { ProductList, ProductListItem } from '../../../domain/entities/product-list';
import { ProductMapper } from '../../../infrastructure/internal/mappers/product.mapper';

/**
 * 商品一覧取得ユースケース
 * 
 * 商品一覧を取得し、ページネーション情報を含むレスポンスを返す。
 * ProductRepositoryとCategoryRepositoryを組み合わせてProductListエンティティを構築する。
 */
export class ListProductsUseCase {
  constructor(
    private readonly productRepository: IProductRepository,
    private readonly categoryRepository: ICategoryRepository
  ) {}

  async execute(query: ProductListQuery): Promise<ProductListResponse> {
    // 公開済み商品のみを取得（statusが指定されていない場合）
    const searchQuery: ProductListQuery = {
      ...query,
      status: query.status || 'published',
    };

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

    // 4. ProductListItemエンティティを構築
    const productListItems = products.map((product) => {
      const category = categoriesMap.get(product.categoryId);
      if (!category) {
        throw new Error(`Category not found: ${product.categoryId}`);
      }

      // Productエンティティからvarientsとimagesプロパティをanyキャストで取り出す
      // TODO: Product entityにvariantsとimagesプロパティを追加する
      const variants = (product as any).variants || [];
      const images = (product as any).images || [];

      return ProductListItem.create(product, category, images, variants);
    });

    // 5. ProductListエンティティを生成
    const productList = ProductList.create(productListItems);

    // 6. ドメインエンティティ → レスポンスDTOに変換
    const items = productList.items.map((item: ProductListItem) =>
      ProductMapper.toProductListItemDTO(item)
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
