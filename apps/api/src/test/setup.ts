import Database from 'better-sqlite3';
import { afterAll, beforeAll } from 'vitest';
import { unstable_dev, type Unstable_DevWorker } from 'wrangler';

let worker: Unstable_DevWorker;
let db: ReturnType<typeof Database>;

beforeAll(async () => {
  // テスト用Workerを起動
  worker = await unstable_dev('./src/index.tsx', {
    config: 'wrangler.test.jsonc',
    experimental: {
      disableExperimentalWarning: true,
    },
  });

  // テスト用SQLiteファイルに接続
  const sqlitePath = process.env.SQLITE_PATH;
  if (!sqlitePath) {
    throw new Error('SQLITE_PATH environment variable is not set. Please set it to the test database path.');
  }

  db = new Database(sqlitePath);
});

afterAll(async () => {
  // クリーンアップ
  if (db) {
    db.close();
  }
  if (worker) {
    await worker.stop();
  }
});

export { db, worker };
