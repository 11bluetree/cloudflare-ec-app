import { z } from 'zod';

/**
 * カテゴリーツリー型定義（階層構造）
 */
export const CategoryTreeNodeSchema: z.ZodType<CategoryTreeNode> = z.lazy(() =>
  z.object({
    id: z.string(),
    name: z.string(),
    parentId: z.string().nullable(),
    displayOrder: z.number().int().min(0),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    children: z.array(CategoryTreeNodeSchema),
  }),
);
export type CategoryTreeNode = {
  id: string;
  name: string;
  parentId: string | null;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  children: CategoryTreeNode[];
};

/**
 * GET /api/categories のレスポンススキーマ（ツリー構造）
 */
export const CategoryListResponseSchema = z.object({
  categories: z.array(CategoryTreeNodeSchema),
});

export type CategoryListResponse = z.infer<typeof CategoryListResponseSchema>;
