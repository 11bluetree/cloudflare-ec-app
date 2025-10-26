# アーキテクチャガイド

## 概要

このプロジェクトは**ドメイン駆動設計（DDD）の学習を目的**とした、レイヤードアーキテクチャを採用しています。Cloudflare Workers上で動作するECプラットフォームとして、クリーンな関心の分離を重視した設計となっています。

## アーキテクチャ原則

### 1. レイヤーの分離

各レイヤーは明確な責務を持ち、依存関係は単一方向（外側から内側へ）に保たれます。

```sh
┌─────────────────────────────────────────┐
│     Presentation Layer (外側)          │  ← HTTPリクエスト/レスポンス
│     - Routes                            │
│     - Middleware                        │
│     - Validators                        │
└─────────────────────────────────────────┘
              ↓ 依存
┌─────────────────────────────────────────┐
│     Application Layer (中間)           │  ← ユースケース・ビジネスロジック
│     - UseCases                          │
│     - Ports (Interfaces)                │
└─────────────────────────────────────────┘
              ↓ 依存
┌─────────────────────────────────────────┐
│     Domain Layer (最内部)               │  ← ビジネスルール・エンティティ
│     packages/library                    │
│     - Entities                          │
│     - Value Objects                     │
│     - Domain Services                   │
└─────────────────────────────────────────┘
              ↑ 実装
┌─────────────────────────────────────────┐
│     Infrastructure Layer (外側)         │  ← 技術的詳細
│     - Repositories (D1, R2)             │
│     - External Services (Stripe等)      │
└─────────────────────────────────────────┘
```

### 2. 依存性逆転の原則（DIP）

Application Layer はインターフェース（Ports）を定義し、Infrastructure Layer がそれを実装します。これにより、ビジネスロジックが技術的詳細に依存しない設計を実現します。

## ディレクトリ構造

### apps/api/src/

```sh
apps/api/src/
├── application/                    # Application Layer
│   ├── usecases/                  # ユースケース（アプリケーションロジック）
│   │   ├── product/
│   │   │   ├── list-products.usecase.ts
│   │   │   ├── get-product-detail.usecase.ts
│   │   │   ├── search-products.usecase.ts
│   │   │   └── create-product.usecase.ts
│   │   ├── cart/
│   │   │   ├── add-to-cart.usecase.ts
│   │   │   ├── update-cart-item.usecase.ts
│   │   │   └── get-cart.usecase.ts
│   │   ├── order/
│   │   │   ├── create-order.usecase.ts
│   │   │   ├── process-payment.usecase.ts
│   │   │   └── get-order-history.usecase.ts
│   │   └── user/
│   │       ├── update-profile.usecase.ts
│   │       └── get-profile.usecase.ts
│   │
│   └── ports/                     # インターフェース定義（依存性逆転）
│       ├── repositories/          # リポジトリインターフェース
│       │   ├── product.repository.interface.ts
│       │   ├── cart.repository.interface.ts
│       │   ├── order.repository.interface.ts
│       │   └── user.repository.interface.ts
│       └── services/              # 外部サービスインターフェース
│           ├── payment.service.interface.ts
│           ├── storage.service.interface.ts
│           └── email.service.interface.ts
│
├── presentation/                   # Presentation Layer
│   ├── routes/                    # Honoルート定義
│   │   ├── product.ts             # 商品関連エンドポイント
│   │   ├── cart.ts                # カート関連エンドポイント
│   │   ├── order.ts               # 注文関連エンドポイント
│   │   └── user.ts                # ユーザー関連エンドポイント
│   │
│   ├── middleware/                # ミドルウェア
│   │   ├── auth.middleware.ts     # 認証チェック
│   │   ├── role.middleware.ts     # 権限チェック（customer/admin）
│   │   └── error.middleware.ts    # エラーハンドリング
│   │
│   └── validators/                # バリデーション（Zod）
│       ├── product.validator.ts
│       ├── cart.validator.ts
│       └── order.validator.ts
│
├── infrastructure/                 # Infrastructure Layer
│   ├── internal/                  # 自社管理インフラ
│   │   ├── db/                    # D1データベース
│   │   │   ├── client.ts          # Drizzle接続設定
│   │   │   └── schema.ts          # テーブル定義
│   │   │
│   │   ├── repositories/          # リポジトリ実装（Portsを実装）
│   │   │   ├── d1-product.repository.ts
│   │   │   ├── d1-cart.repository.ts
│   │   │   ├── d1-order.repository.ts
│   │   │   └── d1-user.repository.ts
│   │   │
│   │   └── storage/               # R2ストレージ
│   │       ├── r2-client.ts
│   │       └── r2-image.storage.ts
│   │
│   └── external/                  # 外部サービス
│       ├── payment/
│       │   └── stripe-payment.service.ts
│       ├── auth/
│       │   └── authjs.adapter.ts
│       └── email/
│           └── resend-email.service.ts
│
└── index.tsx                       # エントリーポイント
```

### packages/library/

共有ドメインロジックは `packages/library` に配置されます：

```sh
packages/library/
├── domain/
│   ├── product/
│   │   ├── entities/
│   │   │   ├── product.entity.ts
│   │   │   └── product-image.entity.ts
│   │   ├── value-objects/
│   │   │   ├── price.vo.ts
│   │   │   └── product-id.vo.ts
│   │   └── services/
│   │       └── product-inventory.service.ts
│   │
│   ├── cart/
│   │   ├── entities/
│   │   │   ├── cart.entity.ts
│   │   │   └── cart-line-item.entity.ts
│   │   └── value-objects/
│   │
│   ├── order/
│   │   ├── entities/
│   │   │   ├── order.entity.ts
│   │   │   └── order-line-item.entity.ts
│   │   ├── value-objects/
│   │   │   └── shipping-address.vo.ts
│   │   └── services/
│   │       └── order-calculation.service.ts
│   │
│   └── user/
│       ├── entities/
│       │   └── user.entity.ts
│       └── value-objects/
│           └── email.vo.ts
│
└── shared/
    ├── types/
    └── errors/
        ├── domain-error.ts
        └── validation-error.ts
```

## レイヤー詳細

### 1. Presentation Layer（プレゼンテーション層）

**責務**: HTTPリクエスト/レスポンスの処理、入力バリデーション、認証・認可

**特徴**:

- **Honoのベストプラクティスに従う**: ハンドラーを変数化せず、`app.get()` などで直接定義
- ビジネスロジックは含まない（薄いラッパー）
- ユースケースへの橋渡し役

**例**: `presentation/routes/product.ts`

```typescript
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { createProductSchema } from '../validators/product.validator'
import { GetProductDetailUseCase } from '@/application/usecases/product/get-product-detail.usecase'

const product = new Hono()

// ✅ ハンドラーを直接定義（変数化しない）
product.get('/:id', async (c) => {
  const id = c.req.param('id')
  
  // ユースケースに委譲
  const usecase = new GetProductDetailUseCase(/* dependencies */)
  const result = await usecase.execute(id)
  
  return c.json(result)
})

product.post('/', zValidator('json', createProductSchema), async (c) => {
  const data = c.req.valid('json')
  // ...
})

export default product
```

### 2. Application Layer（アプリケーション層）

**責務**: ユースケースの実装、トランザクション管理、オーケストレーション

**特徴**:

- ビジネスプロセスを表現（例: 注文作成フロー）
- ドメインロジックの調整役
- インターフェース（Ports）を通じてインフラ層にアクセス

**例**: `application/usecases/order/create-order.usecase.ts`

```typescript
export class CreateOrderUseCase {
  constructor(
    private orderRepository: IOrderRepository,
    private cartRepository: ICartRepository,
    private paymentService: IPaymentService
  ) {}
  
  async execute(userId: string, shippingAddress: ShippingAddress): Promise<Order> {
    // 1. カート取得
    const cart = await this.cartRepository.findByUserId(userId)
    if (cart.isEmpty()) {
      throw new Error('Cart is empty')
    }
    
    // 2. 注文作成（ドメインロジック）
    const order = Order.create({
      userId,
      items: cart.items,
      shippingAddress,
    })
    
    // 3. 決済処理
    await this.paymentService.charge(order.totalAmount)
    
    // 4. 注文保存
    await this.orderRepository.save(order)
    
    // 5. カートクリア
    await this.cartRepository.clear(userId)
    
    return order
  }
}
```

**Ports（インターフェース）**:

```typescript
// application/ports/repositories/order.repository.interface.ts
export interface IOrderRepository {
  findById(id: string): Promise<Order | null>
  findByUserId(userId: string): Promise<Order[]>
  save(order: Order): Promise<Order>
}
```

### 3. Domain Layer（ドメイン層）

**責務**: ビジネスルール、エンティティ、値オブジェクト

**特徴**:

- フレームワーク非依存（純粋なTypeScript）
- ビジネスロジックの中心
- `packages/library` に配置（フロントエンドとも共有可能）

**例**: `packages/library/domain/order/entities/order.entity.ts`

```typescript
export class Order {
  private constructor(
    public readonly id: OrderId,
    public readonly userId: UserId,
    public readonly items: OrderLineItem[],
    public readonly shippingAddress: ShippingAddress,
    public status: OrderStatus
  ) {}
  
  static create(params: CreateOrderParams): Order {
    // ビジネスルール: 最低注文金額チェック
    const totalAmount = this.calculateTotal(params.items)
    if (totalAmount < 1000) {
      throw new DomainError('最低注文金額は1000円です')
    }
    
    return new Order(
      OrderId.generate(),
      params.userId,
      params.items,
      params.shippingAddress,
      OrderStatus.Pending
    )
  }
  
  // ビジネスロジック
  calculateTotal(): number {
    return this.items.reduce((sum, item) => sum + item.subtotal(), 0)
  }
  
  ship(): void {
    if (this.status !== OrderStatus.Processing) {
      throw new DomainError('処理中の注文のみ出荷可能です')
    }
    this.status = OrderStatus.Shipped
  }
}
```

### 4. Infrastructure Layer（インフラストラクチャ層）

**責務**: 技術的詳細の実装、外部システムとの連携

#### Internal（自社管理インフラ）

**D1データベース**:

- Drizzle ORMを使用
- プリペアドステートメントで安全なクエリ実行

**R2ストレージ**:

- 商品画像の保存・取得

**リポジトリ実装**:

```typescript
// infrastructure/internal/repositories/d1-order.repository.ts
export class D1OrderRepository implements IOrderRepository {
  constructor(private db: DrizzleD1Database) {}
  
  async findById(id: string): Promise<Order | null> {
    const result = await this.db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, id))
      .limit(1)
    
    if (!result[0]) return null
    
    // DBレコードからドメインエンティティへ変換
    return this.toDomain(result[0])
  }
  
  async save(order: Order): Promise<Order> {
    // ドメインエンティティからDBレコードへ変換
    const record = this.toRecord(order)
    await this.db.insert(ordersTable).values(record)
    return order
  }
  
  private toDomain(record: OrderRecord): Order {
    // マッピングロジック
  }
  
  private toRecord(order: Order): OrderRecord {
    // マッピングロジック
  }
}
```

#### External（外部サービス）

**Stripe決済**:

```typescript
// infrastructure/external/payment/stripe-payment.service.ts
export class StripePaymentService implements IPaymentService {
  async charge(amount: number): Promise<PaymentResult> {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'jpy',
    })
    return { success: true, transactionId: paymentIntent.id }
  }
}
```

## データフロー

### リクエストからレスポンスまで

```sh
1. HTTPリクエスト
   ↓
2. Presentation Layer (routes/)
   - バリデーション（validators/）
   - 認証・認可（middleware/）
   ↓
3. Application Layer (usecases/)
   - ユースケース実行
   - ドメインロジック呼び出し
   ↓
4. Domain Layer (packages/library)
   - ビジネスルール適用
   - エンティティ操作
   ↓
5. Infrastructure Layer (repositories/)
   - データベースアクセス
   - 外部サービス連携
   ↓
6. レスポンス生成
   ↓
7. HTTPレスポンス
```

### 具体例: 商品詳細取得

```typescript
// 1. エントリーポイント
// index.tsx
app.route('/api/products', productRoutes)

// 2. ルート定義
// presentation/routes/product.ts
product.get('/:id', async (c) => {
  const id = c.req.param('id')
  const usecase = new GetProductDetailUseCase(productRepository)
  const result = await usecase.execute(id)
  return c.json(result)
})

// 3. ユースケース
// application/usecases/product/get-product-detail.usecase.ts
export class GetProductDetailUseCase {
  async execute(id: string): Promise<ProductDetailDto> {
    const product = await this.productRepository.findById(id)
    if (!product) throw new NotFoundError()
    return this.toDto(product)
  }
}

// 4. リポジトリ
// infrastructure/internal/repositories/d1-product.repository.ts
export class D1ProductRepository {
  async findById(id: string): Promise<Product | null> {
    const record = await this.db.select().from(productsTable)...
    return this.toDomain(record)
  }
}

// 5. ドメインエンティティ
// packages/library/domain/product/entities/product.entity.ts
export class Product {
  isInStock(): boolean {
    return this.stock > 0
  }
}
```

## 依存性注入（DI）

現時点では手動でDIを行いますが、将来的にはDIコンテナの導入も検討します。

```typescript
// index.tsx
import { createDb } from './infrastructure/internal/db/client'
import { D1ProductRepository } from './infrastructure/internal/repositories/d1-product.repository'
import { GetProductDetailUseCase } from './application/usecases/product/get-product-detail.usecase'

const app = new Hono<{ Bindings: Bindings }>()

app.get('/api/products/:id', async (c) => {
  // DIコンテナ的な役割
  const db = createDb(c.env.DB)
  const productRepository = new D1ProductRepository(db)
  const usecase = new GetProductDetailUseCase(productRepository)
  
  const id = c.req.param('id')
  const result = await usecase.execute(id)
  return c.json(result)
})
```

## テスト戦略

### 1. ドメイン層

- 純粋な単体テスト（高速）
- モックなしでテスト可能

### 2. アプリケーション層

- リポジトリをモック化
- ユースケースのロジックをテスト

### 3. インフラ層

- D1 テスト環境を使用した統合テスト

### 4. プレゼンテーション層

- Honoのテストヘルパーを使用
- エンドツーエンドテスト

## ベストプラクティス

### 1. Honoのベストプラクティスに従う

✅ **DO**: ハンドラーを直接定義

```typescript
product.get('/:id', async (c) => { /* ... */ })
```

❌ **DON'T**: ハンドラーを変数化

```typescript
const getProduct = async (c: Context) => { /* ... */ }
product.get('/:id', getProduct)  // 型推論が弱くなる
```

### 2. 依存関係の方向を守る

```sh
Presentation → Application → Domain
                    ↑
            Infrastructure (実装)
```

### 3. ビジネスロジックはドメイン層に配置

❌ **DON'T**: ユースケースやリポジトリにビジネスロジック

```typescript
// 悪い例
async createOrder(data) {
  const total = data.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  // ...
}
```

✅ **DO**: エンティティにビジネスロジック

```typescript
// 良い例
class Order {
  calculateTotal(): number {
    return this.items.reduce((sum, item) => sum + item.subtotal(), 0)
  }
}
```

### 4. プリペアドステートメントを必ず使用

```typescript
// ✅ Good
await db.select().from(products).where(eq(products.id, id))

// ❌ Bad (SQLインジェクションのリスク)
await db.execute(`SELECT * FROM products WHERE id = '${id}'`)
```

## 参考資料

- [PRD (Product Requirements Document)](./prd.md)
- [データモデル](./data-model.md)
- [データベースガイド](./database-guide.md)
- [ADR (Architecture Decision Records)](./adr/)
- [Hono Best Practices](https://hono.dev/docs/guides/best-practices)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Domain-Driven Design Reference](https://www.domainlanguage.com/ddd/reference/)
