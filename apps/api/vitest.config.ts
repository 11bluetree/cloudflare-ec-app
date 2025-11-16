import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig(() => ({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
    env: loadEnv('test', process.cwd(), ''),
    // リポジトリテストは並列実行時にDBロックが発生するため、順次実行
    // TODO: 将来的に各テストごとに独立したDBを用意するように改善する。もしくはtestcontainers等を利用してDBの並列実行を可能にする。
    fileParallelism: false,
  },
}));
