import { afterAll, beforeAll } from 'vitest';
import { getPlatformProxy } from 'wrangler';

let platformProxy: Awaited<ReturnType<typeof getPlatformProxy<Env>>>;

beforeAll(async () => {
  // wrangler.test.jsonc の設定でプラットフォームプロキシを起動
  platformProxy = await getPlatformProxy<Env>({
    configPath: 'wrangler.test.jsonc',
  });
});

afterAll(async () => {
  // クリーンアップ
  await platformProxy?.dispose();
});

// env をエクスポート（テストから使用）
export function getEnv() {
  if (!platformProxy) {
    throw new Error('Platform proxy not initialized');
  }
  return platformProxy.env;
}
