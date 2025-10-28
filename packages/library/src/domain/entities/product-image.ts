/**
 * 商品画像エンティティ
 */
export class ProductImage {
  constructor(
    public readonly id: string,
    public readonly productId: string | null,
    public readonly productVariantId: string | null,
    public readonly imageUrl: string,
    public readonly displayOrder: number,
    public readonly createdAt: Date
  ) {
    if (!productId && !productVariantId) {
      throw new Error('productId または productVariantId のどちらか片方は必須です');
    }
  }

  isProductImage(): boolean {
    return this.productId !== null && this.productVariantId === null;
  }

  isVariantImage(): boolean {
    return this.productVariantId !== null;
  }
}
