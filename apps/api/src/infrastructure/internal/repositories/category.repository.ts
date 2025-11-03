import type { ICategoryRepository } from '../../../application/ports/repositories/category-repository.interface';
import { Category } from '../../../domain/entities/category';
import { inArray } from 'drizzle-orm';
import { categories } from '../db/schema';
import type { DrizzleDB } from '../db/connection';

/**
 * カテゴリリポジトリ実装（Drizzle ORM + Cloudflare D1）
 */
export class CategoryRepository implements ICategoryRepository {
  constructor(private readonly db: DrizzleDB) {}

  async findByIds(categoryIds: string[]): Promise<Map<string, Category>> {
    if (categoryIds.length === 0) {
      return new Map();
    }

    const rows = await this.db.select().from(categories).where(inArray(categories.id, categoryIds));

    // MapオブジェクトにID → Categoryのマッピングを構築
    const categoriesMap = new Map<string, Category>();

    for (const row of rows) {
      const category = Category.create(row.id, row.name, row.parentId, row.displayOrder, row.createdAt, row.updatedAt);
      categoriesMap.set(category.id, category);
    }

    return categoriesMap;
  }
}
