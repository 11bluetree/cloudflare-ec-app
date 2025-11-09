/**
 * 商品登録フォームのスキーマ定義
 */

import { z } from 'zod';
import { SKUSchema, OptionalBarcodeSchema } from '@cloudflare-ec-app/types';

/**
 * オプション値のスキーマ
 */
const optionValueSchema = z.object({
  value: z.string().min(1, 'オプション値を入力してください').max(50, 'オプション値は50文字以内で入力してください'),
  displayOrder: z.number(),
});

/**
 * オプション定義のスキーマ
 */
const optionSchema = z.object({
  optionName: z.string().min(1, 'オプション名を入力してください').max(50, 'オプション名は50文字以内で入力してください'),
  values: z
    .array(optionValueSchema)
    .min(1, '最低1つのオプション値が必要です')
    .max(50, 'オプション値は最大50個までです'),
  displayOrder: z.number(),
});

/**
 * バリアントオプションのスキーマ
 */
const variantOptionSchema = z.object({
  optionName: z.string(),
  optionValue: z.string(),
  displayOrder: z.number(),
});

/**
 * バリアントのスキーマ
 */
const variantSchema = z.object({
  sku: SKUSchema, // ブランド型なしのSKU制約を使用
  price: z
    .number('価格は数値で入力してください')
    .int('価格は整数で入力してください')
    .min(0, '価格は0円以上で入力してください')
    .max(999999, '価格は999,999円以下で入力してください'),
  barcode: z
    .union([z.string(), z.undefined()])
    .transform((val) => {
      if (!val || val === '') return undefined;
      return val;
    })
    .pipe(
      z.union([
        z.undefined(),
        z
          .string()
          .max(30, 'バーコードは30文字以内である必要があります')
          .regex(
            /^[A-Za-z0-9\-.$/ +%]+$/,
            'バーコードはJAN/CODE39形式（英数字、ハイフン、ドット、$、/、+、%、スペース）のみ使用できます',
          ),
      ]),
    ),
  options: z.array(variantOptionSchema),
  displayOrder: z.number(),
});

/**
 * 商品登録フォームのスキーマ（オプション対応版）
 */
export const productFormSchema = z.object({
  // 基本情報
  name: z.string().min(1, '商品名を入力してください').max(200, '商品名は200文字以内で入力してください').trim(),

  description: z
    .string()
    .min(1, '商品説明を入力してください')
    .max(4096, '商品説明は4096文字以内で入力してください')
    .trim(),

  categoryId: z.string().length(26, 'カテゴリーを選択してください'),

  status: z.enum(['draft', 'published'], { message: 'ステータスを選択してください' }),

  // オプション設定
  hasOptions: z.boolean(),
  options: z.array(optionSchema).max(5, 'オプションは最大5個までです'),

  // バリアント
  variants: z.array(variantSchema).min(1, '最低1つのバリアントが必要です').max(100, 'バリアントは最大100個までです'),
});

export type ProductFormData = z.infer<typeof productFormSchema>;
export type OptionValue = z.infer<typeof optionValueSchema>;
export type Option = z.infer<typeof optionSchema>;
export type VariantOption = z.infer<typeof variantOptionSchema>;
export type Variant = z.infer<typeof variantSchema>;

/**
 * Phase 1用: シンプルな商品登録フォームのスキーマ（後方互換性のため残す）
 */
export const simpleProductFormSchema = z.object({
  name: z.string().min(1, '商品名を入力してください').max(200, '商品名は200文字以内で入力してください').trim(),
  description: z
    .string()
    .min(1, '商品説明を入力してください')
    .max(4096, '商品説明は4096文字以内で入力してください')
    .trim(),
  categoryId: z.string().length(26, 'カテゴリーを選択してください'),
  status: z.enum(['draft', 'published'], 'ステータスを選択してください'),
  sku: SKUSchema, // ブランド型なしのSKU制約を使用
  price: z
    .number('価格は数値で入力してください')
    .int('価格は整数で入力してください')
    .min(0, '価格は0円以上で入力してください')
    .max(999999, '価格は999,999円以下で入力してください'),
  barcode: OptionalBarcodeSchema,
});

export type SimpleProductFormData = z.infer<typeof simpleProductFormSchema>;

/**
 * フォームデータをAPI送信用のリクエストに変換
 * ※ この関数は現在未使用（new.tsxで直接リクエストを構築している）
 */
export const convertToCreateProductRequest = (formData: SimpleProductFormData) => {
  // デフォルトバリアント（title:default）を自動作成
  return {
    name: formData.name,
    description: formData.description,
    categoryId: formData.categoryId,
    status: formData.status,
    options: [{ optionName: 'title', displayOrder: 1 }],
    variants: [
      {
        sku: formData.sku,
        barcode: formData.barcode || null,
        imageUrl: null,
        price: formData.price,
        displayOrder: 1,
        options: [{ optionName: 'title', optionValue: 'default', displayOrder: 1 }],
      },
    ],
  };
};
