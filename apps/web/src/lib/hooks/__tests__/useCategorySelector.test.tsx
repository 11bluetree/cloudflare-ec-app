import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { faker } from '@faker-js/faker';
import { useCategorySelector } from '../useCategorySelector';
import type { ReactNode } from 'react';

// API モック
const mockFetchCategories = vi.fn();

vi.mock('../../api/categories', () => ({
  fetchCategories: () => mockFetchCategories(),
}));

/**
 * テスト用のQueryClientを作成
 */
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
}

/**
 * テスト用のラッパー
 */
function createWrapper() {
  const queryClient = createTestQueryClient();
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return Wrapper;
}

/**
 * テスト用のカテゴリーツリーを生成
 */
function generateCategoryTree(depth: number) {
  const level1 = {
    id: faker.string.alphanumeric(26),
    name: 'カテゴリー1',
    children: depth > 1 ? [] : undefined,
  };

  if (depth > 1) {
    const level2 = {
      id: faker.string.alphanumeric(26),
      name: 'カテゴリー1-1',
      children: depth > 2 ? [] : undefined,
    };
    level1.children = [level2];

    if (depth > 2) {
      const level3 = {
        id: faker.string.alphanumeric(26),
        name: 'カテゴリー1-1-1',
        children: undefined,
      };
      level2.children = [level3];
    }
  }

  return {
    categories: [level1],
  };
}

describe('useCategorySelector', () => {
  const mockOnCategoryIdChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('初期化', () => {
    it('カテゴリーが読み込まれる', async () => {
      const categoryData = generateCategoryTree(1);
      mockFetchCategories.mockResolvedValue(categoryData);

      const { result } = renderHook(() => useCategorySelector(mockOnCategoryIdChange), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isCategoriesLoading).toBe(false);
      });

      expect(result.current.categoryLevels.length).toBe(1);
      expect(result.current.categoryLevels[0].length).toBe(1);
    });
  });

  describe('階層選択', () => {
    it('1階層のカテゴリーを選択すると、onCategoryIdChangeが呼ばれる', async () => {
      const categoryData = generateCategoryTree(1);
      mockFetchCategories.mockResolvedValue(categoryData);

      const { result } = renderHook(() => useCategorySelector(mockOnCategoryIdChange), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isCategoriesLoading).toBe(false);
      });

      const categoryId = categoryData.categories[0].id;

      act(() => {
        result.current.handleCategoryChange(0, categoryId);
      });

      await waitFor(() => {
        expect(mockOnCategoryIdChange).toHaveBeenCalledWith(categoryId);
      });
    });

    it('2階層のカテゴリーの場合、1つ選択すると2つ目が表示される', async () => {
      const categoryData = generateCategoryTree(2);
      mockFetchCategories.mockResolvedValue(categoryData);

      const { result } = renderHook(() => useCategorySelector(mockOnCategoryIdChange), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isCategoriesLoading).toBe(false);
      });

      // 1階層目が表示されている
      expect(result.current.categoryLevels.length).toBe(1);

      // 1階層目を選択
      const level1Id = categoryData.categories[0].id;
      act(() => {
        result.current.handleCategoryChange(0, level1Id);
      });

      await waitFor(() => {
        // 2階層目が表示される
        expect(result.current.categoryLevels.length).toBe(2);
        expect(result.current.categoryLevels[1].length).toBeGreaterThan(0);
      });
    });

    it('3階層のカテゴリーの場合、2つ目を選択すると3つ目が表示される', async () => {
      const categoryData = generateCategoryTree(3);
      mockFetchCategories.mockResolvedValue(categoryData);

      const { result } = renderHook(() => useCategorySelector(mockOnCategoryIdChange), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isCategoriesLoading).toBe(false);
      });

      // 1階層目を選択
      const level1Id = categoryData.categories[0].id;
      act(() => {
        result.current.handleCategoryChange(0, level1Id);
      });

      await waitFor(() => {
        expect(result.current.categoryLevels.length).toBe(2);
      });

      // 2階層目を選択
      const level2Id = categoryData.categories[0].children![0].id;
      act(() => {
        result.current.handleCategoryChange(1, level2Id);
      });

      await waitFor(() => {
        // 3階層目が表示される
        expect(result.current.categoryLevels.length).toBe(3);
        expect(result.current.categoryLevels[2].length).toBeGreaterThan(0);
      });
    });

    it('最大3階層まで表示される', async () => {
      const categoryData = generateCategoryTree(3);
      mockFetchCategories.mockResolvedValue(categoryData);

      const { result } = renderHook(() => useCategorySelector(mockOnCategoryIdChange), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isCategoriesLoading).toBe(false);
      });

      // 1階層目を選択
      act(() => {
        result.current.handleCategoryChange(0, categoryData.categories[0].id);
      });

      // 2階層目を選択
      await waitFor(() => {
        expect(result.current.categoryLevels.length).toBe(2);
      });

      act(() => {
        result.current.handleCategoryChange(1, categoryData.categories[0].children![0].id);
      });

      // 3階層目まで表示
      await waitFor(() => {
        expect(result.current.categoryLevels.length).toBe(3);
      });

      // それ以上は増えない
      expect(result.current.categoryLevels.length).toBeLessThanOrEqual(3);
    });
  });

  describe('カテゴリー選択のクリア', () => {
    it('選択を解除すると、それ以降の階層がクリアされる', async () => {
      const categoryData = generateCategoryTree(3);
      mockFetchCategories.mockResolvedValue(categoryData);

      const { result } = renderHook(() => useCategorySelector(mockOnCategoryIdChange), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isCategoriesLoading).toBe(false);
      });

      // 3階層すべて選択
      act(() => {
        result.current.handleCategoryChange(0, categoryData.categories[0].id);
      });

      await waitFor(() => {
        expect(result.current.categoryLevels.length).toBe(2);
      });

      act(() => {
        result.current.handleCategoryChange(1, categoryData.categories[0].children![0].id);
      });

      await waitFor(() => {
        expect(result.current.categoryLevels.length).toBe(3);
      });

      // 1階層目の選択を解除
      act(() => {
        result.current.handleCategoryChange(0, '');
      });

      await waitFor(() => {
        expect(result.current.selectedCategories.length).toBe(0);
        expect(result.current.categoryLevels.length).toBe(1);
      });
    });
  });

  describe('カテゴリー検索', () => {
    it('findCategoryByIdで正しいカテゴリーが取得できる', async () => {
      const categoryData = generateCategoryTree(2);
      mockFetchCategories.mockResolvedValue(categoryData);

      const { result } = renderHook(() => useCategorySelector(mockOnCategoryIdChange), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isCategoriesLoading).toBe(false);
      });

      const level1Category = result.current.findCategoryById(categoryData.categories[0].id);
      expect(level1Category).toBeDefined();
      expect(level1Category?.name).toBe('カテゴリー1');

      const level2Category = result.current.findCategoryById(categoryData.categories[0].children![0].id);
      expect(level2Category).toBeDefined();
      expect(level2Category?.name).toBe('カテゴリー1-1');
    });

    it('存在しないIDの場合はnullが返る', async () => {
      const categoryData = generateCategoryTree(1);
      mockFetchCategories.mockResolvedValue(categoryData);

      const { result } = renderHook(() => useCategorySelector(mockOnCategoryIdChange), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isCategoriesLoading).toBe(false);
      });

      const notFoundCategory = result.current.findCategoryById('not-exist-id');
      expect(notFoundCategory).toBeNull();
    });
  });
});
