import type { ProductListQuery } from '@cloudflare-ec-app/types';
import type { ProductAggregate } from '../../../domain/entities/product-aggregate';
import type { ProductDetails } from '../../../domain/entities/product-details';

/**
 * 商品リポジトリのインターフェース
 */
export interface IProductRepository {
  /**
   * 商品一覧を取得（Product集約全体）
   * @param query - 検索条件
   * @returns 商品集約一覧（options, variants, images込み）とヒット件数
   */
  findMany(query: ProductListQuery): Promise<{
    products: ProductAggregate[];
    total: number;
  }>;

  /**
   * 商品を作成
   * @param details - 商品詳細集約ルート
   */
  create(details: ProductDetails): Promise<void>;
}
