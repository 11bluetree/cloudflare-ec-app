import type { DbInstance } from '../db';
import type { ICategoryRepository, Category } from '../../../application/ports/repositories';
import { categoriesTable } from '../db/schema';
import { eq, isNull } from 'drizzle-orm';
import { ulid } from 'ulid';

export class CategoryRepository implements ICategoryRepository {
  constructor(private readonly db: DbInstance) {}

  async findAll(): Promise<Category[]> {
    const rows = await this.db.select().from(categoriesTable);
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      parentId: row.parentId,
      displayOrder: row.displayOrder,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    }));
  }

  async findById(id: string): Promise<Category | null> {
    const [row] = await this.db
      .select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, id))
      .limit(1);

    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      parentId: row.parentId,
      displayOrder: row.displayOrder,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }

  async findByParentId(parentId: string | null): Promise<Category[]> {
    const rows = await this.db
      .select()
      .from(categoriesTable)
      .where(parentId === null ? isNull(categoriesTable.parentId) : eq(categoriesTable.parentId, parentId));

    return rows.map(row => ({
      id: row.id,
      name: row.name,
      parentId: row.parentId,
      displayOrder: row.displayOrder,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    }));
  }

  async create(category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<Category> {
    const now = new Date();
    const id = ulid();

    await this.db.insert(categoriesTable).values({
      id,
      name: category.name,
      parentId: category.parentId,
      displayOrder: category.displayOrder,
      createdAt: now,
      updatedAt: now,
    });

    return {
      id,
      name: category.name,
      parentId: category.parentId,
      displayOrder: category.displayOrder,
      createdAt: now,
      updatedAt: now,
    };
  }
}
