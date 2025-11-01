/**
 * 商品画像エンティティ
 */
export class ProductImage {
  private static readonly MAX_IMAGE_URL_LENGTH = 500;
  private static readonly MIN_DISPLAY_ORDER = 1;

  constructor(
    public readonly id: string,
    public readonly productId: string,
    public readonly productVariantId: string | null,
    public readonly imageUrl: string,
    public readonly displayOrder: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {
    // product_idは必須（画像は必ず商品に属する）
    if (!productId || productId.length === 0) {
      throw new Error('product_idは必須です');
    }

    // 画像URL制約
    if (imageUrl.length === 0 || imageUrl.length > ProductImage.MAX_IMAGE_URL_LENGTH) {
      throw new Error(`画像URLは1文字以上${ProductImage.MAX_IMAGE_URL_LENGTH}文字以内である必要があります`);
    }

    // 表示順序制約（1から開始）
    if (displayOrder < ProductImage.MIN_DISPLAY_ORDER) {
      throw new Error(`表示順序は${ProductImage.MIN_DISPLAY_ORDER}以上である必要があります`);
    }
  }
}
