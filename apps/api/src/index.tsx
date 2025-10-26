import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { renderer } from './renderer'

const app = new Hono()

// CORS設定を追加（フロントエンドからのリクエストを許可）
app.use('/api/*', cors())

app.use(renderer)

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
