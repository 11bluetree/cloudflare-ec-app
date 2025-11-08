/**
 * バリアント生成ユーティリティ
 * オプションの組み合わせからバリアントを自動生成する
 */

import type { Option, Variant, VariantOption } from '../schemas/product-form';

/**
 * オプションの組み合わせからバリアントを生成
 *
 * @param options オプション配列
 * @param basePrice デフォルト価格（一括設定用）
 * @param skuPrefix SKUのプレフィックス
 * @returns 生成されたバリアント配列
 */
export function generateVariants(options: Option[], basePrice: number = 0, skuPrefix: string = 'VAR'): Variant[] {
  if (options.length === 0) {
    // オプションがない場合はデフォルトバリアントを返す
    return [
      {
        sku: `${skuPrefix}-DEFAULT`,
        price: basePrice,
        barcode: null,
        options: [
          {
            optionName: 'title',
            optionValue: 'default',
            displayOrder: 1,
          },
        ],
        displayOrder: 1,
      },
    ];
  }

  // オプション値の配列を取得
  const optionValueArrays = options.map((option) =>
    option.values.map((v) => ({
      optionName: option.optionName,
      optionValue: v.value,
      displayOrder: option.displayOrder,
    })),
  );

  // デカルト積を計算（全組み合わせ）
  const combinations = cartesianProduct(optionValueArrays);

  // バリアントを生成
  return combinations.map((combination, index) => {
    // SKUを生成（オプション値の頭文字を使用）
    const skuSuffix = combination.map((opt) => opt.optionValue.substring(0, 3).toUpperCase()).join('-');
    const sku = `${skuPrefix}-${skuSuffix}-${String(index + 1).padStart(3, '0')}`;

    return {
      sku,
      price: basePrice,
      barcode: null,
      options: combination,
      displayOrder: index + 1,
    };
  });
}

/**
 * デカルト積を計算（配列の全組み合わせ）
 *
 * @param arrays 配列の配列
 * @returns 全組み合わせの配列
 */
function cartesianProduct<T>(arrays: T[][]): T[][] {
  if (arrays.length === 0) return [[]];
  if (arrays.length === 1) return arrays[0].map((item) => [item]);

  const [first, ...rest] = arrays;
  const restProduct = cartesianProduct(rest);

  return first.flatMap((item) => restProduct.map((restItems) => [item, ...restItems]));
}

/**
 * バリアント名を生成（表示用）
 *
 * @param variantOptions バリアントオプション配列
 * @returns "赤 / L" のような文字列
 */
export function generateVariantName(variantOptions: VariantOption[]): string {
  if (!variantOptions || variantOptions.length === 0) {
    return 'デフォルト';
  }

  if (variantOptions.length === 1 && variantOptions[0].optionName === 'title') {
    return 'デフォルト';
  }

  return variantOptions
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((opt) => opt.optionValue)
    .join(' / ');
}

/**
 * バリアント総数を計算
 *
 * @param options オプション配列
 * @returns バリアント総数
 */
export function calculateVariantCount(options: Option[]): number {
  if (options.length === 0) return 1;

  return options.reduce((count, option) => count * option.values.length, 1);
}
