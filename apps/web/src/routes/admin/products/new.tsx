import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { Badge } from '../../../components/ui/badge';
import { productFormSchema, type ProductFormData } from '../../../lib/schemas/product-form';
import { createProduct } from '../../../lib/api/products';
import { fetchCategories } from '../../../lib/api/categories';
import type { CategoryTreeNode } from '@cloudflare-ec-app/types';
import { generateVariants, calculateVariantCount } from '../../../lib/utils/variant-generator';

export const Route = createFileRoute('/admin/products/new')({
  component: ProductNewPage,
});

function ProductNewPage() {
  const navigate = useNavigate();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [hasOptions, setHasOptions] = useState(false);
  const [bulkPrice, setBulkPrice] = useState<string>('');
  const [showVariantForm, setShowVariantForm] = useState(false);

  const { data: categoryData, isLoading: isCategoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  // 指定されたIDのカテゴリーを見つける
  const findCategoryById = (nodes: CategoryTreeNode[], id: string): CategoryTreeNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findCategoryById(node.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  // 選択されたカテゴリーから階層を構築
  const buildCategoryLevels = (): CategoryTreeNode[][] => {
    if (!categoryData) return [];

    const levels: CategoryTreeNode[][] = [];
    levels.push(categoryData.categories); // 第1階層

    for (const selectedId of selectedCategories) {
      const category = findCategoryById(categoryData.categories, selectedId);
      if (category?.children && category.children.length > 0) {
        levels.push(category.children);
      }
    }

    return levels;
  };

  const categoryLevels = buildCategoryLevels();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    control,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: '',
      description: '',
      categoryId: '',
      status: 'draft',
      hasOptions: false,
      options: [],
      variants: [
        {
          sku: '',
          price: 0,
          barcode: undefined,
          options: [
            {
              optionName: 'title',
              optionValue: 'default',
              displayOrder: 1,
            },
          ],
          displayOrder: 1,
        },
      ],
    } satisfies ProductFormData,
  });

  const {
    fields: optionFields,
    append: appendOption,
    remove: removeOption,
  } = useFieldArray({
    control,
    name: 'options',
  });

  const { fields: variantFields, replace: replaceVariants } = useFieldArray({
    control,
    name: 'variants',
  });

  // 選択されたカテゴリーが変更されたら、最後に選択されたIDをフォームにセット
  useEffect(() => {
    if (selectedCategories.length > 0) {
      const lastSelectedId = selectedCategories[selectedCategories.length - 1];
      setValue('categoryId', lastSelectedId, {
        shouldValidate: false,
      });
    } else {
      setValue('categoryId', '', {
        shouldValidate: false,
      });
    }
  }, [selectedCategories, setValue]);

  // オプション有無の切り替え
  const handleHasOptionsChange = (value: boolean) => {
    setHasOptions(value);
    setValue('hasOptions', value);
    if (!value) {
      setValue('options', []);
      replaceVariants([
        {
          sku: '',
          price: 0,
          barcode: undefined,
          options: [
            {
              optionName: 'title',
              optionValue: 'default',
              displayOrder: 1,
            },
          ],
          displayOrder: 1,
        },
      ]);
      setShowVariantForm(false);
    } else {
      // 複数商品を選択したら、デフォルトで1つのオプションを追加
      setValue('options', [
        {
          optionName: '',
          values: [],
          displayOrder: 1,
        },
      ]);
      replaceVariants([]);
      setShowVariantForm(false);
    }
  };

  // バリアント自動生成
  const handleGenerateVariants = () => {
    const options = watch('options');
    if (options.length === 0) {
      toast.error('オプションを追加してください');
      return;
    }

    // オプション名や値が空でないかチェック
    for (const option of options) {
      if (!option.optionName.trim()) {
        toast.error('オプション名を入力してください');
        return;
      }
      if (option.values.length === 0) {
        toast.error(`「${option.optionName}」の値を追加してください`);
        return;
      }
    }

    const variantCount = calculateVariantCount(options);
    if (variantCount > 100) {
      toast.error('バリアントは最大100個までです', {
        description: `現在の組み合わせ: ${variantCount}個`,
      });
      return;
    }
    const basePrice = bulkPrice ? parseInt(bulkPrice, 10) : 0;
    const newVariants = generateVariants(options, basePrice);
    replaceVariants(newVariants);
    setShowVariantForm(true);
    toast.success(`${newVariants.length}個のバリアントを生成しました`);
  };

  // オプション追加
  const handleAddOption = () => {
    if (optionFields.length >= 5) {
      toast.error('オプションは最大5個までです');
      return;
    }
    appendOption({
      optionName: '',
      values: [],
      displayOrder: optionFields.length + 1,
    });
  };

  // オプション削除
  const handleRemoveOption = (optionIndex: number) => {
    removeOption(optionIndex);
  };

  // オプション値追加
  const handleAddOptionValue = (optionIndex: number, value: string) => {
    const trimmedValue = value.trim();
    if (!trimmedValue) return;
    const option = watch(`options.${optionIndex}`);
    const existingValues = option.values || [];
    if (existingValues.some((v) => v.value === trimmedValue)) {
      toast.error('同じ値が既に存在します');
      return;
    }
    if (existingValues.length >= 50) {
      toast.error('オプション値は最大50個までです');
      return;
    }
    setValue(`options.${optionIndex}.values`, [
      ...existingValues,
      {
        value: trimmedValue,
        displayOrder: existingValues.length + 1,
      },
    ]);

    // バリアントが既に生成されている場合は再生成
    if (showVariantForm) {
      const options = watch('options');
      const basePrice = bulkPrice ? parseInt(bulkPrice, 10) : 0;
      const newVariants = generateVariants(options, basePrice);
      replaceVariants(newVariants);
      toast.success('バリアントを再生成しました');
    }
  };

  // オプション値削除
  const handleRemoveOptionValue = (optionIndex: number, valueIndex: number) => {
    const option = watch(`options.${optionIndex}`);
    const updatedValues = option.values.filter((_, index) => index !== valueIndex);
    setValue(`options.${optionIndex}.values`, updatedValues);

    // バリアントが既に生成されている場合は再生成
    if (showVariantForm) {
      const options = watch('options');
      const basePrice = bulkPrice ? parseInt(bulkPrice, 10) : 0;
      const newVariants = generateVariants(options, basePrice);
      replaceVariants(newVariants);
      toast.success('バリアントを再生成しました');
    }
  };

  // 一括価格適用
  const handleApplyBulkPrice = () => {
    const price = parseInt(bulkPrice, 10);
    if (isNaN(price) || price < 0 || price > 999999) {
      toast.error('正しい価格を入力してください（0〜999,999円）');
      return;
    }
    variantFields.forEach((_, index) => setValue(`variants.${index}.price`, price));
    toast.success('全バリアントに価格を適用しました');
  };

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

  const onSubmit = async (data: ProductFormData) => {
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
        sku: variant.sku, // フォームではSKUSchema、APIではSKUBrandSchemaで再バリデーション
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
    // API層でSKUBrandSchemaにより再バリデーションされる
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/consistent-type-assertions
    await createProductMutation.mutateAsync(requestData as any);
  };

  const nameLength = watch('name')?.length || 0;
  const descriptionLength = watch('description')?.length || 0;
  const status = watch('status');

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">商品登録</h1>
        <p className="mt-2 text-gray-600">新しい商品を登録します</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-6 text-xl font-semibold">基本情報</h2>
          <div className="space-y-6">
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-700">
                商品名 <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                {...register('name')}
                className={`w-full rounded-md border px-4 py-2 focus:outline-none focus:ring-2 ${errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                placeholder="例: ベーシックTシャツ"
              />
              <div className="mt-1 flex items-center justify-between">
                <div>{errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}</div>
                <p className="text-sm text-gray-500">{nameLength} / 200</p>
              </div>
            </div>

            <div>
              <label htmlFor="description" className="mb-2 block text-sm font-medium text-gray-700">
                商品説明 <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                {...register('description')}
                rows={6}
                className={`w-full rounded-md border px-4 py-2 focus:outline-none focus:ring-2 ${errors.description ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                placeholder="商品の詳しい説明を入力してください"
              />
              <div className="mt-1 flex items-center justify-between">
                <div>{errors.description && <p className="text-sm text-red-600">{errors.description.message}</p>}</div>
                <p className="text-sm text-gray-500">{descriptionLength} / 4096</p>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                カテゴリー <span className="text-red-500">*</span>
              </label>
              <input type="hidden" {...register('categoryId')} />
              <div className="space-y-3">
                {categoryLevels.map((level, levelIndex) => (
                  <div key={levelIndex}>
                    <select
                      disabled={isCategoriesLoading}
                      value={selectedCategories[levelIndex] || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value) {
                          // 現在の階層までを保持し、それ以降をクリア
                          const newSelected = selectedCategories.slice(0, levelIndex);
                          newSelected.push(value);
                          setSelectedCategories(newSelected);
                        } else {
                          // 選択解除した場合、この階層以降をクリア
                          setSelectedCategories(selectedCategories.slice(0, levelIndex));
                        }
                      }}
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
              {errors.categoryId && <p className="mt-1 text-sm text-red-600">{errors.categoryId.message}</p>}
              {selectedCategories.length > 0 && (
                <p className="mt-2 text-sm text-gray-600">
                  選択中:{' '}
                  {selectedCategories
                    .map((id) => {
                      const cat = findCategoryById(categoryData!.categories, id);
                      return cat?.name || '';
                    })
                    .join(' > ')}
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                ステータス <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    {...register('status')}
                    value="draft"
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">下書き</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    {...register('status')}
                    value="published"
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">公開</span>
                </label>
              </div>
              {errors.status && <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>}
            </div>
          </div>
        </section>

        {/* オプション設定 */}
        <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-6 text-xl font-semibold">商品オプション</h2>

          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              この商品にオプション（サイズ・色など）はありますか？
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={!hasOptions}
                  onChange={() => handleHasOptionsChange(false)}
                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">いいえ（単一商品）</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={hasOptions}
                  onChange={() => handleHasOptionsChange(true)}
                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">はい（この商品には種類があります）</span>
              </label>
            </div>
          </div>

          {hasOptions ? (
            <div className="space-y-6">
              {/* オプション定義 */}
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-700">オプション定義</h3>
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    + オプションを追加
                  </button>
                </div>

                {optionFields.map((field, optionIndex) => (
                  <div key={field.id} className="mb-4 rounded-md border border-gray-300 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <input
                        {...register(`options.${optionIndex}.optionName` as const)}
                        placeholder="オプション名（例: サイズ、色）"
                        className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(optionIndex)}
                        className="ml-2 rounded-md bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700"
                      >
                        削除
                      </button>
                    </div>

                    <div className="space-y-3">
                      <label className="block text-sm text-gray-600">値（例: S, M, L）</label>

                      {/* 入力フィールド */}
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="新しい値を入力"
                          className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const input = e.currentTarget;
                              handleAddOptionValue(optionIndex, input.value);
                              input.value = '';
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            const button = e.currentTarget;
                            const input = button.previousElementSibling;
                            if (input instanceof HTMLInputElement) {
                              handleAddOptionValue(optionIndex, input.value);
                              input.value = '';
                            }
                          }}
                          className="rounded-md bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
                        >
                          追加
                        </button>
                      </div>

                      {/* バッジ表示 */}
                      {(() => {
                        const currentValues = watch(`options.${optionIndex}.values`) || [];
                        if (currentValues.length === 0) return null;
                        return (
                          <div className="flex flex-wrap gap-2">
                            {currentValues.map(
                              (
                                val: {
                                  value: string;
                                  displayOrder: number;
                                },
                                valueIndex: number,
                              ) => (
                                <Badge key={valueIndex} variant="secondary" className="gap-2 pr-1">
                                  {val.value}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveOptionValue(optionIndex, valueIndex)}
                                    className="ml-1 rounded-sm px-1 text-slate-500 hover:bg-slate-200 hover:text-slate-900"
                                  >
                                    ×
                                  </button>
                                </Badge>
                              ),
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                ))}

                {/* バリアント作成フロー */}
                {optionFields.length > 0 &&
                  !showVariantForm &&
                  (() => {
                    const currentOptions = watch('options');
                    const hasValidOptions = currentOptions.some((opt) => opt.optionName && opt.values.length > 0);

                    if (!hasValidOptions) return null;

                    const totalCount = calculateVariantCount(currentOptions);

                    return (
                      <div className="mt-4 rounded-md border-2 border-blue-200 bg-blue-50 p-4">
                        <p className="mb-3 text-sm font-semibold text-gray-700">合計: {totalCount} 個のバリアント</p>

                        {status === 'draft' ? (
                          <div className="space-y-2">
                            <p className="text-sm text-gray-600">下書きの場合、バリアントは後で登録できます</p>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={handleGenerateVariants}
                                className="rounded-md bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                              >
                                続けてバリアントを登録する
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-orange-700">
                              公開ステータスの場合、バリアントの登録が必要です
                            </p>
                            <button
                              type="button"
                              onClick={handleGenerateVariants}
                              className="rounded-md bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                              バリアントを作成する
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })()}
              </div>

              {/* バリアント一覧 */}
              {showVariantForm && variantFields.length > 0 && (
                <div>
                  <h3 className="mb-4 text-sm font-medium text-gray-700">バリアント一覧</h3>

                  {/* 一括価格設定 */}
                  <div className="mb-4 rounded-md bg-gray-50 p-4">
                    <label className="mb-2 block text-sm text-gray-600">全バリアントに同じ価格を設定</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={bulkPrice}
                        onChange={(e) => setBulkPrice(e.target.value)}
                        placeholder="価格"
                        className="w-40 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                      />
                      <span className="text-gray-500">円</span>
                      <button
                        type="button"
                        onClick={handleApplyBulkPrice}
                        className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
                      >
                        一括設定
                      </button>
                    </div>
                  </div>

                  {/* バリアント編集 */}
                  <div className="space-y-3">
                    {variantFields.map((field, variantIndex) => {
                      return (
                        <div key={field.id} className="rounded-md border border-gray-300 p-4">
                          <div className="mb-3 flex flex-wrap gap-2">
                            <Badge variant="secondary">
                              {field.options.map((opt, optIndex) => (
                                <span key={optIndex}>
                                  {opt.optionName}: {opt.optionValue}
                                  {optIndex < field.options.length - 1 && <span>{'\u00A0/\u00A0'}</span>}
                                </span>
                              ))}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <label className="mb-1 block text-sm text-gray-600">SKU</label>
                              <input
                                {...register(`variants.${variantIndex}.sku` as const)}
                                placeholder="SKU"
                                pattern="[A-Za-z0-9\-_]+"
                                title="英数字、ハイフン、アンダースコアのみ使用できます"
                                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              {errors.variants?.[variantIndex]?.sku && (
                                <p className="mt-1 text-sm text-red-500">
                                  {errors.variants[variantIndex].sku?.message}
                                </p>
                              )}
                            </div>
                            <div>
                              <label className="mb-1 block text-sm text-gray-600">価格（円）</label>
                              <input
                                type="number"
                                {...register(`variants.${variantIndex}.price` as const, {
                                  valueAsNumber: true,
                                })}
                                placeholder="価格"
                                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                min="0"
                              />
                              {errors.variants?.[variantIndex]?.price && (
                                <p className="mt-1 text-sm text-red-500">
                                  {errors.variants[variantIndex].price?.message}
                                </p>
                              )}
                            </div>
                            <div>
                              <label className="mb-1 block text-sm text-gray-600">バーコード（任意）</label>
                              <input
                                {...register(`variants.${variantIndex}.barcode` as const)}
                                placeholder="バーコード"
                                pattern="[A-Za-z0-9\-.$/ +%]*"
                                title="英数字、ハイフン、ドット、$、/、+、%、スペースのみ使用できます"
                                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              {errors.variants?.[variantIndex]?.barcode && (
                                <p className="mt-1 text-sm text-red-500">
                                  {errors.variants[variantIndex].barcode?.message}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* 単一商品の場合 */
            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  SKU <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('variants.0.sku')}
                  placeholder="例: BASIC-001"
                  pattern="[A-Za-z0-9\-_]+"
                  title="英数字、ハイフン、アンダースコアのみ使用できます"
                  className="w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.variants?.[0]?.sku && (
                  <p className="mt-1 text-sm text-red-500">{errors.variants[0].sku.message}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  価格（円） <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    {...register('variants.0.price', {
                      valueAsNumber: true,
                    })}
                    placeholder="2980"
                    className="w-full rounded-md border border-gray-300 px-4 py-2 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    max="999999"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">円</span>
                </div>
                {errors.variants?.[0]?.price && (
                  <p className="mt-1 text-sm text-red-500">{errors.variants[0].price.message}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">バーコード（任意）</label>
                <input
                  {...register('variants.0.barcode')}
                  placeholder="例: 4901234567890"
                  pattern="[A-Za-z0-9\-.$/ +%]*"
                  title="英数字、ハイフン、ドット、$、/、+、%、スペースのみ使用できます"
                  className="w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.variants?.[0]?.barcode && (
                  <p className="mt-1 text-sm text-red-500">{errors.variants[0].barcode.message}</p>
                )}
              </div>
            </div>
          )}
        </section>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() =>
              navigate({
                to: '/products',
              })
            }
            className="rounded-md border border-gray-300 bg-white px-6 py-2 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={isSubmitting || createProductMutation.isPending}
            className="rounded-md bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting || createProductMutation.isPending ? '登録中...' : '登録する'}
          </button>
        </div>
      </form>
    </div>
  );
}
