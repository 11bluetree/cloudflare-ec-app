import type { UseFormRegister, FieldErrors } from 'react-hook-form';
import type { ProductFormData } from '../../../lib/schemas/product-form';
import { FormField, FormSection, Input, Textarea, RadioGroup, RadioGroupItem, Label } from '../../ui';

type ProductBasicFormProps = {
  register: UseFormRegister<ProductFormData>;
  errors: FieldErrors<ProductFormData>;
  nameLength: number;
  descriptionLength: number;
  status: 'draft' | 'published';
  selectedCategories: string[];
  categoryLevels: Array<
    { id: string; name: string; children?: Array<{ id: string; name: string; children?: unknown[] }> }[]
  >;
  isCategoriesLoading: boolean;
  onCategoryChange: (levelIndex: number, value: string) => void;
  findCategoryById: (id: string) => { name: string } | null;
};

/**
 * 商品基本情報フォームコンポーネント
 */
export const ProductBasicForm: React.FC<ProductBasicFormProps> = ({
  register,
  errors,
  nameLength,
  descriptionLength,
  status,
  selectedCategories,
  categoryLevels,
  isCategoriesLoading,
  onCategoryChange,
  findCategoryById,
}) => {
  return (
    <FormSection title="基本情報">
      <div className="space-y-6">
        {/* 商品名 */}
        <FormField label="商品名" required error={errors.name?.message} htmlFor="name">
          <Input
            id="name"
            type="text"
            placeholder="例: ベーシックTシャツ"
            {...register('name')}
            className={errors.name ? 'border-red-500' : ''}
          />
          <div className="mt-1 text-right">
            <p className="text-sm text-gray-500">{nameLength} / 200</p>
          </div>
        </FormField>

        {/* 商品説明 */}
        <FormField label="商品説明" required error={errors.description?.message} htmlFor="description">
          <Textarea
            id="description"
            rows={6}
            placeholder="商品の詳しい説明を入力してください"
            {...register('description')}
            className={errors.description ? 'border-red-500' : ''}
          />
          <div className="mt-1 text-right">
            <p className="text-sm text-gray-500">{descriptionLength} / 4096</p>
          </div>
        </FormField>

        {/* カテゴリー */}
        <FormField label="カテゴリー" required error={errors.categoryId?.message}>
          <input type="hidden" {...register('categoryId')} />
          <div className="space-y-3">
            {categoryLevels.map((level, levelIndex) => (
              <div key={levelIndex}>
                <select
                  disabled={isCategoriesLoading}
                  value={selectedCategories[levelIndex] || ''}
                  onChange={(e) => onCategoryChange(levelIndex, e.target.value)}
                  className={`w-full rounded-md border px-4 py-2 focus:outline-none focus:ring-2 ${errors.categoryId && levelIndex === 0 ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                >
                  <option value="">
                    {levelIndex === 0 ? '大カテゴリーを選択' : `第${levelIndex + 1}階層を選択（任意）`}
                  </option>
                  {level.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          {selectedCategories.length > 0 && (
            <p className="mt-2 text-sm text-gray-600">
              選択中:{' '}
              {selectedCategories
                .map((id) => {
                  const cat = findCategoryById(id);
                  return cat?.name || '';
                })
                .join(' > ')}
            </p>
          )}
        </FormField>

        {/* ステータス */}
        <FormField label="ステータス" required error={errors.status?.message}>
          <RadioGroup value={status} onValueChange={(value) => register('status').onChange({ target: { value } })}>
            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="draft" id="status-draft" />
                <Label htmlFor="status-draft" className="font-normal">
                  下書き
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="published" id="status-published" />
                <Label htmlFor="status-published" className="font-normal">
                  公開
                </Label>
              </div>
            </div>
          </RadioGroup>
        </FormField>
      </div>
    </FormSection>
  );
};
