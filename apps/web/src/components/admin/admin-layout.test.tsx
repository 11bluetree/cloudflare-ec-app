import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { AdminLayout } from './admin-layout';

// TanStack Routerのモック
vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, className, ...props }: { to: string; children: React.ReactNode; className?: string }) => (
    <a href={to} className={className} {...props}>
      {children}
    </a>
  ),
}));

describe('AdminLayout', () => {
  test('サイドバーと子要素がレンダリングされる', () => {
    render(
      <AdminLayout>
        <div>テストコンテンツ</div>
      </AdminLayout>,
    );

    expect(screen.getByText('管理画面')).toBeInTheDocument();
    expect(screen.getByText('テストコンテンツ')).toBeInTheDocument();
  });

  test('初期状態でサイドバーは展開されている', () => {
    render(
      <AdminLayout>
        <div>テストコンテンツ</div>
      </AdminLayout>,
    );

    // 展開時はメニューテキストが表示される
    expect(screen.getByText('商品管理')).not.toHaveClass('sr-only');
  });

  test('トグルボタンでサイドバーが折りたたまれる', async () => {
    const user = userEvent.setup();

    render(
      <AdminLayout>
        <div>テストコンテンツ</div>
      </AdminLayout>,
    );

    const toggleButton = screen.getByRole('button', { name: /折りたたみ/ });
    await user.click(toggleButton);

    // 折りたたみ後はメニューテキストが非表示
    expect(screen.getByText('商品管理')).toHaveClass('sr-only');
  });

  test('メインコンテンツエリアがサイドバーの幅に応じて調整される', async () => {
    const user = userEvent.setup();

    const { container } = render(
      <AdminLayout>
        <div>テストコンテンツ</div>
      </AdminLayout>,
    );

    const mainContent = container.querySelector('main');
    expect(mainContent).toBeInTheDocument();

    // 初期状態（展開時）の左マージンを確認
    expect(mainContent).toHaveClass('ml-64');

    const toggleButton = screen.getByRole('button', { name: /折りたたみ/ });
    await user.click(toggleButton);

    // 折りたたみ後の左マージンを確認
    expect(mainContent).toHaveClass('ml-16');
  });
});
