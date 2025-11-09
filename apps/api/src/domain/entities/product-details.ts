import { z } from 'zod';
import { Product } from './product';
import { ProductVariant } from './product-variant';
import { ProductImage } from './product-image';

const productDetailsSchema = z.object({
  product: z.custom<Product>(),
  variants: z.array(z.custom<ProductVariant>()),
  images: z.array(z.custom<ProductImage>()),
});

/**
 * ProductDetails - 商品全体の集約ルート
 *
 * Product、ProductVariant、ProductImageの整合性を検証し、
 * 商品全体のビジネスルールを管理する。
 */
export class ProductDetails {
  private constructor(
    public readonly product: Product,
    public readonly variants: ProductVariant[],
    public readonly images: ProductImage[],
  ) {}

  /**
   * ProductDetailsを作成
   *
   * 商品全体の整合性を検証し、ビジネスルールに違反している場合はエラーをスローする。
   */
  static create(product: Product, variants: ProductVariant[], images: ProductImage[]): ProductDetails {
    // Zodバリデーション
    productDetailsSchema.parse({ product, variants, images });

    const details = new ProductDetails(product, variants, images);

    // ビジネスルール検証
    details.validateBusinessRules();

    return details;
  }

  /**
   * 商品全体のビジネスルールを検証
   */
  private validateBusinessRules(): void {
    // オプションが定義されている場合、最低1つのバリアントが必要
    if (this.product.options.length > 0 && this.variants.length === 0) {
      throw new Error('オプションが定義されている商品には、最低1つのバリアントが必要です');
    }

    // バリアントが存在する場合、オプションも必要
    if (this.variants.length > 0 && this.product.options.length === 0) {
      throw new Error('バリアントが存在する商品には、オプション定義が必要です');
    }

    // バリアントのoptionNameは商品のオプションに存在する必要がある
    if (this.variants.length > 0) {
      const productOptionNames = new Set(this.product.options.map((opt) => opt.optionName));

      for (const variant of this.variants) {
        for (const variantOption of variant.options) {
          if (!productOptionNames.has(variantOption.optionName)) {
            throw new Error(`バリアントオプション "${variantOption.optionName}" は商品オプションに存在しません`);
          }
        }
      }
    }

    // バリアント間でSKUの重複チェック
    if (this.variants.length > 1) {
      const skuSet = new Set<string>();
      for (const variant of this.variants) {
        if (skuSet.has(variant.sku)) {
          throw new Error(`SKU "${variant.sku}" が重複しています`);
        }
        skuSet.add(variant.sku);
      }
    }

    // バリアント間でバーコードの重複チェック（nullでない場合のみ）
    if (this.variants.length > 1) {
      const barcodeSet = new Set<string>();
      for (const variant of this.variants) {
        if (variant.barcode !== null) {
          if (barcodeSet.has(variant.barcode)) {
            throw new Error(`バーコード "${variant.barcode}" が重複しています`);
          }
          barcodeSet.add(variant.barcode);
        }
      }
    }

    // 公開商品には最低1つのバリアントが必要
    if (this.product.status === 'published' && this.variants.length === 0) {
      throw new Error('公開状態の商品には、最低1つのバリアントが必要です');
    }
  }
}
