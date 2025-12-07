import { Hono } from 'hono';
import product from './presentation/routes/products';
import category from './presentation/routes/categories';
import adminProducts from './presentation/routes/admin-products';

type Bindings = {
  ALLOWED_ORIGINS?: string;
  DB: D1Database;
  PRODUCT_IMAGES: R2Bucket;
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

/** 管理画面用商品ルート */
app.route('/api/admin/products', adminProducts);

/** カテゴリールート */
app.route('/api/categories', category);

/**
 * 画像配信エンドポイント（開発環境専用）
 * R2バケットから画像を取得して返す
 */
if (import.meta.env.DEV) {
  app.get('/images/*', async (c) => {
    const path = c.req.path.replace('/images/', '');
    const object = await c.env.PRODUCT_IMAGES.get(path);

    if (!object) {
      return c.notFound();
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('cache-control', 'public, max-age=31536000, immutable');

    return c.body(object.body, 200, Object.fromEntries(headers));
  });
}

export default app;
