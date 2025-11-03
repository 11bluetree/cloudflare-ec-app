import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

export interface ProductSearchFormProps {
  initialKeyword?: string;
  initialMinPrice?: number;
  initialMaxPrice?: number;
  onSearch: (filters: { keyword?: string; minPrice?: number; maxPrice?: number }) => void;
  onClear: () => void;
}

/**
 * 商品検索フォームコンポーネント
 * キーワード、価格範囲でフィルタリング可能
 */
export function ProductSearchForm({
  initialKeyword = '',
  initialMinPrice,
  initialMaxPrice,
  onSearch,
  onClear,
}: ProductSearchFormProps) {
  const [keyword, setKeyword] = useState(initialKeyword);
  const [minPrice, setMinPrice] = useState(initialMinPrice?.toString() || '');
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice?.toString() || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({
      keyword: keyword || undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
    });
  };

  const handleClear = () => {
    setKeyword('');
    setMinPrice('');
    setMaxPrice('');
    onClear();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* キーワード検索 */}
          <div>
            <Label htmlFor="keyword">キーワード</Label>
            <Input
              type="text"
              id="keyword"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="商品名で検索"
            />
          </div>

          {/* 最低価格 */}
          <div>
            <Label htmlFor="minPrice">最低価格</Label>
            <Input
              type="number"
              id="minPrice"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="0"
              min="0"
            />
          </div>

          {/* 最高価格 */}
          <div>
            <Label htmlFor="maxPrice">最高価格</Label>
            <Input
              type="number"
              id="maxPrice"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="999999"
              min="0"
              max="999999"
            />
          </div>
        </div>

        {/* ボタンエリア */}
        <div className="flex gap-4">
          <Button type="submit" variant="primary">
            検索
          </Button>
          <Button type="button" variant="secondary" onClick={handleClear}>
            クリア
          </Button>
        </div>
      </form>
    </div>
  );
}
