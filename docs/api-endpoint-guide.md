# APIエンドポイント作成ガイド

## 概要

このドキュメントでは、新しいAPIエンドポイントを作成する際の流れと、必要なコンポーネントについて説明します。

## 基本的な流れ

新しいAPIエンドポイントを作成する際は、以下の順序で実装を進めます：

```text
1. Domain Layer (エンティティ・値オブジェクト)
   ↓
2. Application Layer (ユースケース・ポート定義)
   ↓
3. Infrastructure Layer (リポジトリ実装)
   ↓
4. Presentation Layer (ルート・バリデーション)
   ↓
5. 統合テスト
```

## 必要なコンポーネント

### 1. Domain Layer（`apps/api/src/domain/`）

**目的**: ビジネスルールとドメイン知識を表現する

#### エンティティ（Entities）

- **場所**: `apps/api/src/domain/entities/`
- **責務**: ビジネスの中心概念を表現し、不変条件を守る
- **例**: `Product`, `Order`, `Cart`
- **バリデーション方針**: **Zod v4 を使用して不変条件を検証し、`static create()` 内で `schema.parse()` してインスタンスを返す**

```typescript
// apps/api/src/domain/entities/product.ts
import { z } from 'zod';

// エンティティのバリデーションスキーマ
const productSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  price: z.number().min(0, '価格は0以上である必要があります'),
  stock: z.number().int().nonnegative(),
  categoryId: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export class Product {
  private constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly price: number,
    public readonly stock: number,
    public readonly categoryId: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(params: {
    id: string;
    name: string;
    price: number;
    stock: number;
    categoryId: string;
    createdAt?: Date;
    updatedAt?: Date;
  }): Product {
    // Zodでバリデーション（パース失敗時はZodErrorがスローされる）
    const validated = productSchema.parse({
      ...params,
      createdAt: params.createdAt ?? new Date(),
      updatedAt: params.updatedAt ?? new Date(),
    });

    return new Product(
      validated.id,
      validated.name,
      validated.price,
      validated.stock,
      validated.categoryId,
      validated.createdAt,
      validated.updatedAt,
    );
  }

  // ドメインロジック
  isInStock(): boolean {
    return this.stock > 0;
  }

  decreaseStock(quantity: number): Product {
    if (quantity > this.stock) {
      throw new Error('在庫が不足しています');
    }
    return Product.create({
      ...this,
      stock: this.stock - quantity,
      updatedAt: new Date(),
    });
  }
}
```

#### 値オブジェクト（Value Objects）

- **場所**: `apps/api/src/domain/value-objects/`
- **責務**: 概念を表す不変の値（等価性は値で判断）
- **例**: `Money`, `Email`, `Address`
- **バリデーション方針**: **Zod v4 を使用して制約を検証し、`static create()` 内で `schema.parse()` してインスタンスを返す**

```typescript
// apps/api/src/domain/value-objects/money.ts
import { z } from 'zod';

// 値オブジェクトのバリデーションスキーマ
const moneySchema = z.object({
  amount: z.number().min(0, '金額は0以上である必要があります'),
  currency: z.string().length(3, '通貨コードは3文字である必要があります'),
});

export class Money {
  private constructor(
    public readonly amount: number,
    public readonly currency: string,
  ) {}

  static create(amount: number, currency: string): Money {
    // Zodでバリデーション
    const validated = moneySchema.parse({ amount, currency });
    return new Money(validated.amount, validated.currency);
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error('通貨が異なるため加算できません');
    }
    return Money.create(this.amount + other.amount, this.currency);
  }

  multiply(factor: number): Money {
    return Money.create(this.amount * factor, this.currency);
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }
}
```

### 2. Application Layer（`apps/api/src/application/`）

**目的**: ユースケースを実装し、ドメインロジックを組み立てる

#### ユースケース（UseCases）

- **場所**: `apps/api/src/application/usecases/{domain}/`
- **責務**: 1つのユーザーアクションを実現する
- **命名規則**: `{動詞}-{対象}.usecase.ts`（例: `create-product.usecase.ts`）

```typescript
// apps/api/src/application/usecases/product/create-product.usecase.ts
import type { IProductRepository } from '../../ports/repositories/product.repository.interface';
import { Product } from '../../../domain/entities/product';

export class CreateProductUseCase {
  constructor(private productRepository: IProductRepository) {}

  async execute(input: CreateProductInput): Promise<CreateProductOutput> {
    // 1. ドメインエンティティを作成（ビジネスルール検証）
    const product = Product.create(
      input.name,
      input.price,
      // ...
    );

    // 2. リポジトリで永続化
    await this.productRepository.save(product);

    // 3. 結果を返す
    return {
      id: product.id,
      name: product.name,
      // ...
    };
  }
}

// 入出力の型定義
export type CreateProductInput = {
  name: string;
  price: number;
  // ...
};

export type CreateProductOutput = {
  id: string;
  name: string;
  // ...
};
```

#### ポート（Ports - インターフェース定義）

- **場所**: `apps/api/src/application/ports/`
- **責務**: 外部依存（DB、外部API等）のインターフェースを定義

**リポジトリインターフェース**（`ports/repositories/`）:

```typescript
// apps/api/src/application/ports/repositories/product.repository.interface.ts
import type { Product } from '../../../domain/entities/product';

export interface IProductRepository {
  save(product: Product): Promise<void>;
  findById(id: string): Promise<Product | null>;
  findAll(): Promise<Product[]>;
  delete(id: string): Promise<void>;
}
```

**外部サービスインターフェース**（`ports/services/`）:

```typescript
// apps/api/src/application/ports/services/payment.service.interface.ts
export interface IPaymentService {
  processPayment(amount: number, token: string): Promise<PaymentResult>;
  refund(transactionId: string): Promise<void>;
}
```

### 3. Infrastructure Layer（`apps/api/src/infrastructure/`）

**目的**: 技術的詳細を実装する（DB接続、外部API呼び出し等）

#### リポジトリ実装

- **場所**: `apps/api/src/infrastructure/internal/repositories/`
- **責務**: ポートで定義されたインターフェースを実装

```typescript
// apps/api/src/infrastructure/internal/repositories/product.repository.ts
import type { IProductRepository } from '../../../application/ports/repositories/product.repository.interface';
import type { Product } from '../../../domain/entities/product';

export class D1ProductRepository implements IProductRepository {
  constructor(private db: D1Database) {}

  async save(product: Product): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO products (id, name, price, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    await stmt
      .bind(product.id, product.name, product.price, product.createdAt.toISOString(), product.updatedAt.toISOString())
      .run();
  }

  async findById(id: string): Promise<Product | null> {
    const stmt = this.db.prepare(`
      SELECT * FROM products WHERE id = ?
    `);

    const result = await stmt.bind(id).first<ProductRow>();

    if (!result) return null;

    return Product.create(
      result.id,
      result.name,
      result.price,
      // ...
    );
  }

  // ... その他のメソッド
}

type ProductRow = {
  id: string;
  name: string;
  price: number;
  // ...
};
```

#### マッパー

- **場所**: `apps/api/src/infrastructure/internal/mappers/`
- **責務**: ドメインオブジェクトとDTOの相互変換

```typescript
// apps/api/src/infrastructure/internal/mappers/product.mapper.ts
import type { Product } from '../../../domain/entities/product';
import type { ProductDTO } from '@repo/types';

export class ProductMapper {
  static toDTO(product: Product): ProductDTO {
    return {
      id: product.id,
      name: product.name,
      price: product.price,
      // ...
    };
  }

  static toDomain(dto: ProductDTO): Product {
    return Product.create(
      dto.id,
      dto.name,
      dto.price,
      // ...
    );
  }
}
```

### 4. Presentation Layer（`apps/api/src/presentation/`）

**目的**: HTTPリクエスト/レスポンスを処理する

#### ルート定義

- **場所**: `apps/api/src/presentation/routes/`
- **責務**: エンドポイントを定義し、ユースケースを呼び出す
- **命名規則**: `{domain}.ts`（例: `products.ts`）

```typescript
// apps/api/src/presentation/routes/products.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { CreateProductUseCase } from '../../application/usecases/product/create-product.usecase';
import { D1ProductRepository } from '../../infrastructure/internal/repositories/product.repository';
import { createProductSchema } from '../validators/product.validator';

const app = new Hono<{ Bindings: Env }>();

// POST /api/products - 商品作成
app.post('/', zValidator('json', createProductSchema), async (c) => {
  const body = c.req.valid('json');

  // 1. 依存関係を注入
  const productRepository = new D1ProductRepository(c.env.DB);
  const useCase = new CreateProductUseCase(productRepository);

  // 2. ユースケースを実行
  const result = await useCase.execute(body);

  // 3. レスポンスを返す
  return c.json(result, 201);
});

// GET /api/products/:id - 商品詳細取得
app.get('/:id', async (c) => {
  const id = c.req.param('id');

  const productRepository = new D1ProductRepository(c.env.DB);
  const useCase = new GetProductDetailUseCase(productRepository);

  const result = await useCase.execute({ id });

  if (!result) {
    return c.json({ error: '商品が見つかりません' }, 404);
  }

  return c.json(result);
});

export default app;
```

#### バリデーション

- **場所**: `apps/api/src/presentation/validators/`
- **責務**: リクエストボディ/クエリパラメータの検証
- **ライブラリ**: **Zod v4** を使用（可能な限りZodで検証を実施）

**バリデーション方針**:

- HTTPリクエストの入力検証は必ずZodスキーマで実施する
- ドメインエンティティのビジネスルール検証は、エンティティ内で実施する
- 複雑なバリデーションも可能な限りZodの`.refine()`や`.superRefine()`を活用する

```typescript
// apps/api/src/presentation/validators/product.validator.ts
import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1, '商品名は必須です').max(100, '商品名は100文字以内です'),
  price: z.number().min(0, '価格は0以上である必要があります'),
  description: z.string().optional(),
  categoryId: z.string().uuid('カテゴリーIDはUUID形式である必要があります'),
  stock: z.number().int().min(0, '在庫は0以上の整数である必要があります'),
});

export const updateProductSchema = createProductSchema.partial();

export const listProductsQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('20'),
  categoryId: z.string().uuid().optional(),
});

// 複雑なバリデーション例（カスタムロジック）
export const createOrderSchema = z
  .object({
    items: z
      .array(
        z.object({
          productId: z.string().uuid(),
          quantity: z.number().int().min(1),
        }),
      )
      .min(1, '注文には最低1つの商品が必要です'),
    shippingAddress: z.object({
      postalCode: z.string().regex(/^\d{3}-?\d{4}$/, '郵便番号の形式が不正です'),
      prefecture: z.string().min(1),
      city: z.string().min(1),
      addressLine1: z.string().min(1),
      addressLine2: z.string().optional(),
    }),
    paymentMethod: z.enum(['credit_card', 'bank_transfer']),
  })
  .refine(
    (data) => {
      // カスタムバリデーション: 商品IDの重複チェック
      const productIds = data.items.map((item) => item.productId);
      return new Set(productIds).size === productIds.length;
    },
    {
      message: '同じ商品が重複しています',
      path: ['items'],
    },
  );
```

#### ミドルウェア

- **場所**: `apps/api/src/presentation/middleware/`
- **責務**: 認証、権限チェック、エラーハンドリング等

```typescript
// apps/api/src/presentation/middleware/auth.middleware.ts
import type { Context, Next } from 'hono';

export const authMiddleware = async (c: Context, next: Next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return c.json({ error: '認証が必要です' }, 401);
  }

  // トークン検証ロジック
  const user = await verifyToken(token);

  if (!user) {
    return c.json({ error: '無効なトークンです' }, 401);
  }

  // コンテキストにユーザー情報を設定
  c.set('user', user);

  await next();
};
```

### 5. 共有型定義（`packages/types/`）

**目的**: フロントエンドとバックエンドで型を共有する

```typescript
// packages/types/src/product.ts
export type ProductDTO = {
  id: string;
  name: string;
  price: number;
  description: string | null;
  categoryId: string;
  stock: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateProductRequest = {
  name: string;
  price: number;
  description?: string;
  categoryId: string;
  stock: number;
};

export type CreateProductResponse = {
  id: string;
  name: string;
  price: number;
  // ...
};
```

## 実装例：商品一覧取得エンドポイント

以下は、実際に`GET /api/products`エンドポイントを作成する際の手順です。

### Step 1: ドメインエンティティの確認

既存の`Product`エンティティを確認します。

```typescript
// apps/api/src/domain/entities/product.ts
export class Product {
  // 既存実装を利用
}
```

### Step 2: ユースケースの作成

```typescript
// apps/api/src/application/usecases/product/list-products.usecase.ts
import type { IProductRepository } from '../../ports/repositories/product.repository.interface';
import { ProductMapper } from '../../../infrastructure/internal/mappers/product.mapper';
import type { ProductDTO } from '@repo/types';

export class ListProductsUseCase {
  constructor(private productRepository: IProductRepository) {}

  async execute(input: ListProductsInput): Promise<ListProductsOutput> {
    const products = await this.productRepository.findAll({
      page: input.page,
      limit: input.limit,
      categoryId: input.categoryId,
    });

    const total = await this.productRepository.count({
      categoryId: input.categoryId,
    });

    return {
      products: products.map(ProductMapper.toDTO),
      total,
      page: input.page,
      limit: input.limit,
    };
  }
}

export type ListProductsInput = {
  page: number;
  limit: number;
  categoryId?: string;
};

export type ListProductsOutput = {
  products: ProductDTO[];
  total: number;
  page: number;
  limit: number;
};
```

### Step 3: リポジトリインターフェースの更新

```typescript
// apps/api/src/application/ports/repositories/product.repository.interface.ts
export interface IProductRepository {
  // 既存メソッド
  save(product: Product): Promise<void>;
  findById(id: string): Promise<Product | null>;

  // 追加
  findAll(options: FindAllOptions): Promise<Product[]>;
  count(options: CountOptions): Promise<number>;
}

export type FindAllOptions = {
  page: number;
  limit: number;
  categoryId?: string;
};

export type CountOptions = {
  categoryId?: string;
};
```

### Step 4: リポジトリ実装

```typescript
// apps/api/src/infrastructure/internal/repositories/product.repository.ts
export class D1ProductRepository implements IProductRepository {
  // 既存実装...

  async findAll(options: FindAllOptions): Promise<Product[]> {
    const offset = (options.page - 1) * options.limit;

    let query = `
      SELECT * FROM products
      WHERE deleted_at IS NULL
    `;
    const params: unknown[] = [];

    if (options.categoryId) {
      query += ` AND category_id = ?`;
      params.push(options.categoryId);
    }

    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(options.limit, offset);

    const stmt = this.db.prepare(query);
    const result = await stmt.bind(...params).all<ProductRow>();

    return result.results.map((row) => Product.create(/* map row to Product */));
  }

  async count(options: CountOptions): Promise<number> {
    let query = `
      SELECT COUNT(*) as count FROM products
      WHERE deleted_at IS NULL
    `;
    const params: unknown[] = [];

    if (options.categoryId) {
      query += ` AND category_id = ?`;
      params.push(options.categoryId);
    }

    const stmt = this.db.prepare(query);
    const result = await stmt.bind(...params).first<{ count: number }>();

    return result?.count ?? 0;
  }
}
```

### Step 5: ルート定義

```typescript
// apps/api/src/presentation/routes/products.ts
import { zValidator } from '@hono/zod-validator';
import { listProductsQuerySchema } from '../validators/product.validator';
import { ListProductsUseCase } from '../../application/usecases/product/list-products.usecase';

app.get('/', zValidator('query', listProductsQuerySchema), async (c) => {
  const query = c.req.valid('query');

  const productRepository = new D1ProductRepository(c.env.DB);
  const useCase = new ListProductsUseCase(productRepository);

  const result = await useCase.execute({
    page: query.page,
    limit: query.limit,
    categoryId: query.categoryId,
  });

  return c.json(result);
});
```

### Step 6: テストの作成

```typescript
// apps/api/src/presentation/routes/__tests__/products.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import app from '../products';

describe('GET /api/products', () => {
  it('商品一覧を取得できる', async () => {
    const res = await app.request('/api/products');

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('products');
    expect(body).toHaveProperty('total');
    expect(body).toHaveProperty('page');
    expect(body).toHaveProperty('limit');
  });

  it('ページネーションが正しく動作する', async () => {
    const res = await app.request('/api/products?page=2&limit=10');

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.page).toBe(2);
    expect(body.limit).toBe(10);
  });
});
```

## チェックリスト

新しいAPIエンドポイントを作成する際は、以下を確認してください：

### ドメイン層

- [ ] エンティティ/値オブジェクトが作成されている
- [ ] ビジネスルールがドメインオブジェクトに実装されている
- [ ] 不変条件が守られている（コンストラクタでバリデーション）

### アプリケーション層

- [ ] ユースケースが作成されている
- [ ] 入出力の型が明確に定義されている
- [ ] リポジトリインターフェース（ポート）が定義されている
- [ ] ドメインロジックに委譲している（貧血モデルでない）

### インフラストラクチャ層

- [ ] リポジトリ実装がインターフェースを満たしている
- [ ] SQLインジェクション対策済み（プリペアドステートメント使用）
- [ ] エラーハンドリングが適切
- [ ] マッパーでドメインとDTOを変換している

### プレゼンテーション層

- [ ] ルートが定義されている
- [ ] バリデーションスキーマが作成されている（Zod）
- [ ] 適切なHTTPステータスコードを返している
- [ ] 認証/認可ミドルウェアが適用されている（必要な場合）
- [ ] エラーレスポンスが一貫している

### テスト

- [ ] ドメインエンティティの単体テストがある
- [ ] ユースケースのテストがある
- [ ] エンドポイントの統合テストがある
- [ ] エッジケースのテストがある

### ドキュメント

- [ ] 共有型が`packages/types`に定義されている
- [ ] PRDのAPI仕様セクションと一致している

## よくある間違い

### ❌ アンチパターン

1. **貧血ドメインモデル**: ビジネスロジックがサービス層に流出

```typescript
// ❌ 悪い例
class ProductService {
  calculateTotalPrice(product: Product, quantity: number): number {
    return product.price * quantity;
  }
}
```

```typescript
// ✅ 良い例
class Product {
  calculateTotalPrice(quantity: number): number {
    return this.price * quantity;
  }
}
```

1. **レイヤーの飛び越し**: Presentationから直接Repositoryを呼ぶ

```typescript
// ❌ 悪い例
app.get('/products', async (c) => {
  const repository = new ProductRepository(c.env.DB);
  const products = await repository.findAll();
  return c.json(products);
});
```

```typescript
// ✅ 良い例
app.get('/products', async (c) => {
  const repository = new ProductRepository(c.env.DB);
  const useCase = new ListProductsUseCase(repository);
  const result = await useCase.execute({ page: 1, limit: 20 });
  return c.json(result);
});
```

1. **SQLインジェクション脆弱性**: 文字列結合でクエリ作成

```typescript
// ❌ 悪い例
const query = `SELECT * FROM products WHERE id = '${id}'`;
```

```typescript
// ✅ 良い例
const stmt = db.prepare(`SELECT * FROM products WHERE id = ?`);
await stmt.bind(id).first();
```

## 参考ドキュメント

- [アーキテクチャガイド](./architecture.md) - レイヤードアーキテクチャの詳細
- [PRD](./prd.md) - API仕様とデータモデル
- [テストガイド](./testing-guide.md) - テスト作成方針
- [データベースガイド](./database-guide.md) - D1の使い方とマイグレーション
