import { zValidator } from '@hono/zod-validator';
import { ProductListQuerySchema, ProductListResponseSchema } from '@cloudflare-ec-app/types';
import { Hono } from 'hono';
import { ListProductsUseCase } from '../../application/usecases/product/list-products.usecase';
import { ProductRepository } from '../../infrastructure/internal/repositories/product.repository';
import { CategoryRepository } from '../../infrastructure/internal/repositories/category.repository';
import { createDbConnection } from '../../infrastructure/internal/db/connection';

type Bindings = {
  ALLOWED_ORIGINS?: string;
  DB: D1Database;
  R2_PUBLIC_URL: string;
};

const product = new Hono<{ Bindings: Bindings }>()

  /**
   * GET /api/products
   * 商品一覧を取得（コマース向け・公開商品のみ）
   */
  .get('/', zValidator('query', ProductListQuerySchema), async (c) => {
    const query = c.req.valid('query');

    const d1Database = c.env.DB;
    const db = createDbConnection(d1Database);

    const productRepository = new ProductRepository(db, c.env.R2_PUBLIC_URL);
    const categoryRepository = new CategoryRepository(db);

    const listProductsUseCase = new ListProductsUseCase(productRepository, categoryRepository);

    const response = await listProductsUseCase.execute(query);

    const validatedResponse = ProductListResponseSchema.parse(response);

    return c.json(validatedResponse);
  });

export default product;
