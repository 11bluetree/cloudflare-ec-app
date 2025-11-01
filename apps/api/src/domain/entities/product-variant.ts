import { Money } from '../value-objects/money';

export class ProductVariant {
  private static readonly MAX_SKU_LENGTH = 100;
  private static readonly MAX_BARCODE_LENGTH = 100;
  private static readonly MAX_IMAGE_URL_LENGTH = 500;
  private static readonly MIN_PRICE = 0;
  private static readonly MAX_PRICE = 1000000;
  private static readonly MIN_DISPLAY_ORDER = 0;
  private static readonly MAX_DISPLAY_ORDER = 500;

  constructor(
    public readonly id: string,
    public readonly productId: string,
    private _sku: string,
    public readonly barcode: string | null,
    public readonly imageUrl: string | null,
    private _price: Money,
    public readonly displayOrder: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {
    // SKUのトリミング
    _sku = _sku.trim();

    // SKU制約
    if (_sku.length === 0) {
      throw new Error('SKUは空白のみにできません');
    }
    if (_sku.length > ProductVariant.MAX_SKU_LENGTH) {
      throw new Error(`SKUは${ProductVariant.MAX_SKU_LENGTH}文字以内である必要があります`);
    }

    this._sku = _sku;

    // バーコード制約
    if (barcode !== null && barcode.length > ProductVariant.MAX_BARCODE_LENGTH) {
      throw new Error(`バーコードは${ProductVariant.MAX_BARCODE_LENGTH}文字以内である必要があります`);
    }

    // 画像URL制約
    if (imageUrl !== null && imageUrl.length > ProductVariant.MAX_IMAGE_URL_LENGTH) {
      throw new Error(`画像URLは${ProductVariant.MAX_IMAGE_URL_LENGTH}文字以内である必要があります`);
    }

    // 価格制約
    const priceValue = _price.toNumber();
    if (priceValue < ProductVariant.MIN_PRICE || priceValue >= ProductVariant.MAX_PRICE) {
      throw new Error(`価格は${ProductVariant.MIN_PRICE}以上${ProductVariant.MAX_PRICE}円未満である必要があります`);
    }

    // 表示順序制約
    if (displayOrder < ProductVariant.MIN_DISPLAY_ORDER || displayOrder > ProductVariant.MAX_DISPLAY_ORDER) {
      throw new Error(`表示順序は${ProductVariant.MIN_DISPLAY_ORDER}以上${ProductVariant.MAX_DISPLAY_ORDER}以下である必要があります`);
    }
  }

  get price(): Money {
    return this._price;
  }

  get sku(): string {
    return this._sku;
  }
}
