import { z } from 'zod';

/**
 * カテゴリー型定義
 */
export const CategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  parentId: z.string().nullable(),
  displayOrder: z.number().int().min(0),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type Category = z.infer<typeof CategorySchema>;

/**
 * GET /api/categories のレスポンススキーマ
 */
export const CategoryListResponseSchema = z.object({
  categories: z.array(CategorySchema),
});

export type CategoryListResponse = z.infer<typeof CategoryListResponseSchema>;
