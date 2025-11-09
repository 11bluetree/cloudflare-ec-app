import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchCategories } from '../api/categories';

export type CategoryTreeNode = {
  id: string;
  name: string;
  children?: CategoryTreeNode[];
};

/**
 * カテゴリー選択のカスタムフック
 */
export const useCategorySelector = (onCategoryIdChange: (categoryId: string) => void) => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const { data: categoryData, isLoading: isCategoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  // 指定されたIDのカテゴリーを見つける
  const findCategoryById = (id: string): CategoryTreeNode | null => {
    if (!categoryData) return null;
    const nodes = categoryData.categories;
    const search = (nodeList: CategoryTreeNode[]): CategoryTreeNode | null => {
      for (const node of nodeList) {
        if (node.id === id) return node;
        if (node.children) {
          const found = search(node.children);
          if (found) return found;
        }
      }
      return null;
    };
    return search(nodes);
  };

  // 選択されたカテゴリーから階層を構築
  const buildCategoryLevels = (): CategoryTreeNode[][] => {
    if (!categoryData) return [];

    const levels: CategoryTreeNode[][] = [];
    levels.push(categoryData.categories); // 第1階層

    for (const selectedId of selectedCategories) {
      const category = findCategoryById(selectedId);
      if (category?.children && category.children.length > 0) {
        levels.push(category.children);
      }
    }

    return levels;
  };

  const categoryLevels = buildCategoryLevels();

  // カテゴリー選択変更ハンドラ
  const handleCategoryChange = (levelIndex: number, value: string) => {
    if (value) {
      // 現在の階層までを保持し、それ以降をクリア
      const newSelected = selectedCategories.slice(0, levelIndex);
      newSelected.push(value);
      setSelectedCategories(newSelected);
    } else {
      // 選択解除した場合、この階層以降をクリア
      setSelectedCategories(selectedCategories.slice(0, levelIndex));
    }
  };

  // 選択されたカテゴリーが変更されたら、最後に選択されたIDをフォームにセット
  useEffect(() => {
    if (selectedCategories.length > 0) {
      const lastSelectedId = selectedCategories[selectedCategories.length - 1];
      onCategoryIdChange(lastSelectedId);
    } else {
      onCategoryIdChange('');
    }
  }, [selectedCategories, onCategoryIdChange]);

  return {
    selectedCategories,
    categoryLevels,
    isCategoriesLoading,
    handleCategoryChange,
    findCategoryById,
  };
};
