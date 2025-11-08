/**
 * 商品登録フォームのスキーマ定義
 * Phase 1: バリアントなし商品の登録
 */

import { z } from 'zod';

/**
 * Phase 1: シンプルな商品登録フォームのスキーマ
 * バリアントなし商品用（基本情報 + 単一の価格/SKU）
 */
export const simpleProductFormSchema = z.object({
  // 基本情報
  name: z.string().min(1, '商品名を入力してください').max(200, '商品名は200文字以内で入力してください').trim(),

  description: z
    .string()
    .min(1, '商品説明を入力してください')
    .max(4096, '商品説明は4096文字以内で入力してください')
    .trim(),

  categoryId: z.string().length(26, 'カテゴリーを選択してください'),

  status: z.enum(['draft', 'published'], 'ステータスを選択してください'),

  // 価格・SKU（バリアントなし商品用）
  sku: z.string().min(1, 'SKUを入力してください').max(100, 'SKUは100文字以内で入力してください').trim(),

  price: z
    .number('価格は数値で入力してください')
    .int('価格は整数で入力してください')
    .min(0, '価格は0円以上で入力してください')
    .max(999999, '価格は999,999円以下で入力してください'),

  barcode: z.string().max(100, 'バーコードは100文字以内で入力してください').trim().optional().nullable(),
});

export type SimpleProductFormData = z.infer<typeof simpleProductFormSchema>;

/**
 * フォームデータをAPI送信用のリクエストに変換
 */
export const convertToCreateProductRequest = (formData: SimpleProductFormData) => {
  // バリアントなし商品の場合、optionsとvariantsは空配列
  return {
    name: formData.name,
    description: formData.description,
    categoryId: formData.categoryId,
    status: formData.status,
    options: [],
    variants: [],
  };
};
