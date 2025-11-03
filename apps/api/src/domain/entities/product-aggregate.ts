import { Product } from './product';
import { ProductVariant } from './product-variant';
import { ProductImage } from './product-image';

/**
 * Product集約ルート全体
 *
 * Productエンティティに加え、関連するバリアントと画像を含む。
 * リポジトリ層がデータベースから取得する際に使用する型。
 */
export type ProductAggregate = Product & {
  readonly variants: ProductVariant[];
  readonly images: ProductImage[];
};
