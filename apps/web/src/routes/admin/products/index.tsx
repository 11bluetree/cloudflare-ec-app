import { createFileRoute, Link } from '@tanstack/react-router';
import { ProductListQuerySchema, type ProductListItem } from '@cloudflare-ec-app/types';
import { fetchAdminProducts } from '../../../lib/api/products';
import { EmptyState } from '../../../components/ui/empty-state';
import { Pagination } from '../../../components/ui/pagination';
import { StatusBadge } from '../../../components/ui/status-badge';

export const Route = createFileRoute('/admin/products/')({
  validateSearch: ProductListQuerySchema,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => fetchAdminProducts(deps),
  component: ProductsPage,
});

function ProductsPage() {
  const data = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const handlePageChange = (newPage: number) => {
    navigate({
      search: {
        ...search,
        page: newPage,
      },
    });
  };

  const handleSort = (sortBy: 'createdAt' | 'price' | 'name') => {
    navigate({
      search: {
        ...search,
        sortBy,
        order: search.sortBy === sortBy && search.order === 'desc' ? 'asc' : 'desc',
      },
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(price);
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">商品管理</h1>
        <Link
          to="/admin/products/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
        >
          新規登録
        </Link>
      </div>

      {/* 検索・フィルターエリア（今後実装） */}
      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <p className="text-sm text-gray-600">検索・フィルター機能は今後実装予定</p>
      </div>

      {/* 商品テーブル */}
      {data.items.length === 0 ? (
        <EmptyState title="商品が登録されていません" description="「新規登録」ボタンから商品を追加してください" />
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    画像
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('name')}
                  >
                    商品名 {search.sortBy === 'name' && (search.order === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    カテゴリー
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('price')}
                  >
                    価格 {search.sortBy === 'price' && (search.order === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('createdAt')}
                  >
                    作成日 {search.sortBy === 'createdAt' && (search.order === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.items.map((product: ProductListItem) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="h-12 w-12 object-cover rounded" />
                      ) : (
                        <div className="h-12 w-12 bg-gray-200 rounded flex items-center justify-center">
                          <span className="text-gray-400 text-xs">No Image</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500 line-clamp-1">{product.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{product.categoryName}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {product.minPrice === product.maxPrice
                          ? formatPrice(product.minPrice)
                          : `${formatPrice(product.minPrice)} - ${formatPrice(product.maxPrice)}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={product.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(product.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {/* TODO: 編集ルート実装後に有効化 */}
                      {/* <Link
                        to="/admin/products/$productId"
                        params={{ productId: product.id }}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        編集
                      </Link> */}
                      <span className="text-gray-400 mr-4">編集</span>
                      <button className="text-red-600 hover:text-red-900">削除</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ページネーション */}
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {data.pagination.total}件中 {(data.pagination.page - 1) * data.pagination.perPage + 1} -{' '}
                {Math.min(data.pagination.page * data.pagination.perPage, data.pagination.total)}
                件表示
              </div>
              <Pagination
                currentPage={data.pagination.page}
                totalPages={data.pagination.totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
