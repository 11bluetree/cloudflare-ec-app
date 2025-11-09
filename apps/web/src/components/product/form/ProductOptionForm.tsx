import { Badge, Button, Input } from '../../ui';
import type { ProductFormData } from '../../../lib/schemas/product-form';
import type { UseFormRegister, UseFormWatch } from 'react-hook-form';

type ProductOptionFormProps = {
  optionIndex: number;
  onRemoveOption: (index: number) => void;
  onAddValue: (index: number, value: string) => void;
  onRemoveValue: (optionIndex: number, valueIndex: number) => void;
  onOptionNameChange: (index: number, name: string) => void;
  register: UseFormRegister<ProductFormData>;
  watch: UseFormWatch<ProductFormData>;
};

/**
 * 商品オプション定義フォームコンポーネント
 */
export const ProductOptionForm: React.FC<ProductOptionFormProps> = ({
  optionIndex,
  onRemoveOption,
  onAddValue,
  onRemoveValue,
  onOptionNameChange,
  register,
  watch,
}) => {
  // 現在のオプション値をwatchで取得
  const currentValues = watch(`options.${optionIndex}.values`) || [];

  return (
    <div className="mb-4 rounded-md border border-gray-300 p-4">
      <div className="mb-3 flex items-center justify-between">
        <Input
          {...register(`options.${optionIndex}.optionName`)}
          placeholder="オプション名（例: サイズ、色）"
          className="flex-1"
          onBlur={(e) => onOptionNameChange(optionIndex, e.target.value)}
        />
        <Button type="button" onClick={() => onRemoveOption(optionIndex)} variant="destructive" className="ml-2">
          削除
        </Button>
      </div>

      <div className="space-y-3">
        <label className="block text-sm text-gray-600">値（例: S, M, L）</label>

        {/* 入力フィールド */}
        <div className="flex items-center gap-2">
          <Input
            type="text"
            placeholder="新しい値を入力"
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                const input = e.currentTarget;
                onAddValue(optionIndex, input.value);
                input.value = '';
              }
            }}
          />
          <Button
            type="button"
            onClick={(e) => {
              const button = e.currentTarget;
              const input = button.previousElementSibling;
              if (input instanceof HTMLInputElement) {
                onAddValue(optionIndex, input.value);
                input.value = '';
              }
            }}
          >
            追加
          </Button>
        </div>

        {/* バッジ表示 */}
        {currentValues.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {currentValues.map((val: { value: string; displayOrder: number }, valueIndex: number) => (
              <Badge key={valueIndex} variant="secondary" className="gap-2 pr-1">
                {val.value}
                <button
                  type="button"
                  onClick={() => onRemoveValue(optionIndex, valueIndex)}
                  className="ml-1 rounded-sm px-1 text-slate-500 hover:bg-slate-200 hover:text-slate-900"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
