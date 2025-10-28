/**
 * カテゴリー
 */
export interface Category {
  id: string;
  name: string;
  parentId: string | null;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * カテゴリーリポジトリインターフェース
 */
export interface ICategoryRepository {
  /**
   * 全カテゴリーを取得
   */
  findAll(): Promise<Category[]>;

  /**
   * IDでカテゴリーを取得
   */
  findById(id: string): Promise<Category | null>;

  /**
   * 親カテゴリーの子カテゴリーを取得
   */
  findByParentId(parentId: string | null): Promise<Category[]>;

  /**
   * カテゴリーを作成
   */
  create(category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<Category>;
}
