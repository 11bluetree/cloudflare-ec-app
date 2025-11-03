import type { ProductListQuery } from '@cloudflare-ec-app/types';
import type { Product } from '../../../domain/entities/product';

/**
 * 商品リポジトリのインターフェース
 */
export interface IProductRepository {
  /**
   * 商品一覧を取得（Product集約のみ）
   * @param query - 検索条件
   * @returns 商品一覧（options, variants, images込み）とヒット件数
   */
  findMany(query: ProductListQuery): Promise<{
    products: Product[];
    total: number;
  }>;
}