import { useState } from 'react';
import { AdminSidebar } from './admin-sidebar';
import { cn } from '../../lib/utils';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleToggle = () => {
    setIsCollapsed((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar isCollapsed={isCollapsed} onToggle={handleToggle} />
      <main className={cn('transition-all duration-300', isCollapsed ? 'ml-16' : 'ml-64')}>{children}</main>
    </div>
  );
}
