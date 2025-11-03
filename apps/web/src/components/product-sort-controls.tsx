import { Button } from './ui/button';

export type SortBy = 'createdAt' | 'price' | 'name';
export type Order = 'asc' | 'desc';

export interface ProductSortControlsProps {
  currentSortBy: SortBy;
  currentOrder: Order;
  onSortChange: (sortBy: SortBy) => void;
}

/**
 * 商品ソートコントロールコンポーネント
 * 登録日、価格、商品名でソート可能
 */
export function ProductSortControls({ currentSortBy, currentOrder, onSortChange }: ProductSortControlsProps) {
  const getSortIcon = (sortBy: SortBy) => {
    if (currentSortBy === sortBy) {
      return currentOrder === 'desc' ? ' ↓' : ' ↑';
    }
    return '';
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600">並び替え:</span>
      <Button
        variant={currentSortBy === 'createdAt' ? 'primary' : 'ghost'}
        size="sm"
        onClick={() => onSortChange('createdAt')}
      >
        登録日{getSortIcon('createdAt')}
      </Button>
      <Button variant={currentSortBy === 'price' ? 'primary' : 'ghost'} size="sm" onClick={() => onSortChange('price')}>
        価格{getSortIcon('price')}
      </Button>
      <Button variant={currentSortBy === 'name' ? 'primary' : 'ghost'} size="sm" onClick={() => onSortChange('name')}>
        商品名{getSortIcon('name')}
      </Button>
    </div>
  );
}
