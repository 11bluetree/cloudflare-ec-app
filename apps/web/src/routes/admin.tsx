import { createFileRoute, Outlet } from '@tanstack/react-router';
import { AdminLayout } from '../components/admin';

export const Route = createFileRoute('/admin')({
  component: AdminPage,
});

function AdminPage() {
  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
}
