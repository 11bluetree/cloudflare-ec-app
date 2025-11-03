import { z } from 'zod';

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
