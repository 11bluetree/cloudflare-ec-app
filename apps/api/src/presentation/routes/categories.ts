import { Hono } from 'hono';
import { CategoryListResponseSchema } from '@cloudflare-ec-app/types';
import { ListCategoriesUseCase } from '../../application/usecases/category/list-categories.usecase';
import { CategoryRepository } from '../../infrastructure/internal/repositories/category.repository';
import { createDbConnection } from '../../infrastructure/internal/db/connection';

type Bindings = {
  ALLOWED_ORIGINS?: string;
  DB: D1Database;
};

const category = new Hono<{ Bindings: Bindings }>()

  /**
   * GET /api/categories
   * カテゴリー一覧を取得
   */
  .get('/', async (c) => {
    const d1Database = c.env.DB;
    const db = createDbConnection(d1Database);

    const categoryRepository = new CategoryRepository(db);
    const listCategoriesUseCase = new ListCategoriesUseCase(categoryRepository);

    const response = await listCategoriesUseCase.execute();

    const validatedResponse = CategoryListResponseSchema.parse(response);

    return c.json(validatedResponse);
  });

export default category;
