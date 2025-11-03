import { z } from 'zod';

export const ProductStatus = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const;

const MAX_NAME_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 4096;

export type ProductStatus = typeof ProductStatus[keyof typeof ProductStatus];

const productSchema = z.object({
  id: z.string(),
  name: z
    .string()
    .trim()
    .min(1, { message: '商品名は空白のみにできません' })
    .max(MAX_NAME_LENGTH, { message: `商品名は${MAX_NAME_LENGTH}文字以内である必要があります` }),
  description: z
    .string()
    .trim()
    .min(1, { message: '商品説明は空白のみにできません' })
    .max(MAX_DESCRIPTION_LENGTH, { message: `商品説明は${MAX_DESCRIPTION_LENGTH}文字以内である必要があります` }),
  categoryId: z.string(),
  status: z.enum(['draft', 'published', 'archived']),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type ProductParams = z.infer<typeof productSchema>;

export class Product {

  private constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string,
    public readonly categoryId: string,
    public readonly status: ProductStatus,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static create(
    id: string,
    name: string,
    description: string,
    categoryId: string,
    status: ProductStatus,
    createdAt: Date,
    updatedAt: Date
  ): Product {
    const validated = productSchema.parse({
      id,
      name,
      description,
      categoryId,
      status,
      createdAt,
      updatedAt,
    });

    return new Product(
      validated.id,
      validated.name,
      validated.description,
      validated.categoryId,
      validated.status as ProductStatus,
      validated.createdAt,
      validated.updatedAt
    );
  }
}
