import type { UseFormRegister, FieldErrors } from 'react-hook-form';
import type { ProductFormData } from '../../../lib/schemas/product-form';
import { FormField, Input } from '../../ui';

type SingleProductFormProps = {
  register: UseFormRegister<ProductFormData>;
  errors: FieldErrors<ProductFormData>;
};

/**
 * 単一商品（オプションなし）フォームコンポーネント
 */
export const SingleProductForm: React.FC<SingleProductFormProps> = ({ register, errors }) => {
  return (
    <div className="space-y-6">
      <FormField label="SKU" required error={errors.variants?.[0]?.sku?.message} htmlFor="variant-sku">
        <Input
          id="variant-sku"
          {...register('variants.0.sku')}
          placeholder="例: BASIC-001"
          pattern="[A-Za-z0-9\-_]+"
          title="英数字、ハイフン、アンダースコアのみ使用できます"
        />
      </FormField>

      <FormField label="価格（円）" required error={errors.variants?.[0]?.price?.message} htmlFor="variant-price">
        <div className="relative">
          <Input
            id="variant-price"
            type="number"
            {...register('variants.0.price', {
              valueAsNumber: true,
            })}
            placeholder="2980"
            min="0"
            max="999999"
            className="pr-12"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">円</span>
        </div>
      </FormField>

      <FormField label="バーコード（任意）" error={errors.variants?.[0]?.barcode?.message} htmlFor="variant-barcode">
        <Input
          id="variant-barcode"
          {...register('variants.0.barcode')}
          placeholder="例: 4901234567890"
          pattern="[A-Za-z0-9\-.$/ +%]*"
          title="英数字、ハイフン、ドット、$、/、+、%、スペースのみ使用できます"
        />
      </FormField>
    </div>
  );
};
