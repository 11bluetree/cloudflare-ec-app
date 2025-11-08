/**
 * 商品関連のAPI通信関数
 */

import type {
  CreateProductRequest,
  CreateProductResponse,
  ProductListQuery,
  ProductListResponse,
} from '@cloudflare-ec-app/types';
import { apiGet, apiPost } from '../api';

/**
 * 商品一覧を取得（コマース向け）
 */
export const fetchProducts = async (query: ProductListQuery): Promise<ProductListResponse> => {
  const params = new URLSearchParams();

  // クエリパラメータを構築
  params.append('page', query.page.toString());
  params.append('perPage', query.perPage.toString());

  if (query.categoryId) {
    params.append('categoryId', query.categoryId);
  }

  if (query.keyword) {
    params.append('keyword', query.keyword);
  }

  if (query.minPrice !== undefined) {
    params.append('minPrice', query.minPrice.toString());
  }

  if (query.maxPrice !== undefined) {
    params.append('maxPrice', query.maxPrice.toString());
  }

  if (query.statuses && query.statuses.length > 0) {
    query.statuses.forEach((status) => {
      params.append('statuses', status);
    });
  }

  params.append('sortBy', query.sortBy);
  params.append('order', query.order);

  return await apiGet<ProductListResponse>(`/api/products?${params.toString()}`);
};

/**
 * 管理画面用：商品一覧を取得（バリアントなし商品も含む）
 */
export const fetchAdminProducts = async (query: ProductListQuery): Promise<ProductListResponse> => {
  const params = new URLSearchParams();

  // クエリパラメータを構築
  params.append('page', query.page.toString());
  params.append('perPage', query.perPage.toString());

  if (query.categoryId) {
    params.append('categoryId', query.categoryId);
  }

  if (query.keyword) {
    params.append('keyword', query.keyword);
  }

  if (query.minPrice !== undefined) {
    params.append('minPrice', query.minPrice.toString());
  }

  if (query.maxPrice !== undefined) {
    params.append('maxPrice', query.maxPrice.toString());
  }

  if (query.statuses && query.statuses.length > 0) {
    query.statuses.forEach((status) => {
      params.append('statuses', status);
    });
  }

  params.append('sortBy', query.sortBy);
  params.append('order', query.order);

  return await apiGet<ProductListResponse>(`/api/admin/products?${params.toString()}`);
};

/**
 * 商品を登録
 */
export const createProduct = async (data: CreateProductRequest): Promise<CreateProductResponse> => {
  return await apiPost<CreateProductResponse>('/api/products', data);
};
