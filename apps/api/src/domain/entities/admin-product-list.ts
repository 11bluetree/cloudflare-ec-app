import { z } from 'zod';
import { Product } from './product';
import { ProductVariant } from './product-variant';
import { ProductImage } from './product-image';
import { Category } from './category';
import { Money } from '../value-objects/money';

const MAX_PRODUCTS_PER_PAGE = 100;
const MAX_VARIANTS_PER_PRODUCT = 100;

// バリアントがすべて同じ商品に属するかをチェック
const allBelongToProduct = (variants: ProductVariant[], productId: string) => {
  if (variants.length === 0) return true; // バリアントなしも許可
  return variants.every((v) => v.productId === productId);
};

// 価格帯計算ロジック（バリアントがない場合はnull）
const calculatePriceRange = (variants: ProductVariant[]) => {
  if (variants.length === 0) {
    return { minPrice: null, maxPrice: null };
  }
  const prices = variants.map((v) => v.price.toNumber());
  return {
    minPrice: Money.create(Math.min(...prices)),
    maxPrice: Money.create(Math.max(...prices)),
  };
};

const adminProductListItemSchema = z
  .object({
    product: z.custom<Product>(),
    category: z.custom<Category>(),
    images: z.array(z.custom<ProductImage>()),
    variants: z
      .array(z.custom<ProductVariant>())
      .min(0) // 管理画面ではバリアント0個も許可
      .max(MAX_VARIANTS_PER_PRODUCT, {
        message: `商品には最大${MAX_VARIANTS_PER_PRODUCT}個のバリアントまで登録可能です`,
      }),
  })
  .refine((data) => allBelongToProduct(data.variants, data.product.id), {
    message: 'すべてのバリアントは同じ商品に属する必要があります',
  })
  .transform((data) => {
    const { minPrice, maxPrice } = calculatePriceRange(data.variants);
    // 表示順序で並び替えて最初の画像をサムネイルとする
    const sortedImages = [...data.images].sort((a, b) => a.displayOrder - b.displayOrder);
    const thumbnailImageUrl = sortedImages.length > 0 ? sortedImages[0].imageUrl : null;

    return {
      product: data.product,
      category: data.category,
      thumbnailImageUrl,
      minPrice,
      maxPrice,
      variantCount: data.variants.length,
    };
  });

/**
 * 管理画面用の商品一覧の各商品アイテム
 * コマース向けと異なり、バリアントなし（下書き中）の商品も表示可能
 */
export class AdminProductListItem {
  private constructor(
    public readonly product: Product,
    public readonly category: Category,
    public readonly thumbnailImageUrl: string | null,
    public readonly minPrice: Money | null,
    public readonly maxPrice: Money | null,
    public readonly variantCount: number,
  ) {}

  static create(
    product: Product,
    category: Category,
    images: ProductImage[],
    variants: ProductVariant[],
  ): AdminProductListItem {
    // Zodバリデーション（バリアント所属チェック + 価格帯計算 + サムネイル選択を含む）
    const validated = adminProductListItemSchema.parse({
      product,
      category,
      images,
      variants,
    });

    return new AdminProductListItem(
      validated.product,
      validated.category,
      validated.thumbnailImageUrl,
      validated.minPrice,
      validated.maxPrice,
      validated.variantCount,
    );
  }

  /**
   * 商品が公開可能な状態かをチェック
   * 公開状態でバリアントがない場合はfalse
   */
  isPublishable(): boolean {
    if (this.product.status === 'published' && this.variantCount === 0) {
      return false;
    }
    return true;
  }
}

const adminProductListSchema = z.object({
  items: z.array(z.custom<AdminProductListItem>()).max(MAX_PRODUCTS_PER_PAGE, {
    message: `1ページあたりの商品数は${MAX_PRODUCTS_PER_PAGE}件以下である必要があります`,
  }),
});

/**
 * 管理画面用の商品一覧エンティティ
 */
export class AdminProductList {
  private constructor(public readonly items: AdminProductListItem[]) {}

  static create(items: AdminProductListItem[]): AdminProductList {
    // Zodバリデーション
    const validated = adminProductListSchema.parse({ items });

    return new AdminProductList(validated.items);
  }

  get count(): number {
    return this.items.length;
  }

  /**
   * 下書き商品の数を取得
   */
  get draftCount(): number {
    return this.items.filter((item) => item.product.status === 'draft').length;
  }

  /**
   * 公開商品の数を取得
   */
  get publishedCount(): number {
    return this.items.filter((item) => item.product.status === 'published').length;
  }
}
