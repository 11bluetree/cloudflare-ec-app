import { Button, FormSection, RadioGroup, RadioGroupItem, Label } from '../../ui';
import { ProductOptionForm } from './ProductOptionForm';
import type { Option, ProductFormData } from '../../../lib/schemas/product-form';
import type { UseFormRegister, UseFormWatch, FieldErrors } from 'react-hook-form';

type ProductOptionsFormProps = {
  hasOptions: boolean;
  onHasOptionsChange: (value: boolean) => void;
  options: Option[];
  onAddOption: () => void;
  onRemoveOption: (index: number) => void;
  onAddOptionValue: (optionIndex: number, value: string) => void;
  onRemoveOptionValue: (optionIndex: number, valueIndex: number) => void;
  onOptionNameChange: (index: number, name: string) => void;
  onReorderOptionValues: (optionIndex: number, newValues: { value: string; displayOrder: number }[]) => void;
  onGenerateVariants: () => void;
  showVariantForm: boolean;
  status: 'draft' | 'published';
  variantCount: number;
  register: UseFormRegister<ProductFormData>;
  watch: UseFormWatch<ProductFormData>;
  errors: FieldErrors<ProductFormData>;
};

/**
 * 商品オプション設定フォームコンポーネント
 */
export const ProductOptionsForm: React.FC<ProductOptionsFormProps> = ({
  hasOptions,
  onHasOptionsChange,
  options,
  onAddOption,
  onRemoveOption,
  onAddOptionValue,
  onRemoveOptionValue,
  onOptionNameChange,
  onReorderOptionValues,
  onGenerateVariants,
  showVariantForm,
  status,
  variantCount,
  register,
  watch,
  errors,
}) => {
  const renderVariantGenerationArea = () => {
    if (showVariantForm) return null;

    // watchで現在のオプションの値を取得
    const currentOptions = watch('options');
    const hasValidOptions = currentOptions.some((opt) => opt.optionName && opt.values.length > 0);

    if (!hasValidOptions) return null;

    return (
      <div className="mt-4 rounded-md border-2 border-blue-200 bg-blue-50 p-4">
        <p className="mb-3 text-sm font-semibold text-gray-700">合計: {variantCount} 個のバリアント</p>

        {status === 'draft' ? (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">下書きの場合、バリアントは後で登録できます</p>
            <div className="flex gap-2">
              <Button type="button" onClick={onGenerateVariants} variant="primary">
                続けてバリアントを登録する
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-medium text-orange-700">公開ステータスの場合、バリアントの登録が必要です</p>
            <Button type="button" onClick={onGenerateVariants} variant="primary">
              バリアントを作成する
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <FormSection title="商品オプション">
      {/* オプション有無の選択 */}
      <div className="mb-6">
        <Label className="mb-2 block">この商品にオプション（サイズ・色など）はありますか？</Label>
        <RadioGroup value={hasOptions ? 'yes' : 'no'} onValueChange={(value) => onHasOptionsChange(value === 'yes')}>
          <div className="flex gap-4">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id="options-no" />
              <Label htmlFor="options-no" className="font-normal">
                いいえ（単一商品）
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id="options-yes" />
              <Label htmlFor="options-yes" className="font-normal">
                はい（この商品には種類があります）
              </Label>
            </div>
          </div>
        </RadioGroup>
      </div>

      {hasOptions && (
        <div className="space-y-6">
          {/* オプション定義 */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700">オプション定義</h3>
              <Button type="button" onClick={onAddOption}>
                + オプションを追加
              </Button>
            </div>

            {/* バリデーションエラーメッセージ */}
            {errors.options && Array.isArray(errors.options) && errors.options.length > 0 && (
              <p className="mb-4 text-sm text-red-600">オプション名と値を入力してください</p>
            )}

            {options.map((_option, optionIndex) => (
              <ProductOptionForm
                key={optionIndex}
                optionIndex={optionIndex}
                onRemoveOption={onRemoveOption}
                onAddValue={onAddOptionValue}
                onRemoveValue={onRemoveOptionValue}
                onOptionNameChange={onOptionNameChange}
                onReorderValues={onReorderOptionValues}
                register={register}
                watch={watch}
              />
            ))}

            {/* バリアント作成フロー */}
            {options.length > 0 && renderVariantGenerationArea()}

            {/* バリアント不足のエラーメッセージ */}
            {errors.variants?.root?.message && (
              <p className="mt-4 text-sm text-red-600">{errors.variants.root.message}</p>
            )}
          </div>
        </div>
      )}
    </FormSection>
  );
};
