# データモデル

## 主要テーブル

### Users（ユーザー）

- id (ULID)
- email (string, unique)
- password_hash (string)
- name (string)
- phone (string)
- role (enum: customer, admin)
- created_at (timestamp)
- updated_at (timestamp)

### Products（商品）

- id (ULID)
- name (string)
- description (text)
- category_id (ULID)
- status (enum: draft, published, archived)
- created_at (timestamp)
- updated_at (timestamp)

### ProductVariants（商品バリエーション）

- id (ULID)
- product_id (ULID)
- sku (string, unique)
- price (decimal)
- stock_quantity (integer)
- size (string, nullable)
- color (string, nullable)
- display_order (integer)
- created_at (timestamp)
- updated_at (timestamp)

### ProductImages（商品画像）

- id (ULID)
- product_id (ULID, nullable)
- product_variant_id (ULID, nullable)
- image_url (string)
- display_order (integer)
- created_at (timestamp)

> ※ `product_id` と `product_variant_id` のどちらか片方は必須
>
> - `product_id` のみ: 商品全体の共通画像
> - `product_variant_id` のみ: 特定バリエーションの固有画像
> - 両方指定: バリエーション固有の画像（商品との関連も保持）

### Categories（カテゴリー）

- id (ULID)
- name (string)
- parent_id (ULID, nullable)
- display_order (integer)
- created_at (timestamp)
- updated_at (timestamp)

### Orders（注文）

- id (ULID)
- user_id (ULID)
- order_number (string, unique)
- status (enum: pending, processing, shipped, completed, cancelled)
- total_amount (decimal)
- shipping_address (json)
- payment_method (string)
- created_at (timestamp)
- updated_at (timestamp)

### OrderLineItems（注文明細）

- id (ULID)
- order_id (ULID)
- product_id (ULID)
- product_variant_id (ULID)
- quantity (integer)
- unit_price (decimal)
- subtotal (decimal)
- created_at (timestamp)

### Carts（カート）

- id (ULID)
- user_id (ULID)
- status (enum: active, abandoned, ordered, merged)
- created_at (timestamp)
- updated_at (timestamp)

### CartLineItems（カート明細）

- id (ULID)
- cart_id (ULID)
- product_id (ULID)
- product_variant_id (ULID)
- quantity (integer)
- created_at (timestamp)
- updated_at (timestamp)

### Favorites（お気に入り）

実装しません
