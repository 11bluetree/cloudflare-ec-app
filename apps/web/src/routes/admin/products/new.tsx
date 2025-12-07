import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { CreateProductRequest } from '@cloudflare-ec-app/types';
import { createProduct, createProductWithImages } from '../../../lib/api/products';
import { useProductForm } from '../../../lib/hooks/useProductForm';
import { useCategorySelector } from '../../../lib/hooks/useCategorySelector';
import { calculateVariantCount } from '../../../lib/utils/variant-generator';
import {
  ProductBasicForm,
  ProductOptionsForm,
  SingleProductForm,
  ProductVariantList,
  ProductImageUpload,
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
    images,
    setImages,
    setBulkPrice,
    handleHasOptionsChange,
    handleGenerateVariants,
    handleAddOption,
    handleRemoveOption,
    handleAddOptionValue,
    handleRemoveOptionValue,
    handleApplyBulkPrice,
    handleOptionNameChange,
    handleReorderOptionValues,
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
    mutationFn: async (params: { data: CreateProductRequest; images: File[] }) => {
      if (params.images.length > 0) {
        return createProductWithImages(params.data, params.images);
      }
      return createProduct(params.data);
    },
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
    // 下書きの場合、SKU/価格が未入力のバリアントは除外
    const filteredVariants =
      data.status === 'draft'
        ? data.variants.filter((v) => v.sku && v.sku.trim() !== '' && v.price !== undefined && v.price > 0)
        : data.variants;

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
      variants: filteredVariants.map((variant) => ({
        sku: variant.sku,
        barcode: variant.barcode || undefined,
        imageUrl: null,
        imageIndex: variant.imageIndex,
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
    await createProductMutation.mutateAsync({
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      data: requestData as CreateProductRequest,
      images,
    });
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
          setValue={setValue}
        />

        {/* 商品画像 */}
        <FormSection title="商品画像">
          <ProductImageUpload images={images} onChange={setImages} />
        </FormSection>

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
            onReorderOptionValues={handleReorderOptionValues}
            onGenerateVariants={handleGenerateVariants}
            showVariantForm={showVariantForm}
            status={status}
            variantCount={variantCount}
            register={register}
            watch={watch}
            errors={errors}
          />

          {/* 単一商品フォーム */}
          {!hasOptions && <SingleProductForm register={register} errors={errors} status={status} />}

          {/* バリアント一覧 */}
          {hasOptions && showVariantForm && variantFields.length > 0 && (
            <ProductVariantList
              variants={variantFields}
              register={register}
              errors={errors}
              bulkPrice={bulkPrice}
              onBulkPriceChange={setBulkPrice}
              onApplyBulkPrice={handleApplyBulkPrice}
              images={images}
              setValue={setValue}
              watch={watch}
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
