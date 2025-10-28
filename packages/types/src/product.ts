import { z } from 'zod';

export const ProductStatusSchema = z.enum(['draft', 'published', 'archived']);
export type ProductStatus = z.infer<typeof ProductStatusSchema>;

export const ProductListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  categoryId: z.string().optional(),
  keyword: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  status: ProductStatusSchema.optional(),
  sortBy: z.enum(['createdAt', 'price', 'name']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export type ProductListQuery = z.infer<typeof ProductListQuerySchema>;
