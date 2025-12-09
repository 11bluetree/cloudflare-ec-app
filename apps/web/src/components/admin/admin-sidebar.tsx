import { Link } from '@tanstack/react-router';
import { Package, Warehouse, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

interface AdminSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
}

const navItems: NavItem[] = [
  {
    label: '商品管理',
    href: '/admin/products',
    icon: Package,
  },
  {
    label: '在庫管理',
    href: '#',
    icon: Warehouse,
    disabled: true,
  },
];

export function AdminSidebar({ isCollapsed, onToggle }: AdminSidebarProps) {
  return (
    <aside
      className={cn(
        'bg-gray-900 text-white h-screen fixed left-0 top-0 transition-all duration-300 flex flex-col',
        isCollapsed ? 'w-16' : 'w-64',
      )}
    >
      {/* ヘッダー */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        {!isCollapsed && <h2 className="text-lg font-semibold">管理画面</h2>}
        <button
          onClick={onToggle}
          className={cn('p-1 rounded hover:bg-gray-800 transition-colors', isCollapsed && 'mx-auto')}
          aria-label={isCollapsed ? '展開' : '折りたたみ'}
        >
          {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>

      {/* ナビゲーションメニュー */}
      <nav className="flex-1 p-2">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isDisabled = item.disabled;

            return (
              <li key={item.href}>
                <Link
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                    isDisabled
                      ? 'text-gray-500 cursor-not-allowed'
                      : 'hover:bg-gray-800 text-gray-200 hover:text-white',
                    isCollapsed && 'justify-center',
                  )}
                  aria-disabled={isDisabled}
                  style={isDisabled ? { pointerEvents: 'none' } : undefined}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className={cn(isCollapsed && 'sr-only')}>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
