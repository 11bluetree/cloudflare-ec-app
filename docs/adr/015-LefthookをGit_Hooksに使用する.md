# ADR-015: Lefthookを Git Hooksに使用する

## ステータス

- [x] 承認
- [ ] 保留
- [ ] 却下

## 論点

コミット前にコード品質チェックをどのように自動化するか。

## 決定事項

Lefthookを使用してGit Hooksを管理する。

## 決定理由

- **高速**: Go製で起動が高速（huskyと比較して数倍高速）
- **設定シンプル**: YAMLファイル（`lefthook.yml`）で宣言的に設定
- **パラレル実行**: 複数のタスクを並列実行でき、フック実行時間を短縮
- **軽量**: Node.js依存がなく、バイナリ単体で動作
- **クロスプラットフォーム**: Windows、macOS、Linux全てで動作
- **柔軟性**: pre-commit、pre-push等の各種フックに対応

## 代替案

### Husky

- 最も人気があるが、Node.js依存でLefthookより遅い
- 設定がシェルスクリプトベースで複雑になりがち

### pre-commit（Python）

- Pythonエコシステムのツールで、JavaScript/TypeScriptプロジェクトには不自然
- 追加のランタイム依存が必要

### lint-staged単体

- ステージングされたファイルのみlintできるが、Git Hooks管理機能はない
- 別途huskyやlefthookが必要
