# データモデル

ECアプリケーションのデータモデル定義。

## モデル一覧

### ユーザー関連

- [User](./user.md) - ユーザー情報

### 商品関連

- [Product](./product.md) - 商品基本情報
- [ProductOption](./product-option.md) - 商品オプション定義（色、サイズなどの定義）
- [ProductVariant](./product-variant.md) - 商品バリアント
- [ProductVariantOption](./product-variant-option.md) - バリアントオプション（バリアントごとの値）
- [ProductImage](./product-image.md) - 商品画像
- [Category](./category.md) - 商品カテゴリー
- [Inventory](./inventory.md) - 在庫管理

### 注文関連

- [Order](./order.md) - 注文情報
- [OrderLineItem](./order-line-item.md) - 注文明細

### カート関連

- [Cart](./cart.md) - ショッピングカート
- [CartLineItem](./cart-line-item.md) - カート明細

## エンティティ関係図

```sh
User
 ├─1:N→ Order
 │       └─1:N→ OrderLineItem
 │                ├─N:1→ Product
 │                └─N:1→ ProductVariant
 └─1:1→ Cart (active)
         └─1:N→ CartLineItem
                  ├─N:1→ Product
                  └─N:1→ ProductVariant

Category
 ├─1:N→ Product
 │       ├─1:N→ ProductOption（オプション定義）
 │       │       └─1:N→ ProductOptionValue（選択可能な値）
 │       ├─1:N→ ProductVariant
 │       │       ├─1:N→ ProductVariantOption（実際の選択値）
 │       │       ├─1:1→ Inventory
 │       │       └─1:N→ ProductImage
 │       └─1:N→ ProductImage
 └─1:N→ Category (子カテゴリー)
```

## 集約ルート（Aggregate Root）

DDD的な集約の観点：

- **User** - ユーザー集約
- **Product** - 商品集約（ProductOption, ProductVariant, ProductVariantOption, ProductImage, Inventoryを含む）
- **Order** - 注文集約（OrderLineItemsを含む）
- **Cart** - カート集約（CartLineItemsを含む）
- **Category** - カテゴリー集約（階層構造）

## 実装しない機能

- ❌ **Favorites（お気に入り）** - PRDで明示的にスコープ外
