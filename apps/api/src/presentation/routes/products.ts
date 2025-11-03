import { zValidator } from '@hono/zod-validator';
import {
  ProductListQuerySchema,
  ProductListResponseSchema,
  CreateProductRequestSchema,
  CreateProductResponseSchema,
} from '@cloudflare-ec-app/types';
import { Hono } from 'hono';
import { ListProductsUseCase } from '../../application/usecases/product/list-products.usecase';
import { CreateProductUseCase } from '../../application/usecases/product/create-product.usecase';
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
  const query = c.req.valid('query');

  const d1Database = c.env.DB;
  const db = createDbConnection(d1Database);

  const productRepository = new ProductRepository(db);
  const categoryRepository = new CategoryRepository(db);

  const listProductsUseCase = new ListProductsUseCase(productRepository, categoryRepository);

  const response = await listProductsUseCase.execute(query);

  const validatedResponse = ProductListResponseSchema.parse(response);

  return c.json(validatedResponse);
});

/**
 * POST /api/products
 * 商品を登録（管理者のみ）
 */
product.post('/', zValidator('json', CreateProductRequestSchema), async (c) => {
  const request = c.req.valid('json');

  const d1Database = c.env.DB;
  const db = createDbConnection(d1Database);

  const productRepository = new ProductRepository(db);
  const categoryRepository = new CategoryRepository(db);

  const createProductUseCase = new CreateProductUseCase(productRepository, categoryRepository);

  const response = await createProductUseCase.execute(request);

  const validatedResponse = CreateProductResponseSchema.parse(response);

  return c.json(validatedResponse, 201);
});

export default product;
