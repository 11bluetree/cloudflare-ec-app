import { zValidator } from '@hono/zod-validator';
import { ProductListQuerySchema, ProductListResponseSchema } from '@cloudflare-ec-app/types';
import { Hono } from 'hono';
import { ListAdminProductsUseCase } from '../../application/usecases/admin/list-admin-products.usecase';
import { ProductRepository } from '../../infrastructure/internal/repositories/product.repository';
import { CategoryRepository } from '../../infrastructure/internal/repositories/category.repository';
import { createDbConnection } from '../../infrastructure/internal/db/connection';

type Bindings = {
  ALLOWED_ORIGINS?: string;
  DB: D1Database;
};

const adminProducts = new Hono<{ Bindings: Bindings }>();

adminProducts
  /**
   * GET /api/admin/products
   * 管理画面用商品一覧取得
   * - バリアントなし（下書き中）の商品も含む
   */
  .get('/', zValidator('query', ProductListQuerySchema), async (c) => {
    const query = c.req.valid('query');

    const d1Database = c.env.DB;
    const db = createDbConnection(d1Database);

    const productRepository = new ProductRepository(db);
    const categoryRepository = new CategoryRepository(db);

    const listAdminProductsUseCase = new ListAdminProductsUseCase(productRepository, categoryRepository);

    const response = await listAdminProductsUseCase.execute(query);

    const validatedResponse = ProductListResponseSchema.parse(response);

    return c.json(validatedResponse);
  });

export default adminProducts;
