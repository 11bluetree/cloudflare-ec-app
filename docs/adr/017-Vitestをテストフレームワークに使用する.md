# ADR-017: Vitestをテストフレームワークに使用する

## ステータス

- [x] 承認
- [ ] 保留
- [ ] 却下

## 論点

単体テスト・統合テストのフレームワークとして何を使用するか。

## 決定事項

Vitestをテストフレームワークとして使用する。

## 決定理由

### Vitestの採用理由

- **Viteとの完全な統合**: 本プロジェクトはViteをビルドツールとして採用しており、Vitestは同じ設定を共有できる
- **高速な実行**: Viteの高速なHMRと同じ仕組みを使い、テストも高速に実行される
- **ESM対応**: ネイティブESMをサポートし、最新のJavaScript機能をそのまま使える
- **TypeScript統合**: 追加の設定なしでTypeScriptをサポート
- **Jest互換API**: Jestと同じAPIを提供しているため、学習コストが低い
- **モダンなツール**: 2021年以降に開発された最新のテストフレームワーク

### Jestを採用しない理由

1. **ESM対応の問題**
   - Jestは元々CommonJS向けに設計されており、ESMサポートが実験的
   - 本プロジェクトはESM（`"type": "module"`）を採用しているため、Jestでは追加の設定が必要
   - `jest.config.js`、`babel.config.js`、`ts-jest`などの複雑な設定が必要になる

2. **Viteとの統合の弱さ**
   - Jestは独自のモジュール解決とトランスパイルを行うため、Viteと設定が二重管理になる
   - `vite.config.ts`と`jest.config.js`で異なるパスエイリアスやプラグイン設定を維持する必要がある

3. **パフォーマンス**
   - Jestは全ファイルをトランスパイルしてからテストを実行するため、起動が遅い
   - Vitestはオンデマンドでトランスパイルするため、初回実行も高速

4. **依存関係の増加**
   - Jestを使う場合: `jest`、`ts-jest`、`@types/jest`、`babel`関連パッケージが必要
   - Vitestを使う場合: `vitest`のみで完結（Viteは既に導入済み）

### 比較表

| 項目 | Vitest | Jest |
|------|--------|------|
| **Vite統合** | ✅ ネイティブ統合 | ❌ 別途設定が必要 |
| **ESM対応** | ✅ ネイティブサポート | ⚠️ 実験的サポート |
| **起動速度** | ✅ 高速 | ❌ 遅い |
| **TypeScript** | ✅ 設定不要 | ⚠️ ts-jest が必要 |
| **API互換性** | ✅ Jest互換 | ✅ Jest本家 |
| **設定の複雑さ** | ✅ シンプル | ❌ 複雑 |
| **依存関係** | ✅ 少ない | ❌ 多い |
| **コミュニティ** | ⚠️ 新しい | ✅ 成熟 |

## 代替案

### Jest

- **メリット**:
  - 成熟したエコシステム
  - 豊富なドキュメントとコミュニティ
  - スナップショットテストなどの機能が充実

- **デメリット**:
  - ESM対応が実験的
  - Viteとの統合に追加設定が必要
  - 起動が遅い
  - 依存関係が増える

### Node.js Test Runner

- **メリット**:
  - Node.js標準機能（外部依存なし）
  - シンプルで軽量

- **デメリット**:
  - 機能が限定的
  - モックやスナップショット機能がない
  - TypeScriptサポートが弱い

## 実装方針

### 基本設定

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
});
```

### テストファイルの配置

- ドメインエンティティ: `apps/api/src/domain/entities/__tests__/*.test.ts`
- ユースケース: `apps/api/src/application/usecases/**/__tests__/*.test.ts`
- リポジトリ: `apps/api/src/infrastructure/**/__tests__/*.test.ts`

### package.jsonのスクリプト

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

## 影響範囲

- `apps/api/package.json`: vitestを追加
- `apps/web/package.json`: vitestを追加（フロントエンドテスト用）
- ルートの`package.json`: テストスクリプトを`vitest`に変更

## 参考資料

- [Vitest公式ドキュメント](https://vitest.dev/)
- [Why Vitest?](https://vitest.dev/guide/why.html)
- [Jest vs Vitest比較](https://vitest.dev/guide/comparisons.html)
