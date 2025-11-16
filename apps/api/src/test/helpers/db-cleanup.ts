import type { DrizzleDB } from '../../infrastructure/internal/db/connection';
import {
  categories,
  products,
  productVariants,
  productVariantOptions,
  productOptions,
  productImages,
} from '../../infrastructure/internal/db/schema';

/**
 * すべてのテーブルをクリーンアップする
 * 外部キー制約を考慮して、依存関係の逆順で削除する
 */
export async function cleanupAllTables(db: DrizzleDB): Promise<void> {
  // 外部キー制約を考慮した削除順序（依存される側 → 依存する側の逆順）
  // 1. 最も依存される側のテーブルから削除
  await db.delete(productVariantOptions);
  await db.delete(productOptions);
  await db.delete(productImages);
  await db.delete(productVariants);
  await db.delete(products);
  await db.delete(categories);
}
