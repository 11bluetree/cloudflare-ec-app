import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { ProductListQuerySchema } from '@cloudflare-ec-app/types';
import { ListProductsUseCase } from '../../application/usecases/product/list-products.usecase';
import { ProductRepository } from '../../infrastructure/internal/repositories/product.repository';
import { createDb } from '../../infrastructure/internal/db/index';
import type { ProductWithDetails } from '../../application/ports/repositories/index';

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

/**
 * GET /products
 * 商品一覧取得
 */
app.get('/', zValidator('query', ProductListQuerySchema), async (c) => {
  const query = c.req.valid('query');
  
  // DB接続とリポジトリの初期化
  const db = createDb(c.env.DB);
  const productRepository = new ProductRepository(db);
  
  // ユースケース実行
  const useCase = new ListProductsUseCase(productRepository);
  const result = await useCase.execute({
    ...query,
    page: query.page,
    limit: query.limit,
    sortBy: query.sortBy,
    order: query.order,
  });

  // レスポンス整形
  return c.json({
    products: result.items.map((item: ProductWithDetails) => ({
      id: item.product.id,
      name: item.product.name,
      description: item.product.description,
      categoryId: item.product.categoryId,
      status: item.product.status,
      minPrice: item.product.getMinPrice(),
      maxPrice: item.product.getMaxPrice(),
      thumbnail: item.product.getThumbnailImage()?.imageUrl || null,
      inStock: item.product.isInStock(),
      createdAt: item.product.createdAt.toISOString(),
      updatedAt: item.product.updatedAt.toISOString(),
    })),
    pagination: result.pagination,
  });
});

export default app;
