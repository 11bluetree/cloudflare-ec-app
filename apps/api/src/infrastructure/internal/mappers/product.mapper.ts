import type { ProductListItem as ProductListItemDTO } from '@cloudflare-ec-app/types';
import type { ProductListItem } from '../../../domain/entities/product-list';

/**
 * ドメインエンティティをレスポンスDTOにマッピングするクラス
 */
export class ProductMapper {
  /**
   * ProductListItem (Domain) → ProductListItemDTO (Response)
   */
  static toProductListItemDTO(item: ProductListItem): ProductListItemDTO {
    return {
      id: item.product.id,
      name: item.product.name,
      description: item.product.description,
      categoryId: item.category.id,
      categoryName: item.category.name,
      status: item.product.status,
      imageUrl: item.thumbnailImageUrl,
      minPrice: item.minPrice.toNumber(),
      maxPrice: item.maxPrice.toNumber(),
      createdAt: item.product.createdAt,
      updatedAt: item.product.updatedAt,
    };
  }
}
