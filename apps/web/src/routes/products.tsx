import { createFileRoute } from '@tanstack/react-router'
import { apiGet } from '../lib/api'
import type { ProductListResponse } from '@cloudflare-ec-app/types'
import { z } from 'zod'
import { useState } from 'react'

// 検索パラメータのスキーマ定義
const productSearchSchema = z.object({
  page: z.number().int().min(1).catch(1),
  perPage: z.number().int().min(1).max(100).catch(20),
  categoryId: z.string().length(26).optional(),
  keyword: z.string().max(200).optional(),
  minPrice: z.number().int().min(0).optional(),
  maxPrice: z.number().int().min(0).max(999999).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  sortBy: z.enum(['createdAt', 'price', 'name']).catch('createdAt'),
  order: z.enum(['asc', 'desc']).catch('desc'),
})

type ProductSearch = z.infer<typeof productSearchSchema>

const fetchProducts = (search: ProductSearch): Promise<ProductListResponse> => {
  // クエリパラメータを構築
  const params = new URLSearchParams()
  
  Object.entries(search).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      params.append(key, String(value))
    }
  })
  
  return apiGet<ProductListResponse>(`/api/products?${params.toString()}`)
}

export const Route = createFileRoute('/products')({
  validateSearch: productSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => fetchProducts(deps),
  component: ProductsPage,
})

function ProductsPage() {
  const data = Route.useLoaderData()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  
  const [keyword, setKeyword] = useState(search.keyword || '')
  const [minPrice, setMinPrice] = useState(search.minPrice?.toString() || '')
  const [maxPrice, setMaxPrice] = useState(search.maxPrice?.toString() || '')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    navigate({
      search: {
        ...search,
        page: 1, // 検索時は1ページ目に戻る
        keyword: keyword || undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
      },
    })
  }

  const handleSortChange = (sortBy: 'createdAt' | 'price' | 'name') => {
    navigate({
      search: {
        ...search,
        sortBy,
        order: search.sortBy === sortBy && search.order === 'desc' ? 'asc' : 'desc',
      },
    })
  }

  const handlePageChange = (newPage: number) => {
    navigate({
      search: {
        ...search,
        page: newPage,
      },
    })
  }

  const clearFilters = () => {
    setKeyword('')
    setMinPrice('')
    setMaxPrice('')
    navigate({
      search: {
        page: 1,
        perPage: 20,
        sortBy: 'createdAt',
        order: 'desc',
      },
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">商品一覧</h1>
        
        {/* 検索・フィルターエリア */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* キーワード検索 */}
              <div>
                <label htmlFor="keyword" className="block text-sm font-medium text-gray-700 mb-1">
                  キーワード
                </label>
                <input
                  type="text"
                  id="keyword"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="商品名で検索"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 最低価格 */}
              <div>
                <label htmlFor="minPrice" className="block text-sm font-medium text-gray-700 mb-1">
                  最低価格
                </label>
                <input
                  type="number"
                  id="minPrice"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="0"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 最高価格 */}
              <div>
                <label htmlFor="maxPrice" className="block text-sm font-medium text-gray-700 mb-1">
                  最高価格
                </label>
                <input
                  type="number"
                  id="maxPrice"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="999999"
                  min="0"
                  max="999999"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* ボタンエリア */}
            <div className="flex gap-4">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                検索
              </button>
              <button
                type="button"
                onClick={clearFilters}
                className="px-6 py-2 bg-gray-200 text-gray-700 font-medium rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                クリア
              </button>
            </div>
          </form>
        </div>

        {/* ソート・表示件数エリア */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">並び替え:</span>
            <button
              onClick={() => handleSortChange('createdAt')}
              className={`px-3 py-1 text-sm rounded-md ${
                search.sortBy === 'createdAt'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              登録日 {search.sortBy === 'createdAt' && (search.order === 'desc' ? '↓' : '↑')}
            </button>
            <button
              onClick={() => handleSortChange('price')}
              className={`px-3 py-1 text-sm rounded-md ${
                search.sortBy === 'price'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              価格 {search.sortBy === 'price' && (search.order === 'desc' ? '↓' : '↑')}
            </button>
            <button
              onClick={() => handleSortChange('name')}
              className={`px-3 py-1 text-sm rounded-md ${
                search.sortBy === 'name'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              商品名 {search.sortBy === 'name' && (search.order === 'desc' ? '↓' : '↑')}
            </button>
          </div>

          <div className="text-sm text-gray-600">
            {data.pagination.total}件中{' '}
            {(data.pagination.page - 1) * data.pagination.perPage + 1} -{' '}
            {Math.min(data.pagination.page * data.pagination.perPage, data.pagination.total)}
            件表示
          </div>
        </div>
        
        {/* 商品一覧 */}
        {data.items.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <svg
              className="mx-auto w-16 h-16 text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-xl text-gray-600 mb-2">商品が見つかりませんでした</p>
            <p className="text-sm text-gray-500">検索条件を変更してお試しください</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {data.items.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* 商品画像 */}
              <div className="aspect-square bg-gray-200 flex items-center justify-center">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <svg
                    className="w-20 h-20 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
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
                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                  {product.name}
                </h3>
                
                <p className="text-xs text-gray-500 mb-2">
                  {product.categoryName}
                </p>
                
                {product.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {product.description}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    {product.minPrice === product.maxPrice ? (
                      <p className="text-xl font-bold text-gray-900">
                        ¥{product.minPrice.toLocaleString()}
                      </p>
                    ) : (
                      <p className="text-xl font-bold text-gray-900">
                        ¥{product.minPrice.toLocaleString()} - ¥{product.maxPrice.toLocaleString()}
                      </p>
                    )}
                  </div>
                  
                  {product.status === 'archived' && (
                    <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded">
                      販売終了
                    </span>
                  )}
                  {product.status === 'draft' && (
                    <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      下書き
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          </div>
        )}

        {/* ページネーション */}
        {data.pagination.totalPages > 1 && (
          <div className="mt-8 flex justify-center items-center gap-2">
            <button
              onClick={() => handlePageChange(data.pagination.page - 1)}
              disabled={data.pagination.page === 1}
              className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              前へ
            </button>

            <div className="flex gap-1">
              {Array.from({ length: data.pagination.totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  // 現在のページの前後2ページと最初・最後のページを表示
                  const currentPage = data.pagination.page
                  return (
                    page === 1 ||
                    page === data.pagination.totalPages ||
                    (page >= currentPage - 2 && page <= currentPage + 2)
                  )
                })
                .map((page, index, array) => {
                  // 省略記号を表示
                  const prevPage = array[index - 1]
                  const showEllipsis = prevPage && page - prevPage > 1

                  return (
                    <div key={page} className="flex items-center gap-1">
                      {showEllipsis && (
                        <span className="px-2 text-gray-500">...</span>
                      )}
                      <button
                        onClick={() => handlePageChange(page)}
                        className={`px-4 py-2 rounded-md ${
                          page === data.pagination.page
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    </div>
                  )
                })}
            </div>

            <button
              onClick={() => handlePageChange(data.pagination.page + 1)}
              disabled={data.pagination.page === data.pagination.totalPages}
              className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              次へ
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
