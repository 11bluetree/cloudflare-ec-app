import { z } from 'zod';

const MAX_OPTION_NAME_LENGTH = 50;
const MAX_OPTION_VALUE_LENGTH = 50;
const MIN_DISPLAY_ORDER = 0;

const productVariantOptionSchema = z.object({
  id: z.string(),
  productVariantId: z.string(),
  optionName: z
    .string()
    .trim()
    .min(1, { message: 'オプション名は空白のみにできません' })
    .max(MAX_OPTION_NAME_LENGTH, { message: `オプション名は${MAX_OPTION_NAME_LENGTH}文字以内である必要があります` }),
  optionValue: z
    .string()
    .trim()
    .min(1, { message: 'オプション値は空白のみにできません' })
    .max(MAX_OPTION_VALUE_LENGTH, { message: `オプション値は${MAX_OPTION_VALUE_LENGTH}文字以内である必要があります` }),
  displayOrder: z
    .number()
    .min(MIN_DISPLAY_ORDER, { message: `表示順序は${MIN_DISPLAY_ORDER}以上である必要があります` }),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export class ProductVariantOption {
  private constructor(
    public readonly id: string,
    public readonly productVariantId: string,
    public readonly optionName: string,
    public readonly optionValue: string,
    public readonly displayOrder: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(
    id: string,
    productVariantId: string,
    optionName: string,
    optionValue: string,
    displayOrder: number,
    createdAt: Date,
    updatedAt: Date,
  ): ProductVariantOption {
    const validated = productVariantOptionSchema.parse({
      id,
      productVariantId,
      optionName,
      optionValue,
      displayOrder,
      createdAt,
      updatedAt,
    });

    return new ProductVariantOption(
      validated.id,
      validated.productVariantId,
      validated.optionName,
      validated.optionValue,
      validated.displayOrder,
      validated.createdAt,
      validated.updatedAt,
    );
  }
}
