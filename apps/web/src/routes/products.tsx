import { createFileRoute } from '@tanstack/react-router';
import { ProductListQuerySchema, type ProductListItem } from '@cloudflare-ec-app/types';
import { fetchAdminProducts } from '../lib/api/products';
import { ProductSearchForm } from '../components/product-search-form';
import { ProductSortControls, type SortBy } from '../components/product-sort-controls';
import { ProductCard } from '../components/product-card';
import { EmptyState } from '../components/ui/empty-state';
import { Pagination } from '../components/ui/pagination';

export const Route = createFileRoute('/products')({
  validateSearch: ProductListQuerySchema,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => fetchAdminProducts(deps),
  component: ProductsPage,
});

function ProductsPage() {
  const data = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const handleSearch = (filters: { keyword?: string; minPrice?: number; maxPrice?: number }) => {
    navigate({
      search: {
        ...search,
        page: 1, // 検索時は1ページ目に戻る
        ...filters,
      },
    });
  };

  const handleSortChange = (sortBy: SortBy) => {
    navigate({
      search: {
        ...search,
        sortBy,
        order: search.sortBy === sortBy && search.order === 'desc' ? 'asc' : 'desc',
      },
    });
  };

  const handlePageChange = (newPage: number) => {
    navigate({
      search: {
        ...search,
        page: newPage,
      },
    });
  };

  const clearFilters = () => {
    navigate({
      search: {
        page: 1,
        perPage: 20,
        sortBy: 'createdAt',
        order: 'desc',
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">商品一覧</h1>

        {/* 検索・フィルターエリア */}
        <ProductSearchForm
          initialKeyword={search.keyword}
          initialMinPrice={search.minPrice}
          initialMaxPrice={search.maxPrice}
          onSearch={handleSearch}
          onClear={clearFilters}
        />

        {/* ソート・表示件数エリア */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <ProductSortControls
            currentSortBy={search.sortBy || 'createdAt'}
            currentOrder={search.order || 'desc'}
            onSortChange={handleSortChange}
          />

          <div className="text-sm text-gray-600">
            {data.pagination.total}件中 {(data.pagination.page - 1) * data.pagination.perPage + 1} -{' '}
            {Math.min(data.pagination.page * data.pagination.perPage, data.pagination.total)}
            件表示
          </div>
        </div>

        {/* 商品一覧 */}
        {data.items.length === 0 ? (
          <EmptyState title="商品が見つかりませんでした" description="検索条件を変更してお試しください" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {data.items.map((product: ProductListItem) => (
              <ProductCard key={product.id} {...product} imageUrl={product.imageUrl ?? undefined} />
            ))}
          </div>
        )}

        {/* ページネーション */}
        <div className="mt-8">
          <Pagination
            currentPage={data.pagination.page}
            totalPages={data.pagination.totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  );
}
