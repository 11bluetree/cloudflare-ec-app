import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { CreateProductRequest } from '@cloudflare-ec-app/types';
import { createProduct } from '../../../lib/api/products';
import { useProductForm } from '../../../lib/hooks/useProductForm';
import { useCategorySelector } from '../../../lib/hooks/useCategorySelector';
import { calculateVariantCount } from '../../../lib/utils/variant-generator';
import {
  ProductBasicForm,
  ProductOptionsForm,
  SingleProductForm,
  ProductVariantList,
} from '../../../components/product/form';
import { Button, FormSection } from '../../../components/ui';

export const Route = createFileRoute('/admin/products/new')({
  component: ProductNewPage,
});

function ProductNewPage() {
  const navigate = useNavigate();

  // 商品フォームのカスタムフック
  const {
    form,
    hasOptions,
    bulkPrice,
    showVariantForm,
    optionFields,
    variantFields,
    setBulkPrice,
    handleHasOptionsChange,
    handleGenerateVariants,
    handleAddOption,
    handleRemoveOption,
    handleAddOptionValue,
    handleRemoveOptionValue,
    handleApplyBulkPrice,
    handleOptionNameChange,
  } = useProductForm();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = form;

  // カテゴリー選択のカスタムフック
  const { selectedCategories, categoryLevels, isCategoriesLoading, handleCategoryChange, findCategoryById } =
    useCategorySelector((categoryId) => {
      setValue('categoryId', categoryId, {
        shouldValidate: false,
      });
    });

  // 商品登録のミューテーション
  const createProductMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: (data) => {
      toast.success('商品を登録しました', {
        description: `商品ID: ${data.id}`,
      });
      navigate({
        to: '/products',
      });
    },
    onError: (error: Error) => {
      toast.error('商品の登録に失敗しました', {
        description: error.message,
      });
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    // 公開ステータスでオプションありの場合、バリアントが必須
    if (data.status === 'published' && data.hasOptions) {
      if (data.variants.length === 0) {
        toast.error('公開ステータスの場合、バリアントを作成してください');
        return;
      }
    }

    const requestData = {
      name: data.name,
      description: data.description,
      categoryId: data.categoryId,
      status: data.status,
      options: data.hasOptions
        ? data.options.map((opt) => ({
            optionName: opt.optionName,
            displayOrder: opt.displayOrder,
          }))
        : [
            {
              optionName: 'title',
              displayOrder: 1,
            },
          ],
      variants: data.variants.map((variant) => ({
        sku: variant.sku,
        barcode: variant.barcode || undefined,
        imageUrl: null,
        price: variant.price,
        displayOrder: variant.displayOrder,
        options: variant.options.map((opt) => ({
          optionName: opt.optionName,
          optionValue: opt.optionValue,
          displayOrder: opt.displayOrder,
        })),
      })),
    };
    // SKUはフロントエンドではstring型だが、API層でブランド型（SKUBrand）にバリデーションされる
    // 型アサーションが必要なため、この行のみルールを無効化
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    await createProductMutation.mutateAsync(requestData as CreateProductRequest);
  });

  const nameLength = watch('name')?.length || 0;
  const descriptionLength = watch('description')?.length || 0;
  const status = watch('status');

  // バリアントカウントの計算
  const variantCount = hasOptions ? calculateVariantCount(watch('options')) : 0;

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">商品登録</h1>
        <p className="mt-2 text-gray-600">新しい商品を登録します</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-8">
        {/* 基本情報 */}
        <ProductBasicForm
          register={register}
          errors={errors}
          nameLength={nameLength}
          descriptionLength={descriptionLength}
          status={status}
          selectedCategories={selectedCategories}
          categoryLevels={categoryLevels}
          isCategoriesLoading={isCategoriesLoading}
          onCategoryChange={handleCategoryChange}
          findCategoryById={findCategoryById}
        />

        {/* オプション設定 */}
        <FormSection title="商品オプション">
          <ProductOptionsForm
            hasOptions={hasOptions}
            onHasOptionsChange={handleHasOptionsChange}
            options={optionFields}
            onAddOption={handleAddOption}
            onRemoveOption={handleRemoveOption}
            onAddOptionValue={handleAddOptionValue}
            onRemoveOptionValue={handleRemoveOptionValue}
            onOptionNameChange={handleOptionNameChange}
            onGenerateVariants={handleGenerateVariants}
            showVariantForm={showVariantForm}
            status={status}
            variantCount={variantCount}
            register={register}
            watch={watch}
          />

          {/* 単一商品フォーム */}
          {!hasOptions && <SingleProductForm register={register} errors={errors} />}

          {/* バリアント一覧 */}
          {hasOptions && showVariantForm && variantFields.length > 0 && (
            <ProductVariantList
              variants={variantFields}
              register={register}
              errors={errors}
              bulkPrice={bulkPrice}
              onBulkPriceChange={setBulkPrice}
              onApplyBulkPrice={handleApplyBulkPrice}
            />
          )}
        </FormSection>

        {/* フォームアクション */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              navigate({
                to: '/products',
              })
            }
          >
            キャンセル
          </Button>
          <Button type="submit" disabled={isSubmitting || createProductMutation.isPending}>
            {isSubmitting || createProductMutation.isPending ? '登録中...' : '登録する'}
          </Button>
        </div>
      </form>
    </div>
  );
}
