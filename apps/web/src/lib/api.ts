/**
 * API通信ユーティリティ
 * CSRF対策とCORS設定を含む
 */

/**
 * CookieからCSRFトークンを取得
 */
export const getCsrfToken = (): string | null => {
  const match = document.cookie.match(/csrf-token=([^;]+)/)
  return match ? match[1] : null
}

/**
 * APIのベースURL
 */
export const getApiBaseUrl = (): string => {
  // 開発環境
  if (import.meta.env.DEV) {
    return 'http://localhost:3000'
  }
  // 本番環境
  return import.meta.env.VITE_API_URL || 'https://api.bluetree-hono.workers.dev'
}

/**
 * API共通リクエストオプション
 */
const getDefaultHeaders = (includeAuth = true): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  // CSRFトークンを追加
  const csrfToken = getCsrfToken()
  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken
  }

  // 認証トークン（将来的にAuth.jsのセッションを使用）
  if (includeAuth) {
    // TODO: Auth.js実装時に追加
  }

  return headers
}

/**
 * APIリクエストのラッパー関数
 */
interface ApiRequestOptions extends RequestInit {
  includeAuth?: boolean
}

export const apiRequest = async <T>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> => {
  const { includeAuth = true, ...fetchOptions } = options

  const url = `${getApiBaseUrl()}${endpoint}`

  const response = await fetch(url, {
    ...fetchOptions,
    headers: {
      ...getDefaultHeaders(includeAuth),
      ...fetchOptions.headers,
    },
    credentials: 'include', // Cookieを含める（Auth.js用）
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: 'APIリクエストに失敗しました',
    }))
    throw new Error(error.message || `HTTP Error: ${response.status}`)
  }

  return response.json()
}

/**
 * GET リクエスト
 */
export const apiGet = <T>(endpoint: string, options?: ApiRequestOptions): Promise<T> => {
  return apiRequest<T>(endpoint, { ...options, method: 'GET' })
}

/**
 * POST リクエスト
 */
export const apiPost = <T>(
  endpoint: string,
  data?: unknown,
  options?: ApiRequestOptions
): Promise<T> => {
  return apiRequest<T>(endpoint, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  })
}

/**
 * PUT リクエスト
 */
export const apiPut = <T>(
  endpoint: string,
  data?: unknown,
  options?: ApiRequestOptions
): Promise<T> => {
  return apiRequest<T>(endpoint, {
    ...options,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  })
}

/**
 * DELETE リクエスト
 */
export const apiDelete = <T>(endpoint: string, options?: ApiRequestOptions): Promise<T> => {
  return apiRequest<T>(endpoint, { ...options, method: 'DELETE' })
}
