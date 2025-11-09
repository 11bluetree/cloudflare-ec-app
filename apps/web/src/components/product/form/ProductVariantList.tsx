import type { UseFormRegister, FieldErrors } from 'react-hook-form';
import type { ProductFormData, Variant } from '../../../lib/schemas/product-form';
import { Badge, Button, Input } from '../../ui';

type ProductVariantListProps = {
  variants: Variant[];
  register: UseFormRegister<ProductFormData>;
  errors: FieldErrors<ProductFormData>;
  bulkPrice: string;
  onBulkPriceChange: (value: string) => void;
  onApplyBulkPrice: () => void;
};

/**
 * 商品バリアント一覧フォームコンポーネント
 */
export const ProductVariantList: React.FC<ProductVariantListProps> = ({
  variants,
  register,
  errors,
  bulkPrice,
  onBulkPriceChange,
  onApplyBulkPrice,
}) => {
  return (
    <div>
      <h3 className="mb-4 text-sm font-medium text-gray-700">バリアント一覧</h3>

      {/* 一括価格設定 */}
      <div className="mb-4 rounded-md bg-gray-50 p-4">
        <label className="mb-2 block text-sm text-gray-600">全バリアントに同じ価格を設定</label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={bulkPrice}
            onChange={(e) => onBulkPriceChange(e.target.value)}
            placeholder="価格"
            className="w-40"
            min="0"
          />
          <span className="text-gray-500">円</span>
          <Button type="button" onClick={onApplyBulkPrice}>
            一括設定
          </Button>
        </div>
      </div>

      {/* バリアント編集 */}
      <div className="space-y-3">
        {variants.map((variant, variantIndex) => {
          return (
            <div key={variantIndex} className="rounded-md border border-gray-300 p-4">
              <div className="mb-3 flex flex-wrap gap-2">
                <Badge variant="secondary">
                  {variant.options.map((opt, optIndex) => (
                    <span key={optIndex}>
                      {opt.optionName}: {opt.optionValue}
                      {optIndex < variant.options.length - 1 && <span>{'\u00A0/\u00A0'}</span>}
                    </span>
                  ))}
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="mb-1 block text-sm text-gray-600">SKU</label>
                  <Input
                    {...register(`variants.${variantIndex}.sku` as const)}
                    placeholder="SKU"
                    pattern="[A-Za-z0-9\-_]+"
                    title="英数字、ハイフン、アンダースコアのみ使用できます"
                  />
                  {errors.variants?.[variantIndex]?.sku && (
                    <p className="mt-1 text-sm text-red-500">{errors.variants[variantIndex].sku?.message}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-600">価格（円）</label>
                  <Input
                    type="number"
                    {...register(`variants.${variantIndex}.price` as const, {
                      valueAsNumber: true,
                    })}
                    placeholder="価格"
                    min="0"
                  />
                  {errors.variants?.[variantIndex]?.price && (
                    <p className="mt-1 text-sm text-red-500">{errors.variants[variantIndex].price?.message}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-600">バーコード（任意）</label>
                  <Input
                    {...register(`variants.${variantIndex}.barcode` as const)}
                    placeholder="バーコード"
                    pattern="[A-Za-z0-9\-.$/ +%]*"
                    title="英数字、ハイフン、ドット、$、/、+、%、スペースのみ使用できます"
                  />
                  {errors.variants?.[variantIndex]?.barcode && (
                    <p className="mt-1 text-sm text-red-500">{errors.variants[variantIndex].barcode?.message}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
