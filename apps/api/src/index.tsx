import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { renderer } from './renderer'

type Bindings = {
  ALLOWED_ORIGINS?: string
}

const app = new Hono<{ Bindings: Bindings }>()

// CORS設定（フロントエンドからのリクエストを許可）
app.use(
  '/api/*',
  cors({
    origin: (origin, c) => {
      // 開発環境ではlocalhostを許可
      if (import.meta.env.DEV) {
        return origin
      }
      // 環境変数から許可するオリジンを取得
      // wrangler.jsonc の vars または Cloudflare Dashboard で設定
      const allowedOriginsStr = c.env.ALLOWED_ORIGINS || 'https://cloudflare-ec-app.pages.dev'
      const allowedOrigins = allowedOriginsStr.split(',').map((o: string) => o.trim())
      
      return allowedOrigins.includes(origin) ? origin : allowedOrigins[0]
    },
    credentials: true, // Cookieを使用する場合は必須
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Length', 'X-Request-Id'],
    maxAge: 600, // プリフライトリクエストのキャッシュ時間（秒）
  })
)

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
