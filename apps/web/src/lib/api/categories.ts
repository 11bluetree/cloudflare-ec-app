/**
 * カテゴリー関連のAPI通信関数
 */

import type { CategoryListResponse } from '@cloudflare-ec-app/types';
import { apiGet } from '../api';

/**
 * カテゴリー一覧を取得
 */
export const fetchCategories = async (): Promise<CategoryListResponse> => {
  return await apiGet<CategoryListResponse>('/api/categories');
};
