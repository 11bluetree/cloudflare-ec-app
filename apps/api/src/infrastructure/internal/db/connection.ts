import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

/**
 * Drizzle ORMのコネクションを作成
 * @param d1Database - Cloudflare D1 Databaseインスタンス
 */
export function createDbConnection(d1Database: D1Database) {
  return drizzle(d1Database, { schema });
}

/**
 * Drizzle ORM DB型（スキーマ込み）
 */
export type DrizzleDB = ReturnType<typeof createDbConnection>;
