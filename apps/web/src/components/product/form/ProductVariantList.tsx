import type { UseFormRegister, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import type { ProductFormData, Variant } from '../../../lib/schemas/product-form';
import { Badge, Button, Input } from '../../ui';
import { Select, SelectContent, SelectItem, SelectTrigger } from '../../ui/select';
import { useEffect, useState } from 'react';

type ProductVariantListProps = {
  variants: Variant[];
  register: UseFormRegister<ProductFormData>;
  errors: FieldErrors<ProductFormData>;
  bulkPrice: string;
  onBulkPriceChange: (value: string) => void;
  onApplyBulkPrice: () => void;
  images: File[];
  setValue: UseFormSetValue<ProductFormData>;
  watch: UseFormWatch<ProductFormData>;
};

const VariantImageSelector = ({
  variantIndex,
  images,
  setValue,
  watch,
  usedImageIndices,
}: {
  variantIndex: number;
  images: File[];
  setValue: UseFormSetValue<ProductFormData>;
  watch: UseFormWatch<ProductFormData>;
  usedImageIndices: number[];
}) => {
  const imageIndex = watch(`variants.${variantIndex}.imageIndex`);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  useEffect(() => {
    const urls = images.map((img) => URL.createObjectURL(img));
    setPreviewUrls(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [images]);

  const selectedUrl =
    imageIndex !== undefined && imageIndex !== null && previewUrls[imageIndex] ? previewUrls[imageIndex] : null;

  return (
    <Select
      value={imageIndex?.toString() ?? 'none'}
      onValueChange={(val) => {
        setValue(`variants.${variantIndex}.imageIndex`, val === 'none' ? undefined : parseInt(val, 10));
      }}
    >
      <SelectTrigger className="h-[60px] w-[60px] p-0 overflow-hidden">
        {selectedUrl ? (
          <img src={selectedUrl} alt="Selected" className="h-full w-full object-cover" />
        ) : (
          <span className="w-full text-center text-xs text-gray-400">No Img</span>
        )}
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">なし</SelectItem>
        {images.map((_, idx) => {
          // 他のバリアントで使用されており、かつ現在のバリアントで選択されていない画像は非表示にする
          const isUsed = usedImageIndices.includes(idx);
          const isSelectedByMe = imageIndex === idx;
          if (isUsed && !isSelectedByMe) return null;

          return (
            <SelectItem key={idx} value={idx.toString()} className="h-[50px]">
              <div className="flex items-center gap-2">
                {previewUrls[idx] && (
                  <img src={previewUrls[idx]} alt={`Image ${idx + 1}`} className="h-8 w-8 rounded object-cover" />
                )}
                <span>画像 {idx + 1}</span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
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
  images,
  setValue,
  watch,
}) => {
  const currentVariants = watch('variants');
  const usedImageIndices =
    currentVariants?.map((v) => v.imageIndex).filter((i): i is number => i !== undefined && i !== null) ?? [];

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

      {/* バリアント編集（テーブル形式） */}
      <div className="overflow-x-auto rounded-md border border-gray-200">
        <table className="w-full min-w-[900px] table-fixed divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="w-[100px] px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                画像
              </th>
              <th
                scope="col"
                className="w-1/4 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                バリアント
              </th>
              <th
                scope="col"
                className="w-1/4 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                SKU
              </th>
              <th
                scope="col"
                className="w-1/4 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                価格（円）
              </th>
              <th
                scope="col"
                className="w-1/4 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                バーコード
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {variants.map((variant, variantIndex) => (
              <tr key={variantIndex}>
                <td className="px-4 py-4 align-top">
                  <VariantImageSelector
                    variantIndex={variantIndex}
                    images={images}
                    setValue={setValue}
                    watch={watch}
                    usedImageIndices={usedImageIndices}
                  />
                </td>
                <td className="px-4 py-4 align-top">
                  <div className="flex flex-wrap gap-1">
                    {variant.options.map((opt, optIndex) => (
                      <Badge key={optIndex} variant="secondary" className="whitespace-nowrap">
                        {opt.optionName}: {opt.optionValue}
                      </Badge>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-4 align-top">
                  <Input
                    {...register(`variants.${variantIndex}.sku` as const)}
                    placeholder="SKU"
                    pattern="[A-Za-z0-9\-_]+"
                    title="英数字、ハイフン、アンダースコアのみ使用できます"
                    className="w-full"
                  />
                  {errors.variants?.[variantIndex]?.sku && (
                    <p className="mt-1 text-xs text-red-500">{errors.variants[variantIndex].sku?.message}</p>
                  )}
                </td>
                <td className="px-4 py-4 align-top">
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      {...register(`variants.${variantIndex}.price` as const, {
                        valueAsNumber: true,
                      })}
                      placeholder="価格"
                      min="0"
                      className="w-full"
                    />
                  </div>
                  {errors.variants?.[variantIndex]?.price && (
                    <p className="mt-1 text-xs text-red-500">{errors.variants[variantIndex].price?.message}</p>
                  )}
                </td>
                <td className="px-4 py-4 align-top">
                  <Input
                    {...register(`variants.${variantIndex}.barcode` as const)}
                    placeholder="バーコード"
                    pattern="[A-Za-z0-9\-.$/ +%]*"
                    title="英数字、ハイフン、ドット、$、/、+、%、スペースのみ使用できます"
                    className="w-full"
                  />
                  {errors.variants?.[variantIndex]?.barcode && (
                    <p className="mt-1 text-xs text-red-500">{errors.variants[variantIndex].barcode?.message}</p>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
