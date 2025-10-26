# ADR-016: CSRFトークンで状態変更エンドポイントを保護する

## ステータス

- [x] 承認
- [ ] 保留
- [ ] 却下

## 論点

状態を変更するAPIエンドポイント（POST/PUT/DELETE）に対するCSRF攻撃をどのように防ぐか。

## 決定事項

HonoのCSRFミドルウェアを使用して、状態を変更するエンドポイントを保護する。

## 決定理由

- **Auth.jsの保護範囲**: Auth.jsは認証エンドポイント（`/api/auth/*`）のみCSRF保護を提供
- **追加保護の必要性**: カート、注文、商品管理等のエンドポイントには別途CSRF対策が必要
- **シンプルな実装**: HonoのビルトインCSRFミドルウェアで簡単に実装可能
- **柔軟性**: エンドポイント単位で保護を適用できる
- **PRD準拠**: セキュリティ要件に「CSRF対策」が明記されている

## 実装方針

### 保護対象エンドポイント

- `/api/cart/*` - カート操作（POST/PUT/DELETE）
- `/api/orders/*` - 注文処理（POST/PUT/DELETE）
- `/api/users/*` - ユーザー情報更新（PUT）
- `/api/products` - 商品管理（POST/PUT/DELETE）※GETは除外
- `/api/categories` - カテゴリー管理（POST/PUT/DELETE）※GETは除外

### 除外するエンドポイント

- `/api/auth/*` - Auth.js独自のCSRF保護を使用
- 読み取り専用（GET）エンドポイント - CSRF攻撃の対象外

### フロントエンド側の実装

```typescript
// CSRFトークンを取得（HonoのCSRFミドルウェアがCookieに設定）
const csrfToken = getCookie('csrf-token')

// リクエスト時にヘッダーに含める
fetch('/api/cart', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken,
  },
  credentials: 'include',
  body: JSON.stringify(data),
})
```

## 決定の影響

### メリット

- CSRF攻撃から保護される
- Auth.jsと共存可能
- 実装コストが低い
- Honoの標準機能のため保守性が高い

### デメリット

- フロントエンド側でCSRFトークンの取得・送信処理が必要
- ステートレスなAPI設計にはならない（トークン管理が必要）

## 代替案

### SameSite Cookie + Origin検証のみ

- Auth.jsのセッションCookieを`SameSite=Lax`に設定
- `Origin`/`Referer`ヘッダーを検証
- **却下理由**: PRDで明示的にCSRF対策が要求されており、より強固な保護が望ましい

### トークンベース認証（JWT + Authorizationヘッダー）

- JWTをlocalStorageに保存し、Authorizationヘッダーで送信
- CSRF攻撃は成立しない
- **却下理由**: ADR-012でAuth.js（Cookieベース）を採用済み。変更するには大きな設計変更が必要

## 参考資料

- [Hono CSRF Middleware](https://hono.dev/middleware/builtin/csrf)
- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [Auth.js Security](https://authjs.dev/getting-started/introduction#security)
