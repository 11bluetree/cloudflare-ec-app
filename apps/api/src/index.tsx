import { Hono } from 'hono';
import product from './presentation/routes/products';
import category from './presentation/routes/categories';

type Bindings = {
  ALLOWED_ORIGINS?: string;
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

/**
 * ヘルスチェックエンドポイント
 */
app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    message: 'API is running!',
    timestamp: new Date().toISOString(),
    environment: import.meta.env.DEV ? 'development' : 'production',
  });
});

/** 商品ルート */
app.route('/api/products', product);

/** カテゴリールート */
app.route('/api/categories', category);

export default app;
