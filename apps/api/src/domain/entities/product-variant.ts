import { z } from 'zod';
import { Money } from '../value-objects/money';

const MAX_SKU_LENGTH = 100;
const MAX_BARCODE_LENGTH = 100;
const MAX_IMAGE_URL_LENGTH = 500;
const MIN_PRICE = 0;
const MAX_PRICE = 1000000;
const MIN_DISPLAY_ORDER = 0;
const MAX_DISPLAY_ORDER = 500;

const productVariantSchema = z.object({
  id: z.string(),
  productId: z.string(),
  sku: z
    .string()
    .trim()
    .min(1, { message: 'SKUは空白のみにできません' })
    .max(MAX_SKU_LENGTH, { message: `SKUは${MAX_SKU_LENGTH}文字以内である必要があります` }),
  barcode: z
    .string()
    .max(MAX_BARCODE_LENGTH, { message: `バーコードは${MAX_BARCODE_LENGTH}文字以内である必要があります` })
    .nullable(),
  imageUrl: z
    .string()
    .max(MAX_IMAGE_URL_LENGTH, { message: `画像URLは${MAX_IMAGE_URL_LENGTH}文字以内である必要があります` })
    .nullable(),
  price: z.custom<Money>(
    (val) => val instanceof Money && val.toNumber() >= MIN_PRICE && val.toNumber() < MAX_PRICE,
    {
      message: `価格は${MIN_PRICE}以上${MAX_PRICE}円未満である必要があります`,
    }
  ),
  displayOrder: z
    .number()
    .min(MIN_DISPLAY_ORDER, { message: `表示順序は${MIN_DISPLAY_ORDER}以上${MAX_DISPLAY_ORDER}以下である必要があります` })
    .max(MAX_DISPLAY_ORDER, { message: `表示順序は${MIN_DISPLAY_ORDER}以上${MAX_DISPLAY_ORDER}以下である必要があります` }),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export class ProductVariant {

  private constructor(
    public readonly id: string,
    public readonly productId: string,
    public readonly sku: string,
    public readonly barcode: string | null,
    public readonly imageUrl: string | null,
    public readonly price: Money,
    public readonly displayOrder: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static create(
    id: string,
    productId: string,
    sku: string,
    barcode: string | null,
    imageUrl: string | null,
    price: Money,
    displayOrder: number,
    createdAt: Date,
    updatedAt: Date
  ): ProductVariant {
    const validated = productVariantSchema.parse({
      id,
      productId,
      sku,
      barcode,
      imageUrl,
      price,
      displayOrder,
      createdAt,
      updatedAt,
    });

    return new ProductVariant(
      validated.id,
      validated.productId,
      validated.sku,
      validated.barcode,
      validated.imageUrl,
      validated.price,
      validated.displayOrder,
      validated.createdAt,
      validated.updatedAt
    );
  }
}
