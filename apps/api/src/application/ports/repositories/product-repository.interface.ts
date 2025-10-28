import type { Product, ProductVariant, ProductImage } from '@cloudflare-ec-app/library';

/**
 * 商品検索条件
 */
export interface ProductSearchCriteria {
  categoryId?: string;
  keyword?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: 'draft' | 'published' | 'archived';
  page: number;
  limit: number;
  sortBy: 'createdAt' | 'price' | 'name';
  order: 'asc' | 'desc';
}

/**
 * ページネーション結果
 */
export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * 商品詳細（バリアントと画像を含む）
 */
export interface ProductWithDetails {
  product: Product;
  variants: ProductVariant[];
  images: ProductImage[];
}

/**
 * 商品リポジトリインターフェース
 */
export interface IProductRepository {
  /**
   * 商品を検索（ページネーション付き）
   */
  search(criteria: ProductSearchCriteria): Promise<PaginatedResult<ProductWithDetails>>;

  /**
   * IDで商品を取得
   */
  findById(id: string): Promise<ProductWithDetails | null>;

  /**
   * 商品を作成
   */
  create(product: Product): Promise<Product>;

  /**
   * 商品を更新
   */
  update(product: Product): Promise<Product>;

  /**
   * 商品を削除
   */
  delete(id: string): Promise<void>;

  /**
   * バリアントを追加
   */
  addVariant(productId: string, variant: ProductVariant): Promise<ProductVariant>;

  /**
   * 画像を追加
   */
  addImage(image: ProductImage): Promise<ProductImage>;
}
