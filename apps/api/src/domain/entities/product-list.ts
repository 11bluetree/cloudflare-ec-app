import { z } from 'zod';
import { Product } from './product';
import { ProductVariant } from './product-variant';
import { ProductImage } from './product-image';
import { Category } from './category';
import { Money } from '../value-objects/money';

const MAX_PRODUCTS_PER_PAGE = 100;
const MIN_VARIANTS_PER_PRODUCT = 1;
const MAX_VARIANTS_PER_PRODUCT = 100;

// バリアントがすべて同じ商品に属するかをチェック
const allBelongToProduct = (variants: ProductVariant[], productId: string) => {
  return variants.every((v) => v.productId === productId);
};

// 価格帯計算ロジック
const calculatePriceRange = (variants: ProductVariant[]) => {
  const prices = variants.map((v) => v.price.toNumber());
  return {
    minPrice: Money.create(Math.min(...prices)),
    maxPrice: Money.create(Math.max(...prices)),
  };
};

const productListItemSchema = z
  .object({
    product: z.custom<Product>(),
    category: z.custom<Category>(),
    images: z.array(z.custom<ProductImage>()),
    variants: z
      .array(z.custom<ProductVariant>())
      .min(MIN_VARIANTS_PER_PRODUCT, {
        message: '商品には最低1つのバリアントが必要です',
      })
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
    };
  });

/**
 * 商品一覧の各商品アイテム
 */
export class ProductListItem {
  private constructor(
    public readonly product: Product,
    public readonly category: Category,
    public readonly thumbnailImageUrl: string | null,
    public readonly minPrice: Money,
    public readonly maxPrice: Money,
  ) {}

  static create(
    product: Product,
    category: Category,
    images: ProductImage[],
    variants: ProductVariant[],
  ): ProductListItem {
    // Zodバリデーション（バリアント所属チェック + 価格帯計算 + サムネイル選択を含む）
    const validated = productListItemSchema.parse({
      product,
      category,
      images,
      variants,
    });

    return new ProductListItem(
      validated.product,
      validated.category,
      validated.thumbnailImageUrl,
      validated.minPrice,
      validated.maxPrice,
    );
  }
}

const productListSchema = z.object({
  items: z.array(z.custom<ProductListItem>()).max(MAX_PRODUCTS_PER_PAGE, {
    message: `1ページあたりの商品数は${MAX_PRODUCTS_PER_PAGE}件以下である必要があります`,
  }),
});

/**
 * 商品一覧エンティティ
 */
export class ProductList {
  private constructor(public readonly items: ProductListItem[]) {}

  static create(items: ProductListItem[]): ProductList {
    // Zodバリデーション
    const validated = productListSchema.parse({ items });

    return new ProductList(validated.items);
  }

  get count(): number {
    return this.items.length;
  }
}
