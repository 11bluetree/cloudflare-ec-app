import type { ProductListItem as ProductListItemDTO, CreateProductResponse } from '@cloudflare-ec-app/types';
import type { ProductListItem } from '../../../domain/entities/product-list';
import type { AdminProductListItem } from '../../../domain/entities/admin-product-list';
import type { ProductDetails } from '../../../domain/entities/product-details';

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

  /**
   * AdminProductListItem (Domain) → ProductListItemDTO (Response)
   * 管理画面用：バリアントなしの場合、価格は0として返す
   */
  static toAdminProductListItemDTO(item: AdminProductListItem): ProductListItemDTO {
    return {
      id: item.product.id,
      name: item.product.name,
      description: item.product.description,
      categoryId: item.category.id,
      categoryName: item.category.name,
      status: item.product.status,
      imageUrl: item.thumbnailImageUrl,
      minPrice: item.minPrice?.toNumber() ?? 0,
      maxPrice: item.maxPrice?.toNumber() ?? 0,
      createdAt: item.product.createdAt,
      updatedAt: item.product.updatedAt,
    };
  }

  /**
   * ProductDetails (Domain) → CreateProductResponse (DTO)
   */
  static toCreateProductResponseDTO(details: ProductDetails): CreateProductResponse {
    const product = details.product;

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      categoryId: product.categoryId,
      status: product.status,
      options: product.options.map((opt) => ({
        id: opt.id,
        optionName: opt.optionName,
        displayOrder: opt.displayOrder,
      })),
      variants: details.variants.map((variant) => ({
        id: variant.id,
        sku: variant.sku,
        price: variant.price.toNumber(),
        displayOrder: variant.displayOrder,
        options: variant.options.map((opt) => ({
          optionName: opt.optionName,
          optionValue: opt.optionValue,
        })),
      })),
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}
