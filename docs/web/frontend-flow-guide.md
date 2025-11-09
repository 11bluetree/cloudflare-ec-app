# フロントエンド実装フロー

商品登録画面を例にした、フロントエンド（apps/web）の実装手順。

**前提**: APIエンドポイントとスキーマ（`packages/types`）は作成済み

---

## 実装の流れ

```
API型定義（packages/types）← 既に作成済み
         ↓
1. フォームスキーマ作成
         ↓
2. API通信関数作成
         ↓
3. カスタムフック作成
         ↓
4. UIコンポーネント作成
         ↓
5. フォームコンポーネント作成
         ↓
6. ページコンポーネント作成
```

---

## Step 1: フォームスキーマ（lib/schemas）

**場所**: `apps/web/src/lib/schemas/product-form.ts`

**役割**:

- UI固有の状態を管理（`hasOptions`, `bulkPrice`など）
- 日本語のエラーメッセージを定義
- フォーム編集用の中間データ構造を定義

**ポイント**:

- Zodスキーマから型を導出
- API型の制約（`SKUSchema`など）は再利用
- UI固有の状態のみフォームスキーマに含める

---

## Step 2: API通信関数（lib/api）

**場所**: `apps/web/src/lib/api/products.ts`

**役割**:

- `packages/types`のリクエスト/レスポンス型を使用
- 共通ヘルパー関数でAPI通信を統一

**ポイント**:

- `packages/types`から型をインポート
- 共通の`apiPost`, `apiGet`を使用
- 型パラメータで戻り値の型を保証

---

## Step 3: カスタムフック（lib/hooks）

**場所**: `apps/web/src/lib/hooks/useProductForm.ts`

**役割**:

- フォームの状態管理を集約
- イベントハンドラをまとめる
- ビジネスロジック（バリアント生成など）を実装

**ポイント**:

- React Hook Form + Zodでバリデーション
- `useFieldArray`で動的フォーム管理
- トースト通知でUX向上

---

## Step 4: UIコンポーネント（components/ui）

**場所**: `apps/web/src/components/ui/form.tsx`

**役割**:

- 汎用的で再利用可能なUIコンポーネント
- プロジェクト全体で使用

**作成コンポーネント**:

- `FormField` - フォームフィールドのラッパー
- `FormSection` - セクションのラッパー

**ポイント**:

- Radix UI + Tailwind CSSで統一
- 必須マーク・エラー表示を標準化
- ロジックなし、見た目のみ

---

## Step 5: フォームコンポーネント（components/product/form）

**場所**: `apps/web/src/components/product/form/`

**役割**:

- ドメイン固有のPresentationalコンポーネント
- ロジックなし、propsで受け取るのみ

**作成コンポーネント**:

- `ProductBasicForm.tsx` - 基本情報フォーム
- `ProductOptionsForm.tsx` - オプション設定フォーム
- `SingleProductForm.tsx` - 単品用フォーム
- `ProductVariantList.tsx` - バリアント一覧

**ポイント**:

- `register`, `errors`などをpropsで受け取る
- UIコンポーネント（Step 4）を組み合わせる
- 文字数カウンターなどUX要素を追加

---

## Step 6: ページコンポーネント（routes）

**場所**: `apps/web/src/routes/admin/products/new.tsx`

**役割**:

- 全パーツを組み合わせる
- TanStack Routerでルート定義
- TanStack Queryでデータ取得・ミューテーション

**ポイント**:

- カスタムフック（Step 3）でロジック分離
- フォームコンポーネント（Step 5）で画面構成
- `useMutation`で商品登録処理
- フォームデータ → APIリクエストに変換

---

## 設計原則

### 関心の分離

| 層 | 責務 | 例 |
|---|---|---|
| UI | 見た目のみ | `ProductBasicForm.tsx` |
| ロジック | 状態管理・イベント処理 | `useProductForm.ts` |
| データ | API通信 | `products.ts` |

### 再利用性

- **汎用UI**: `components/ui` - Button, Input, FormField
- **ドメインUI**: `components/product` - ProductBasicForm
- **ロジック**: カスタムフック - useProductForm

### エラーハンドリング

- **フォーム**: Zod + React Hook Form
- **API**: TanStack Query + トースト通知
- **メッセージ**: 日本語でユーザーフレンドリーに

---

## まとめ

**実装順序**:

1. フォームスキーマ - UI固有の状態・日本語エラー
2. API関数 - packages/typesの型を再利用
3. カスタムフック - ロジック分離
4. UIコンポーネント - 汎用コンポーネント
5. フォームコンポーネント - ドメイン固有UI
6. ページ - 全パーツを組み合わせ

**実現できること**:

- ✅ 型安全 - API型とフォーム型で二重チェック
- ✅ 保守性 - 関心の分離で変更に強い
- ✅ 再利用性 - 汎用コンポーネント活用
- ✅ UX - トースト・バリデーション・カウンター
