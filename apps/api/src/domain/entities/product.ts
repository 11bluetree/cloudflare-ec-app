import { z } from 'zod';
import { ProductOption } from './product-option';

export const ProductStatus = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const;

const MAX_NAME_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 4096;
const MIN_OPTIONS_PER_PRODUCT = 1;
const MAX_OPTIONS_PER_PRODUCT = 5;

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
  options: z
    .array(z.custom<ProductOption>())
    .min(MIN_OPTIONS_PER_PRODUCT, {
      message: `オプションは最低${MIN_OPTIONS_PER_PRODUCT}個必要です`,
    })
    .max(MAX_OPTIONS_PER_PRODUCT, {
      message: `オプションは${MAX_OPTIONS_PER_PRODUCT}個以内である必要があります`,
    }),
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
    public readonly options: ProductOption[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static create(
    id: string,
    name: string,
    description: string,
    categoryId: string,
    status: ProductStatus,
    options: ProductOption[],
    createdAt: Date,
    updatedAt: Date
  ): Product {
    const validated = productSchema.parse({
      id,
      name,
      description,
      categoryId,
      status,
      options,
      createdAt,
      updatedAt,
    });

    return new Product(
      validated.id,
      validated.name,
      validated.description,
      validated.categoryId,
      validated.status as ProductStatus,
      validated.options,
      validated.createdAt,
      validated.updatedAt
    );
  }
}
