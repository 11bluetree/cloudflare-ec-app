import { Product, ProductVariant, ProductImage, ProductStatus, Money } from '@cloudflare-ec-app/library';
import type { 
  categoriesTable, 
  productsTable, 
  productVariantsTable, 
  productImagesTable 
} from '../db/schema';

/**
 * DBスキーマからドメインエンティティへのマッパー
 */

// カテゴリー型
export type CategoryRow = typeof categoriesTable.$inferSelect;

// 商品行の型
export type ProductRow = typeof productsTable.$inferSelect;
export type ProductVariantRow = typeof productVariantsTable.$inferSelect;
export type ProductImageRow = typeof productImagesTable.$inferSelect;

/**
 * ProductRowをProductエンティティに変換
 */
export function toProductEntity(row: ProductRow): Product {
  return new Product(
    row.id,
    row.name,
    row.description,
    row.categoryId,
    row.status as ProductStatus,
    new Date(row.createdAt),
    new Date(row.updatedAt)
  );
}

/**
 * ProductVariantRowをProductVariantエンティティに変換
 */
export function toProductVariantEntity(row: ProductVariantRow): ProductVariant {
  return new ProductVariant(
    row.id,
    row.productId,
    row.sku,
    Money.create(row.price),
    row.stockQuantity,
    row.size,
    row.color,
    row.displayOrder,
    new Date(row.createdAt),
    new Date(row.updatedAt)
  );
}

/**
 * ProductImageRowをProductImageエンティティに変換
 */
export function toProductImageEntity(row: ProductImageRow): ProductImage {
  return new ProductImage(
    row.id,
    row.productId,
    row.productVariantId,
    row.imageUrl,
    row.displayOrder,
    new Date(row.createdAt)
  );
}
