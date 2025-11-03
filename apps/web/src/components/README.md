# UIコンポーネント

このディレクトリには、再利用可能なUIコンポーネントが含まれています。

## 使用ライブラリ

- **@radix-ui/react-label** - アクセシブルなフォームコンポーネント
- **class-variance-authority (cva)** - バリアントベースのスタイリング
- **clsx** + **tailwind-merge** - 条件付きクラス名とTailwindクラスのマージ（`src/lib/utils.ts`の`cn`関数）

## ディレクトリ構造

```text
components/
├── ui/                      # 汎用UIコンポーネント（Button, Input, Label, Pagination, EmptyState等）
│   ├── *.tsx
│   └── index.ts            # 一括エクスポート
├── *.tsx                    # ドメイン固有コンポーネント（ProductCard, ProductSearchForm等）
└── index.ts                # 一括エクスポート
```

## 設計原則

- **単一責任** - 各コンポーネントは1つの責任のみ
- **型安全性** - TypeScriptで完全に型付け
- **アクセシビリティ** - Radix UIを活用してWCAG準拠
- **カスタマイズ性** - `className`プロパティでスタイルの上書きが可能
