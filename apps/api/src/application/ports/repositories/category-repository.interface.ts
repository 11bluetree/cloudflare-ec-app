import type { Category } from '../../../domain/entities/category';

/**
 * カテゴリリポジトリのインターフェース
 */
export interface ICategoryRepository {
  /**
   * 複数のカテゴリをIDで一括取得（N+1問題の解消用）
   * @param categoryIds - 取得するカテゴリIDの配列
   * @returns カテゴリIDをキーとするMap
   */
  findByIds(categoryIds: string[]): Promise<Map<string, Category>>;

  /**
   * 全カテゴリを取得
   * @returns 全カテゴリの配列（display_order順）
   */
  findAll(): Promise<Category[]>;
}
