import { Hono } from 'hono'

type Bindings = {
  ALLOWED_ORIGINS?: string
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

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
