import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { AdminSidebar } from './admin-sidebar';

// TanStack Routerのモック
vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, className, ...props }: { to: string; children: React.ReactNode; className?: string }) => (
    <a href={to} className={className} {...props}>
      {children}
    </a>
  ),
}));

describe('AdminSidebar', () => {
  test('展開時に商品管理メニューが表示される', () => {
    render(<AdminSidebar isCollapsed={false} onToggle={() => {}} />);

    expect(screen.getByText('商品管理')).toBeInTheDocument();
  });

  test('展開時に在庫管理メニューが表示されるが無効化されている', () => {
    render(<AdminSidebar isCollapsed={false} onToggle={() => {}} />);

    const inventoryLink = screen.getByText('在庫管理').closest('a');
    expect(inventoryLink).toBeInTheDocument();
    expect(inventoryLink).toHaveAttribute('aria-disabled', 'true');
  });

  test('折りたたみ時にテキストが非表示になる', () => {
    render(<AdminSidebar isCollapsed={true} onToggle={() => {}} />);

    // テキストが非表示（sr-onlyクラス等で隠されている）
    const productText = screen.getByText('商品管理');
    expect(productText).toHaveClass('sr-only');
  });

  test('折りたたみ時にアイコンのみ表示される', () => {
    render(<AdminSidebar isCollapsed={true} onToggle={() => {}} />);

    // SVG要素が存在することを確認（lucideアイコンはaria-hiddenで描画される）
    const container = screen.getByRole('complementary');
    const svgElements = container.querySelectorAll('svg');
    expect(svgElements.length).toBeGreaterThan(0);
  });

  test('トグルボタンをクリックするとonToggleが呼ばれる', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();

    render(<AdminSidebar isCollapsed={false} onToggle={onToggle} />);

    const toggleButton = screen.getByRole('button', { name: /折りたたみ|展開/ });
    await user.click(toggleButton);

    expect(onToggle).toHaveBeenCalledOnce();
  });

  test('商品管理リンクが正しいパスを持つ', () => {
    render(<AdminSidebar isCollapsed={false} onToggle={() => {}} />);

    const productLink = screen.getByText('商品管理').closest('a');
    expect(productLink).toHaveAttribute('href', '/admin/products');
  });

  test('在庫管理リンクはクリック不可能', () => {
    render(<AdminSidebar isCollapsed={false} onToggle={() => {}} />);

    const inventoryLink = screen.getByText('在庫管理').closest('a');
    expect(inventoryLink).toHaveStyle({ pointerEvents: 'none' });
  });
});
