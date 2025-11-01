# ProductOption（商品オプション定義）

## テーブル: product_options

商品レベルで定義される選択可能なオプション（色、サイズなど）の定義。

### スキーマ

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | ULID | PRIMARY KEY | オプション定義ID |
| product_id | ULID | FOREIGN KEY, NOT NULL | 商品ID |
| option_name | string(50) | NOT NULL | オプション名 |
| display_order | integer | NOT NULL | 表示順序 |
| created_at | timestamp | NOT NULL | 作成日時 |
| updated_at | timestamp | NOT NULL | 更新日時 |

### 複合UNIQUE制約

```sql
UNIQUE(product_id, option_name)
```

同じ商品内で同じオプション名は1つまで。

## テーブル: product_option_values

商品オプションの選択可能な値を管理。

### スキーマ

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | ULID | PRIMARY KEY | オプション値ID |
| product_option_id | ULID | FOREIGN KEY, NOT NULL | オプション定義ID |
| value | string(50) | NOT NULL | 値 |
| display_order | integer | NOT NULL | 表示順序 |
| created_at | timestamp | NOT NULL | 作成日時 |
| updated_at | timestamp | NOT NULL | 更新日時 |

### 複合UNIQUE制約

```sql
UNIQUE(product_option_id, value)
```

同じオプション定義内で同じ値は1つまで。

## ドメイン制約

### オプション数の制約

- ✅ 1商品あたり**5つ以下**のオプション定義（例: 色、サイズ、容量、素材、香り）
- ✅ 1オプションあたり**50個以下**の値
- ✅ **オプション組み合わせ総数は500以下**である必要がある（`<= 500`）
  - 例: 色3種×サイズ3種×容量2種 = 18通り ✅ OK
  - 例: 色10種×サイズ10種×容量5種 = 500通り ✅ OK（上限）
  - 例: 色50種×サイズ50種 = 2,500通り ❌ NG（500を超える）
- ✅ `option_name`は**50文字以内**
- ✅ `value`は**50文字以内**

### 組み合わせ総数の計算

```
総数 = option1の値数 × option2の値数 × ... × option5の値数
```

この値が500を超える場合、オプション値の追加を制限する。

### バリアント作成時の制約

- ✅ バリアントのオプションは、商品レベルで定義されたオプションから**のみ**選択可能
- ✅ 未定義のオプション名・値は使用不可

## 使用例

### 商品「オーガニックTシャツ」のオプション定義

```typescript
// product_options
{id: "opt1", product_id: "prod1", option_name: "色", display_order: 1}
{id: "opt2", product_id: "prod1", option_name: "サイズ", display_order: 2}

// product_option_values
{id: "val1", product_option_id: "opt1", value: "赤", display_order: 1}
{id: "val2", product_option_id: "opt1", value: "青", display_order: 2}
{id: "val3", product_option_id: "opt1", value: "白", display_order: 3}
{id: "val4", product_option_id: "opt2", value: "S", display_order: 1}
{id: "val5", product_option_id: "opt2", value: "M", display_order: 2}
{id: "val6", product_option_id: "opt2", value: "L", display_order: 3}
```

### バリアント作成時

管理画面では、定義済みのオプションから選択：

```
色: [選択] ▼赤 / 青 / 白
サイズ: [選択] ▼S / M / L
```

選択した組み合わせが`product_variant_options`に保存される。

## ビジネスルール

### オプション定義の作成タイミング

1. 商品作成時に一緒に定義（推奨）
2. 商品作成後、バリアント作成前に定義

### バリアント作成時の検証

```typescript
// バリアント作成時
POST /api/products/:id/variants
{
  sku: "TSHIRT-RED-L",
  price: 3000,
  options: {
    "色": "赤",      // ✅ product_options に "色" が定義されている
    "サイズ": "L",   // ✅ product_options に "サイズ" が定義されている
    "素材": "綿"     // ❌ エラー: "素材" は定義されていない
  }
}
```

### オプション値の検証

```typescript
// オプション値も定義済みのものから選択
{
  "色": "赤"    // ✅ product_option_values に "赤" が存在
  "色": "紫"    // ❌ エラー: "紫" は定義されていない
}
```

## リレーション

- **N:1** → Product（オプション定義は1つの商品に属する）
- **1:N** → ProductOptionValues（オプション定義は複数の値を持つ）

## フロントエンドでの使用

### 管理画面: バリアント作成

```typescript
// 1. 商品のオプション定義を取得
GET /api/products/:id/options
Response:
[
  {name: "色", values: ["赤", "青", "白"]},
  {name: "サイズ", values: ["S", "M", "L"]}
]

// 2. セレクトボックスで選択
// 3. バリアント作成API呼び出し
```

### 顧客画面: 商品詳細

```typescript
// オプション定義から選択UIを生成
色:
  ○ 赤  ○ 青  ○ 白
  
サイズ:
  ○ S   ○ M   ○ L
```

## 注意事項

### オプション定義の変更

- ⚠️ オプション名や値を変更すると、既存バリアントとの整合性が崩れる可能性
- 推奨: 新しい値を追加し、古い値は非推奨化（論理削除）
- または: 既存バリアントを先に更新してからオプション定義を変更
