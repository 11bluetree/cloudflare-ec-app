import { createFileRoute, Link, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/admin')({
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold text-gray-900">管理画面</h1>
              <nav className="flex space-x-6">
                <Link
                  to="/admin/products"
                  className="text-gray-600 hover:text-gray-900 font-medium"
                  activeProps={{ className: 'text-blue-600 hover:text-blue-700' }}
                >
                  商品管理
                </Link>
                {/* 今後追加予定: 在庫管理、注文管理、ユーザー管理 */}
              </nav>
            </div>
            <Link to="/" className="text-sm text-gray-600 hover:text-gray-900">
              公開サイトへ →
            </Link>
          </div>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
