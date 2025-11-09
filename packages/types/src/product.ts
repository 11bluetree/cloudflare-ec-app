import { z } from 'zod';
import { SKUSchema, OptionalBarcodeSchema } from './product-variant';

export const ProductStatusSchema = z.enum(['draft', 'published', 'archived']);
export type ProductStatus = z.infer<typeof ProductStatusSchema>;

// ============================================================================
// Product List Query Schemas
// ============================================================================

/**
 * 商品一覧のクエリパラメータ
 */
export const ProductListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
  categoryId: z.string().length(26).optional(),
  keyword: z.string().max(200).optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).max(999999).optional(),
  statuses: z.array(ProductStatusSchema).optional(),
  sortBy: z.enum(['createdAt', 'price', 'name']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export type ProductListQuery = z.infer<typeof ProductListQuerySchema>;

// ============================================================================
// Product List Response Schemas
// ============================================================================

/**
 * 商品一覧の各商品アイテム
 */
const ProductListItemSchema = z.object({
  id: z.string().length(26), // ULID
  name: z.string().max(200),
  description: z.string().max(4096),
  categoryId: z.string().length(26),
  categoryName: z.string().max(50),
  status: ProductStatusSchema,
  imageUrl: z.url().max(500).nullable(),
  minPrice: z.number().int().min(0).max(999999),
  maxPrice: z.number().int().min(0).max(999999),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ProductListItem = z.infer<typeof ProductListItemSchema>;

/**
 * ページネーション情報
 */
const PaginationSchema = z.object({
  page: z.number().int().min(1),
  perPage: z.number().int().min(1).max(100),
  total: z.number().int().min(0),
  totalPages: z.number().int().min(0),
});

export type Pagination = z.infer<typeof PaginationSchema>;

/**
 * 商品一覧APIレスポンス
 */
export const ProductListResponseSchema = z.object({
  items: z.array(ProductListItemSchema),
  pagination: PaginationSchema,
});

export type ProductListResponse = z.infer<typeof ProductListResponseSchema>;

// ============================================================================
// Product Create Request/Response Schemas
// ============================================================================

/**
 * 商品オプション定義（リクエスト用）
 */
const CreateProductOptionSchema = z.object({
  optionName: z.string().min(1).max(50).trim(),
  displayOrder: z.number().int().min(1).default(1),
});

export type CreateProductOption = z.infer<typeof CreateProductOptionSchema>;

/**
 * バリアントオプション（リクエスト用）
 */
const CreateProductVariantOptionSchema = z.object({
  optionName: z.string().min(1).max(50).trim(),
  optionValue: z.string().min(1).max(50).trim(),
  displayOrder: z.number().int().min(1).default(1),
});

export type CreateProductVariantOption = z.infer<typeof CreateProductVariantOptionSchema>;

/**
 * バリアント（リクエスト用）
 */
const CreateProductVariantSchema = z.object({
  sku: SKUSchema,
  barcode: OptionalBarcodeSchema,
  imageUrl: z.string().url().max(500).nullable().optional(),
  price: z.number().int().min(0).max(999999),
  displayOrder: z.number().int().min(1).default(1),
  options: z.array(CreateProductVariantOptionSchema).min(1),
});

export type CreateProductVariant = z.infer<typeof CreateProductVariantSchema>;

/**
 * 商品登録リクエスト
 */
export const CreateProductRequestSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  description: z.string().min(1).max(4096).trim(),
  categoryId: z.string().length(26), // ULID
  status: ProductStatusSchema.default('draft'),
  // オプション定義（省略時は空配列）
  options: z.array(CreateProductOptionSchema).min(0).max(5).optional(),
  // バリアント（省略時は空配列）
  variants: z.array(CreateProductVariantSchema).min(0).max(100).optional(),
});

export type CreateProductRequest = z.infer<typeof CreateProductRequestSchema>;

/**
 * 商品登録レスポンス
 */
export const CreateProductResponseSchema = z.object({
  id: z.string().length(26),
  name: z.string(),
  description: z.string(),
  categoryId: z.string(),
  status: ProductStatusSchema,
  options: z.array(
    z.object({
      id: z.string(),
      optionName: z.string(),
      displayOrder: z.number(),
    }),
  ),
  variants: z.array(
    z.object({
      id: z.string(),
      sku: z.string(),
      price: z.number(),
      displayOrder: z.number(),
      options: z.array(
        z.object({
          optionName: z.string(),
          optionValue: z.string(),
        }),
      ),
    }),
  ),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CreateProductResponse = z.infer<typeof CreateProductResponseSchema>;
