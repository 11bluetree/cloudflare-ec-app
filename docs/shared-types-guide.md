# 共有型パッケージ設計ガイド

## 概要

`packages/types` はAPI（バックエンド）とWeb（フロントエンド）間で**型定義を共有**し、型安全な通信を保証するためのパッケージです。

## 設計思想

### 目的

- API/Web間の型の一貫性を保証
- TypeScriptの型システムを活用した契約駆動開発
- コンパイル時にAPI仕様の不一致を検出
- 開発効率の向上（型補完・自動ドキュメント化）

### 基本原則

**「型契約は共有、実装は自由」**

型定義とバリデーションルールだけを共有し、HTTPクライアントの実装やURL構築ロジックは各側で自由に実装します。

## 共有すべきもの

### ✅ 必ず共有するもの

#### 1. リクエスト/レスポンスの型定義

```typescript
// packages/types/src/product.ts
export interface ProductListQuery {
  page: number;
  limit: number;
  categoryId?: string;
  keyword?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy: 'createdAt' | 'price' | 'name';
  order: 'asc' | 'desc';
}

export interface ProductListResponse {
  products: ProductDto[];
  pagination: PaginationDto;
}
```

**用途:**

- **API側**: リクエストパラメータの型チェック、レスポンス構築
- **Web側**: リクエスト送信時の型安全性、レスポンス受信時の型推論

#### 2. Zodバリデーションスキーマ

```typescript
// packages/types/src/product.ts
export const ProductListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  categoryId: z.string().optional(),
  keyword: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  sortBy: z.enum(['createdAt', 'price', 'name']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export type ProductListQuery = z.infer<typeof ProductListQuerySchema>;
```

**用途:**

- **API側**: `zValidator('query', ProductListQuerySchema)` で入力検証
- **Web側**: `ProductListQuerySchema.parse()` でURLパラメータ検証（任意）

**利点:**

- バリデーションルールが1箇所で管理される
- API/Web間で同じルールが適用される
- 型定義とバリデーションが自動で同期

#### 3. 共通のEnum/定数

```typescript
// packages/types/src/product.ts
export const ProductStatusSchema = z.enum(['draft', 'published', 'archived']);
export type ProductStatus = z.infer<typeof ProductStatusSchema>;
```

**用途:**

- ビジネスドメインで使用する列挙型
- API/Web間で値の一貫性を保証

#### 4. DTO（Data Transfer Object）

```typescript
// packages/types/src/product.ts
export interface ProductDto {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  status: ProductStatus;
  minPrice: number;
  maxPrice: number;
  thumbnail: string | null;
  inStock: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationDto {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
```

**特徴:**

- API通信用の軽量なデータ構造
- ドメインエンティティとは分離
- JSONシリアライズ可能な型のみ使用

### ❌ 共有しないもの

#### 1. ドメインロジック

```typescript
// ❌ packages/types には置かない
// ✅ packages/library に配置（API側専用）
export class Product {
  publish(): void { /* ビジネスロジック */ }
  isInStock(): boolean { /* ドメインロジック */ }
}
```

**理由:**

- ドメインエンティティはバックエンドの責務
- Webはドメインロジックを直接扱わない（DTOで受け取る）

#### 2. API実装の詳細

```typescript
// ❌ 過剰設計: HTTPクライアントを強制的に共有
export const fetchProducts = async (params: ProductListQuery) => {
  const response = await fetch(`/api/products?${buildQuery(params)}`)
  return response.json()
}
```

**理由:**

- Web側が好きなHTTPクライアントを選べなくなる（fetch, axios, tanstack query等）
- URL構築やエラーハンドリングは各プロジェクトの要件による
- 実装の柔軟性を損なう

#### 3. フレームワーク固有の型

```typescript
// ❌ Hono固有の型
import type { Context } from 'hono'

// ❌ TanStack Router固有の型
import type { RouteContext } from '@tanstack/react-router'
```

**理由:**

- フレームワークへの依存を最小化
- 純粋な型定義のみを共有

## 実装例

### API側（Hono + Cloudflare Workers）

```typescript
// apps/api/src/presentation/routes/products.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { ProductListQuerySchema, type ProductListResponse } from '@cloudflare-ec-app/types';

app.get('/', zValidator('query', ProductListQuerySchema), async (c) => {
  const query = c.req.valid('query'); // 型推論される
  
  // ユースケース実行
  const result = await listProductsUseCase.execute(query);
  
  // レスポンス構築
  const response: ProductListResponse = {
    products: result.items.map(toProductDto),
    pagination: result.pagination,
  };
  
  return c.json(response);
});
```

### Web側（TanStack Router + React）

```typescript
// apps/web/src/routes/products.tsx
import { createFileRoute } from '@tanstack/react-router';
import { apiGet } from '../lib/api';
import type { ProductListResponse, ProductListQuery } from '@cloudflare-ec-app/types';
import { ProductListQuerySchema } from '@cloudflare-ec-app/types';

const fetchProducts = async (params: ProductListQuery): Promise<ProductListResponse> => {
  // クエリパラメータを構築（実装は自由）
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.set(key, value.toString());
    }
  });

  const query = queryParams.toString();
  return apiGet<ProductListResponse>(`/api/products${query ? `?${query}` : ''}`);
};

export const Route = createFileRoute('/products')({
  validateSearch: (search) => ProductListQuerySchema.parse(search),
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => fetchProducts(deps),
  component: ProductsPage,
});
```

## 利点

### 1. 型安全性

```typescript
// ✅ TypeScriptが型エラーで契約違反を検出
const params: ProductListQuery = {
  page: 1,
  limit: 20,
  sortBy: 'invalid', // ← エラー: "createdAt" | "price" | "name" のみ
};
```

### 2. 開発効率

- IDE/エディタの型補完が効く
- APIの仕様を調べる手間が減る
- リファクタリングが安全になる

### 3. 保守性

```typescript
// API側で型を変更
export interface ProductListQuery {
  page: number;
  limit: number;
  newField: string; // 追加
}

// → Web側で即座にコンパイルエラー
// → 修正箇所が明確になる
```

### 4. 柔軟性

Web側は実装方法を自由に選択可能：

```typescript
// 例1: 手動fetch
fetch(`/api/products?page=${params.page}`)

// 例2: axios
axios.get('/api/products', { params })

// 例3: TanStack Query
useQuery<ProductListResponse>(['products', params], ...)
```

### 5. ドキュメント性

型定義自体がAPI仕様書として機能：

```typescript
// 型を見れば何が必要か一目瞭然
interface ProductListQuery {
  page: number;        // ページ番号
  limit: number;       // 取得件数
  keyword?: string;    // 検索キーワード（任意）
}
```

## アンチパターン

### ❌ Web側で型を再定義

```typescript
// ❌ 悪い例: 重複定義
interface Product {
  id: string;
  name: string;
}

// ✅ 良い例: 共有型を使用
import type { ProductDto } from '@cloudflare-ec-app/types';
```

### ❌ APIクライアントを強制的に共有

```typescript
// ❌ 悪い例: 実装を共有
export const apiClient = {
  fetchProducts: (params) => { /* ... */ }
};

// ✅ 良い例: 型だけ共有
import type { ProductListQuery, ProductListResponse } from '@cloudflare-ec-app/types';
// 実装は各自で
```

### ❌ ドメインエンティティをそのまま共有

```typescript
// ❌ 悪い例: ビジネスロジックを含む
export class Product {
  calculateDiscount(): number { /* ... */ }
}

// ✅ 良い例: DTOに変換
export interface ProductDto {
  id: string;
  name: string;
  discountedPrice: number; // すでに計算済み
}
```

## ディレクトリ構造

```
packages/types/
├── src/
│   ├── index.ts           # エントリーポイント
│   ├── product.ts         # 商品関連の型
│   ├── cart.ts            # カート関連の型
│   ├── order.ts           # 注文関連の型
│   └── user.ts            # ユーザー関連の型
├── package.json
└── tsconfig.json
```

## ベストプラクティス

### 1. 型とスキーマをセットで定義

```typescript
// Zodスキーマから型を生成
export const ProductListQuerySchema = z.object({ /* ... */ });
export type ProductListQuery = z.infer<typeof ProductListQuerySchema>;
```

### 2. DTOには `Dto` サフィックスをつける

```typescript
export interface ProductDto { /* ... */ }
export interface OrderDto { /* ... */ }
```

### 3. リクエスト/レスポンスの命名規則

```typescript
// パターン: {Feature}{Action}Query/Request/Response
export interface ProductListQuery { /* ... */ }
export interface ProductListResponse { /* ... */ }
export interface ProductCreateRequest { /* ... */ }
export interface ProductUpdateRequest { /* ... */ }
```

### 4. 共通型は別ファイルに

```typescript
// src/common.ts
export interface PaginationDto { /* ... */ }
export interface ErrorResponse { /* ... */ }
```

## まとめ

- **型契約を共有**: API仕様を型で表現
- **実装は自由**: HTTPクライアントやURL構築は各自で
- **Zodで一貫性**: バリデーションルールを統一
  - V4以上を使用
- **DRY原則**: 型定義の重複を排除
- **柔軟性を保つ**: 実装の詳細を強制しない

この設計により、型安全性と開発効率を両立しながら、各チームの実装の自由度も保たれます。
