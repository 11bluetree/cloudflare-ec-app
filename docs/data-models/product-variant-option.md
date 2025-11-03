# ProductVariantOption（商品バリアントオプション）

## テーブル: product_variant_options

商品バリアントの各オプション（サイズ、色、容量など）と値を管理。

### スキーマ

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | ULID | PRIMARY KEY | オプションID |
| product_variant_id | ULID | FOREIGN KEY, NOT NULL | バリアントID |
| option_name | string(50) | NOT NULL | オプション名 |
| option_value | string(50) | NOT NULL | オプション値 |
| display_order | integer | NOT NULL | 表示順序 |
| created_at | timestamp | NOT NULL | 作成日時 |
| updated_at | timestamp | NOT NULL | 更新日時 |

### 複合UNIQUE制約

```sql
UNIQUE(product_variant_id, option_name)
```

同じバリアント内で同じオプション名は1つまで。

## ドメイン制約

### オプション数の制約

- ✅ **すべてのバリアントには最低1つのオプションが必須**
- ✅ 1つのバリアントに対して**1〜5個**のオプション
- ✅ 1つのオプション（option_name）に対して**50個以下**の値（option_value）
- ✅ `option_name`は**50文字以内**
- ✅ `option_value`は**50文字以内**

### 組み合わせの制約

- ✅ 同じバリアント内で同じ`option_name`は重複不可
- ✅ 商品全体で最大**100種類**のバリアント
- ✅ 理論上の最大組み合わせ: 5オプション × 各50値 = 312,500,000通り（ただし実際は100種類まで制限）

### オプション名の例

- `サイズ` → `S`, `M`, `L`, `XL`
- `色` → `赤`, `青`, `白`, `黒`
- `容量` → `100ml`, `200ml`, `500ml`
- `素材` → `コットン`, `ポリエステル`, `シルク`
- `香り` → `ラベンダー`, `ローズ`, `無香料`

## バリアント名の生成ルール

オプションを`display_order`順に並べて `/` で連結：

```typescript
// 例1: 複数オプション
option_name="色", option_value="赤" (display_order=1)
option_name="サイズ", option_value="L" (display_order=2)
option_name="容量", option_value="200ml" (display_order=3)
→ バリアント名: "赤 / L / 200ml"

// 例2: デフォルトバリアント
option_name="title", option_value="default" (display_order=0)
→ バリアント名: "default"
```

## ビジネスルール

### フロントエンドでの表示

商品詳細画面で、各オプションをドロップダウンやボタンで選択可能にする：

```
色: ○赤 ○青 ○白
サイズ: ○S ○M ○L
容量: ○100ml ○200ml ○500ml
```

選択された組み合わせに該当するバリアントを特定し、価格・在庫を表示。

### バリアント特定のクエリ

```sql
-- 「色=赤」「サイズ=L」「容量=200ml」のバリアントを検索
SELECT pv.* 
FROM product_variants pv
WHERE pv.product_id = ?
  AND EXISTS (
    SELECT 1 FROM product_variant_options 
    WHERE product_variant_id = pv.id 
      AND option_name = '色' AND option_value = '赤'
  )
  AND EXISTS (
    SELECT 1 FROM product_variant_options 
    WHERE product_variant_id = pv.id 
      AND option_name = 'サイズ' AND option_value = 'L'
  )
  AND EXISTS (
    SELECT 1 FROM product_variant_options 
    WHERE product_variant_id = pv.id 
      AND option_name = '容量' AND option_value = '200ml'
  )
```

## リレーション

- **N:1** → ProductVariant（オプションは1つのバリアントに属する）

## 注意事項

### オプション名の統一

同じ商品内では、オプション名を統一する必要がある：

- ❌ 悪い例: あるバリアントで「色」、別のバリアントで「カラー」
- ✅ 良い例: 全バリアントで「色」で統一

これはアプリケーション層で制御する。
