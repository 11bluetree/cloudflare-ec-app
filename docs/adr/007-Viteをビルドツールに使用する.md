# ADR-007: Viteをビルドツールに使用する

## ステータス

- [x] 承認
- [ ] 保留
- [ ] 却下

## 論点

フロントエンドとバックエンドのビルドにどのツールを使用するか。

## 決定事項

Viteをビルドツールとして使用する。フロントエンドは`@vitejs/plugin-react`、バックエンドは`@cloudflare/vite-plugin`を使用する。

## 決定理由

- **高速開発サーバー**: ESMベースのネイティブブラウザサポートにより、バンドル不要で即座に起動
- **HMR**: 高速なHot Module Replacementで開発体験が向上
- **Cloudflare統合**: `@cloudflare/vite-plugin`により、Workers開発がシームレス
- **最適化されたビルド**: Rollupベースで本番ビルドが最適化される（webではrolldown-viteを使用してさらに高速化）
- **プラグインエコシステム**: TanStack Router、React、Tailwind CSS等の主要ツールが公式サポート
- **設定シンプル**: 最小限の設定でTypeScript、JSX、CSS等が動作

## 代替案

### Webpack

- 成熟しているが、設定が複雑で開発サーバーの起動が遅い
- モダンなESM環境への対応が遅れている

### esbuild単体

- 極めて高速だが、プラグインエコシステムが限定的
- 開発サーバーやHMRの機能が不足

### Parcel

- ゼロコンフィグが魅力だが、Cloudflare Workers環境のサポートが不十分
- 大規模プロジェクトでのパフォーマンスに課題
