import { z } from 'zod';

/**
 * SKU（Stock Keeping Unit）の制約（ブランド型なし）
 * 英数字、ハイフン、アンダースコアのみ使用可能
 * 最大50文字
 * フォーム用にはこちらを使用
 */
export const SKUSchema = z
  .string()
  .min(1, 'SKUを入力してください')
  .max(50, 'SKUは50文字以内である必要があります')
  .trim()
  .regex(/^[A-Za-z0-9\-_]+$/, 'SKUは英数字、ハイフン、アンダースコアのみ使用できます');

/**
 * SKUスキーマ（ブランド型付き - API/ドメイン層用）
 */
export const SKUBrandSchema = SKUSchema.brand<'SKU'>();

/**
 * SKU型（ブランド型付き - API/ドメイン層用）
 */
export type SKU = z.output<typeof SKUBrandSchema>;

/**
 * SKU入力型（ブランド型なし - フォーム用）
 */
export type SKUInput = z.input<typeof SKUBrandSchema>;

/**
 * バーコードの制約（ブランド型なし）
 * JAN（Japanese Article Number）およびCODE39形式に対応
 * 使用可能文字: 英数字、ハイフン、ドット、$、/、+、%、スペース
 * 最大30文字
 */
export const BarcodeSchema = z
  .string()
  .min(1, 'バーコードを入力してください')
  .max(30, 'バーコードは30文字以内である必要があります')
  .trim()
  .regex(
    /^[A-Za-z0-9\-.$/ +%]+$/,
    'バーコードはJAN/CODE39形式（英数字、ハイフン、ドット、$、/、+、%、スペース）のみ使用できます',
  );

/**
 * バーコードスキーマ（ブランド型付き - API/ドメイン層用）
 */
export const BarcodeBrandSchema = BarcodeSchema.brand<'Barcode'>();

/**
 * バーコード型（ブランド型付き - API/ドメイン層用）
 */
export type Barcode = z.output<typeof BarcodeBrandSchema>;

/**
 * バーコード入力型（ブランド型なし - フォーム用）
 */
export type BarcodeInput = z.input<typeof BarcodeBrandSchema>;

/**
 * オプショナルなバーコード（空文字列・undefinedを許可）
 * 空文字列・undefinedは全てundefinedに正規化される
 * React Hook Formとの型互換性のため、nullは含まない
 */
export const OptionalBarcodeSchema = z
  .union([z.string().trim(), z.undefined()])
  .optional()
  .transform((val) => {
    // 空文字列、undefinedの場合はundefinedを返す
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
  );

export type OptionalBarcode = z.output<typeof OptionalBarcodeSchema>;
