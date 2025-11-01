import { createFileRoute } from '@tanstack/react-router'
import { apiGet } from '../lib/api'

interface Product {
  id: string
  name: string
  description: string | null
  categoryId: string
  status: string
  minPrice: number
  maxPrice: number
  thumbnail: string | null
  inStock: boolean
  createdAt: string
  updatedAt: string
}

interface ProductsResponse {
  products: Product[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

const fetchProducts = (): Promise<ProductsResponse> => {
  return apiGet<ProductsResponse>('/api/products')
}

export const Route = createFileRoute('/products')({
  loader: fetchProducts,
  component: ProductsPage,
})

function ProductsPage() {
  const data = Route.useLoaderData()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">商品一覧</h1>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {data.products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* 商品画像 */}
              <div className="aspect-square bg-gray-200 flex items-center justify-center">
                {product.thumbnail ? (
                  <img
                    src={product.thumbnail}
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
                  
                  {!product.inStock && (
                    <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded">
                      在庫切れ
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ページネーション情報 */}
        <div className="mt-8 text-center text-sm text-gray-600">
          {data.pagination.total}件中 {data.products.length}件表示
        </div>
      </div>
    </div>
  )
}
