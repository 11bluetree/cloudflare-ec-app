import { z } from 'zod';

const MAX_OPTION_NAME_LENGTH = 50;
const MIN_DISPLAY_ORDER = 0;

const productOptionSchema = z.object({
  id: z.string(),
  productId: z.string(),
  optionName: z
    .string()
    .trim()
    .min(1, { message: 'オプション名は空白のみにできません' })
    .max(MAX_OPTION_NAME_LENGTH, { message: `オプション名は${MAX_OPTION_NAME_LENGTH}文字以内である必要があります` }),
  displayOrder: z.number().min(MIN_DISPLAY_ORDER, { message: `表示順序は${MIN_DISPLAY_ORDER}以上である必要があります` }),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export class ProductOption {
  private constructor(
    public readonly id: string,
    public readonly productId: string,
    public readonly optionName: string,
    public readonly displayOrder: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static create(
    id: string,
    productId: string,
    optionName: string,
    displayOrder: number,
    createdAt: Date,
    updatedAt: Date
  ): ProductOption {
    const validated = productOptionSchema.parse({
      id,
      productId,
      optionName,
      displayOrder,
      createdAt,
      updatedAt,
    });

    return new ProductOption(
      validated.id,
      validated.productId,
      validated.optionName,
      validated.displayOrder,
      validated.createdAt,
      validated.updatedAt
    );
  }
}
