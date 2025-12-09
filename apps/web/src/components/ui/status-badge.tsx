import type { ProductStatus } from '@cloudflare-ec-app/types';

interface StatusBadgeProps {
  status: ProductStatus;
}

/**
 * 商品ステータスバッジコンポーネント
 */
export function StatusBadge({ status }: StatusBadgeProps) {
  const styles: Record<ProductStatus, string> = {
    published: 'bg-green-100 text-green-800',
    draft: 'bg-gray-100 text-gray-800',
    archived: 'bg-red-100 text-red-800',
  };

  const labels: Record<ProductStatus, string> = {
    published: '公開',
    draft: '下書き',
    archived: 'アーカイブ',
  };

  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>{labels[status]}</span>;
}
