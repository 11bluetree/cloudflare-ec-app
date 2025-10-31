import { Hono } from 'hono'
import { csrf } from 'hono/csrf'
import { renderer } from './renderer'
import productsRoute from './presentation/routes/products'

type Bindings = {
  ALLOWED_ORIGINS?: string
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

// CSRF対策（状態を変更するエンドポイントを保護）
// Auth.jsのエンドポイント(/api/auth/*)は独自のCSRF保護があるため除外
app.use('/api/cart/*', csrf())
app.use('/api/orders/*', csrf())
app.use('/api/users/*', csrf())
// 管理者用エンドポイント（POST/PUT/DELETE）
app.use('/api/products', async (c, next) => {
  if (c.req.method !== 'GET') {
    return csrf()(c, next)
  }
  await next()
})
app.use('/api/categories', async (c, next) => {
  if (c.req.method !== 'GET') {
    return csrf()(c, next)
  }
  await next()
})

app.use(renderer)

// ルート
app.route('/api/products', productsRoute)

app.get('/', (c) => {
  return c.render(<h1>Hello!</h1>)
})

// ヘルスチェックエンドポイント
app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    message: 'API is running!',
    timestamp: new Date().toISOString(),
    environment: import.meta.env.DEV ? 'development' : 'production',
  })
})

export default app
