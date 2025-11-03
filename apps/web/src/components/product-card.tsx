export interface ProductCardProps {
  id: string;
  name: string;
  categoryName: string;
  description?: string;
  imageUrl?: string;
  minPrice: number;
  maxPrice: number;
  status: 'draft' | 'published' | 'archived';
}

/**
 * 商品カード表示用コンポーネント
 */
export function ProductCard({
  name,
  categoryName,
  description,
  imageUrl,
  minPrice,
  maxPrice,
  status,
}: ProductCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {/* 商品画像 */}
      <div className="aspect-square bg-gray-200 flex items-center justify-center">
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <svg className="w-20 h-20 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        )}
      </div>

      {/* 商品情報 */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{name}</h3>

        <p className="text-xs text-gray-500 mb-2">{categoryName}</p>

        {description && <p className="text-sm text-gray-600 mb-3 line-clamp-2">{description}</p>}

        <div className="flex items-center justify-between">
          <div>
            {minPrice === maxPrice ? (
              <p className="text-xl font-bold text-gray-900">¥{minPrice.toLocaleString()}</p>
            ) : (
              <p className="text-xl font-bold text-gray-900">
                ¥{minPrice.toLocaleString()} - ¥{maxPrice.toLocaleString()}
              </p>
            )}
          </div>

          {status === 'archived' && (
            <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded">販売終了</span>
          )}
          {status === 'draft' && (
            <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">下書き</span>
          )}
        </div>
      </div>
    </div>
  );
}
