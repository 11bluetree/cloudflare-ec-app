import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { productFormSchema, type ProductFormData } from '../schemas/product-form';
import { generateVariants, calculateVariantCount } from '../utils/variant-generator';

/**
 * 商品登録フォームのカスタムフック
 */
export const useProductForm = () => {
  const [hasOptions, setHasOptions] = useState(false);
  const [bulkPrice, setBulkPrice] = useState<string>('');
  const [showVariantForm, setShowVariantForm] = useState(false);

  const form = useForm<ProductFormData>({
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
    },
  });

  const {
    fields: optionFields,
    append: appendOption,
    remove: removeOption,
  } = useFieldArray({
    control: form.control,
    name: 'options',
  });

  const { fields: variantFields, replace: replaceVariants } = useFieldArray({
    control: form.control,
    name: 'variants',
  });

  // オプション有無の切り替え
  const handleHasOptionsChange = (value: boolean) => {
    setHasOptions(value);
    form.setValue('hasOptions', value);
    if (!value) {
      form.setValue('options', []);
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
      form.setValue('options', [
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
    const options = form.watch('options');
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
    const option = form.watch(`options.${optionIndex}`);
    const existingValues = option.values || [];
    if (existingValues.some((v) => v.value === trimmedValue)) {
      toast.error('同じ値が既に存在します');
      return;
    }
    if (existingValues.length >= 50) {
      toast.error('オプション値は最大50個までです');
      return;
    }
    form.setValue(`options.${optionIndex}.values`, [
      ...existingValues,
      {
        value: trimmedValue,
        displayOrder: existingValues.length + 1,
      },
    ]);

    // バリアントが既に生成されている場合は再生成
    if (showVariantForm) {
      const options = form.watch('options');
      const basePrice = bulkPrice ? parseInt(bulkPrice, 10) : 0;
      const newVariants = generateVariants(options, basePrice);
      replaceVariants(newVariants);
      toast.success('バリアントを再生成しました');
    }
  };

  // オプション名の重複チェック
  const handleOptionNameChange = (optionIndex: number, newName: string) => {
    const trimmedName = newName.trim();
    if (!trimmedName) return;

    // 他のオプション名と重複していないかチェック
    const allOptions = form.watch('options');
    const isDuplicate = allOptions.some(
      (opt, idx) => idx !== optionIndex && opt.optionName.trim().toLowerCase() === trimmedName.toLowerCase(),
    );

    if (isDuplicate) {
      toast.error(`オプション名「${trimmedName}」は既に使用されています`);
      // 元の値に戻す（空文字列）
      form.setValue(`options.${optionIndex}.optionName`, '');
    }
  };

  // オプション値削除
  const handleRemoveOptionValue = (optionIndex: number, valueIndex: number) => {
    const option = form.watch(`options.${optionIndex}`);
    const updatedValues = option.values.filter((_, index) => index !== valueIndex);
    form.setValue(`options.${optionIndex}.values`, updatedValues);

    // バリアントが既に生成されている場合は再生成
    if (showVariantForm) {
      const options = form.watch('options');
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
    variantFields.forEach((_, index) => form.setValue(`variants.${index}.price`, price));
    toast.success('全バリアントに価格を適用しました');
  };

  return {
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
  };
};
