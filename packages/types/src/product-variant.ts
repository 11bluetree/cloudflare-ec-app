import { z } from 'zod';

/**
 * SKU（Stock Keeping Unit）
 * 英数字、ハイフン、アンダースコアのみ使用可能
 * 最大50文字
 */
export const SKUSchema = z
  .string()
  .min(1, 'SKUを入力してください')
  .max(50, 'SKUは50文字以内である必要があります')
  .trim()
  .regex(/^[A-Za-z0-9\-_]+$/, 'SKUは英数字、ハイフン、アンダースコアのみ使用できます')
  .brand<'SKU'>();

export type SKU = z.infer<typeof SKUSchema>;

/**
 * バーコード
 * JAN（Japanese Article Number）およびCODE39形式に対応
 * 使用可能文字: 英数字、ハイフン、ドット、$、/、+、%、スペース
 * 最大30文字
 */
export const BarcodeSchema = z
  .string()
  .max(30, 'バーコードは30文字以内である必要があります')
  .regex(
    /^[A-Za-z0-9\-.$/ +%]+$/,
    'バーコードはJAN/CODE39形式（英数字、ハイフン、ドット、$、/、+、%、スペース）のみ使用できます',
  )
  .brand<'Barcode'>();

export type Barcode = z.infer<typeof BarcodeSchema>;

/**
 * オプショナルなバーコード（null許可）
 */
export const OptionalBarcodeSchema = BarcodeSchema.nullable().optional();

export type OptionalBarcode = z.infer<typeof OptionalBarcodeSchema>;
