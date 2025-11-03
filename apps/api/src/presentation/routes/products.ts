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
};

const product = new Hono<{ Bindings: Bindings }>();

/**
 * GET /api/products
 * 商品一覧を取得
 */
product.get('/', zValidator('query', ProductListQuerySchema), async (c) => {
  // バリデーション済みのクエリパラメータを取得
  const query = c.req.valid('query');

  // Drizzle ORMコネクションを作成
  const d1Database = c.env.DB;
  const db = createDbConnection(d1Database);

  // リポジトリのインスタンスを作成（DI）
  const productRepository = new ProductRepository(db);
  const categoryRepository = new CategoryRepository(db);

  // ユースケースのインスタンスを作成（両方のリポジトリを注入）
  const listProductsUseCase = new ListProductsUseCase(productRepository, categoryRepository);

  // ユースケースを実行
  const response = await listProductsUseCase.execute(query);

  // レスポンスをバリデーション（型安全性の保証）
  const validatedResponse = ProductListResponseSchema.parse(response);

  // レスポンスを返す
  return c.json(validatedResponse);
});

export default product;
