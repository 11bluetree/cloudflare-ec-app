import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { simpleProductFormSchema, type SimpleProductFormData } from '../../../lib/schemas/product-form';
import { createProduct } from '../../../lib/api/products';
import { fetchCategories } from '../../../lib/api/categories';
import type { CategoryTreeNode } from '@cloudflare-ec-app/types';

export const Route = createFileRoute('/admin/products/new')({
  component: ProductNewPage,
});

function ProductNewPage() {
  const navigate = useNavigate();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

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
  } = useForm<SimpleProductFormData>({
    resolver: zodResolver(simpleProductFormSchema),
    defaultValues: {
      name: '',
      description: '',
      categoryId: '',
      status: 'draft',
      sku: '',
      price: 0,
      barcode: '',
    },
  });

  // 選択されたカテゴリーが変更されたら、最後に選択されたIDをフォームにセット
  useEffect(() => {
    if (selectedCategories.length > 0) {
      const lastSelectedId = selectedCategories[selectedCategories.length - 1];
      setValue('categoryId', lastSelectedId, { shouldValidate: true });
    } else {
      setValue('categoryId', '', { shouldValidate: true });
    }
  }, [selectedCategories, setValue]);

  const createProductMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: (data) => {
      toast.success('商品を登録しました', {
        description: `商品ID: ${data.id}`,
      });
      navigate({ to: '/products' });
    },
    onError: (error: Error) => {
      toast.error('商品の登録に失敗しました', {
        description: error.message,
      });
    },
  });

  const onSubmit = async (data: SimpleProductFormData) => {
    const requestData = {
      name: data.name,
      description: data.description,
      categoryId: data.categoryId,
      status: data.status,
      options: [{ optionName: 'title', displayOrder: 1 }],
      variants: [
        {
          sku: data.sku,
          barcode: data.barcode || null,
          imageUrl: null,
          price: data.price,
          displayOrder: 1,
          options: [{ optionName: 'title', optionValue: 'default', displayOrder: 1 }],
        },
      ],
    };

    await createProductMutation.mutateAsync(requestData);
  };

  const nameLength = watch('name')?.length || 0;
  const descriptionLength = watch('description')?.length || 0;

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
                className={`w-full rounded-md border px-4 py-2 focus:outline-none focus:ring-2 ${
                  errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                }`}
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
                className={`w-full rounded-md border px-4 py-2 focus:outline-none focus:ring-2 ${
                  errors.description ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                }`}
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
                      className={`w-full rounded-md border px-4 py-2 focus:outline-none focus:ring-2 ${
                        errors.categoryId && levelIndex === 0
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
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

        <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-6 text-xl font-semibold">価格・SKU</h2>
          <div className="space-y-6">
            <div>
              <label htmlFor="sku" className="mb-2 block text-sm font-medium text-gray-700">
                SKU <span className="text-red-500">*</span>
              </label>
              <input
                id="sku"
                type="text"
                {...register('sku')}
                className={`w-full rounded-md border px-4 py-2 focus:outline-none focus:ring-2 ${
                  errors.sku ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="例: BASIC-001"
              />
              {errors.sku && <p className="mt-1 text-sm text-red-600">{errors.sku.message}</p>}
              <p className="mt-1 text-sm text-gray-500">在庫管理用の商品コード</p>
            </div>

            <div>
              <label htmlFor="price" className="mb-2 block text-sm font-medium text-gray-700">
                価格 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="price"
                  type="number"
                  {...register('price', { valueAsNumber: true })}
                  className={`w-full rounded-md border px-4 py-2 pr-12 focus:outline-none focus:ring-2 ${
                    errors.price ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="2980"
                  min="0"
                  max="999999"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">円</span>
              </div>
              {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>}
            </div>

            <div>
              <label htmlFor="barcode" className="mb-2 block text-sm font-medium text-gray-700">
                バーコード（任意）
              </label>
              <input
                id="barcode"
                type="text"
                {...register('barcode')}
                className="w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: 4901234567890"
              />
              {errors.barcode && <p className="mt-1 text-sm text-red-600">{errors.barcode.message}</p>}
            </div>
          </div>
        </section>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate({ to: '/products' })}
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
