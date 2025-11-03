import { z } from 'zod';

const MAX_IMAGE_URL_LENGTH = 500;
const MIN_DISPLAY_ORDER = 1;

const productImageSchema = z.object({
  id: z.string(),
  productId: z.string().min(1, { message: 'product_idは必須です' }),
  productVariantId: z.string().nullable(),
  imageUrl: z
    .string()
    .min(1, { message: `画像URLは1文字以上${MAX_IMAGE_URL_LENGTH}文字以内である必要があります` })
    .max(MAX_IMAGE_URL_LENGTH, { message: `画像URLは1文字以上${MAX_IMAGE_URL_LENGTH}文字以内である必要があります` }),
  displayOrder: z
    .number()
    .min(MIN_DISPLAY_ORDER, { message: `表示順序は${MIN_DISPLAY_ORDER}以上である必要があります` }),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * 商品画像エンティティ
 */
export class ProductImage {
  private constructor(
    public readonly id: string,
    public readonly productId: string,
    public readonly productVariantId: string | null,
    public readonly imageUrl: string,
    public readonly displayOrder: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(
    id: string,
    productId: string,
    productVariantId: string | null,
    imageUrl: string,
    displayOrder: number,
    createdAt: Date,
    updatedAt: Date,
  ): ProductImage {
    const validated = productImageSchema.parse({
      id,
      productId,
      productVariantId,
      imageUrl,
      displayOrder,
      createdAt,
      updatedAt,
    });

    return new ProductImage(
      validated.id,
      validated.productId,
      validated.productVariantId,
      validated.imageUrl,
      validated.displayOrder,
      validated.createdAt,
      validated.updatedAt,
    );
  }
}
