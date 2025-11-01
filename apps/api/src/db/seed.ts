/* eslint-disable no-console */
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from '../infrastructure/internal/db/schema';
import { ulid } from 'ulid';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const {
  categoriesTable,
  productsTable,
  productVariantsTable,
  productImagesTable,
} = schema;

async function runMigrations(client: ReturnType<typeof createClient>) {
  console.log('📋 Running migrations...');
  
  const migrationsDir = join(process.cwd(), 'drizzle');
  const migrationFiles = readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();

  for (const file of migrationFiles) {
    console.log(`  Applying ${file}...`);
    const sql = readFileSync(join(migrationsDir, file), 'utf-8');
    
    // SQLファイルを複数のステートメントに分割して実行
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    for (const statement of statements) {
      await client.execute(statement);
    }
  }
  
  console.log('✅ Migrations applied successfully');
}

async function seed() {
  // ローカルD1データベースに接続
  const client = createClient({
    url: 'file:.wrangler/state/v3/d1/miniflare-D1DatabaseObject/4a472e75-3ca9-4cd0-a2d8-006f2a016a1d.sqlite',
  });

  const db = drizzle(client, { schema });

  console.log('🌱 Seeding database...');

  try {
    // マイグレーションを実行
    await runMigrations(client);
  } catch (error) {
    console.log('⚠️  Migration error (might be already applied):', (error as Error).message);
  }

  try {
    // カテゴリーを作成
    console.log('Creating categories...');
    const categories = [
      { id: ulid(), name: 'エレクトロニクス', parentId: null, displayOrder: 1 },
      { id: ulid(), name: 'ファッション', parentId: null, displayOrder: 2 },
      { id: ulid(), name: '本・雑誌', parentId: null, displayOrder: 3 },
      { id: ulid(), name: 'ホーム・キッチン', parentId: null, displayOrder: 4 },
    ];

    await db.insert(categoriesTable).values(
      categories.map(cat => ({
        ...cat,
        createdAt: new Date(),
        updatedAt: new Date(),
      }))
    );
    console.log(`✅ Created ${categories.length} categories`);

    // 商品を作成
    console.log('Creating products...');
    const products = [
      {
        id: ulid(),
        name: 'ワイヤレスイヤホン Pro',
        description: '高音質のワイヤレスイヤホン。ノイズキャンセリング機能付き。',
        categoryId: categories[0].id,
        status: 'published' as const,
      },
      {
        id: ulid(),
        name: 'スマートウォッチ X5',
        description: '健康管理とフィットネストラッキングに最適なスマートウォッチ。',
        categoryId: categories[0].id,
        status: 'published' as const,
      },
      {
        id: ulid(),
        name: 'カジュアルTシャツ',
        description: '快適な着心地の定番Tシャツ。様々なカラーバリエーション。',
        categoryId: categories[1].id,
        status: 'published' as const,
      },
      {
        id: ulid(),
        name: 'デニムパンツ',
        description: 'スタイリッシュなデニムパンツ。どんなシーンにも合わせやすい。',
        categoryId: categories[1].id,
        status: 'published' as const,
      },
      {
        id: ulid(),
        name: 'プログラミング入門書',
        description: '初心者向けのプログラミング学習本。実践的な内容が充実。',
        categoryId: categories[2].id,
        status: 'published' as const,
      },
    ];

    await db.insert(productsTable).values(
      products.map(prod => ({
        ...prod,
        createdAt: new Date(),
        updatedAt: new Date(),
      }))
    );
    console.log(`✅ Created ${products.length} products`);

    // 商品バリアントを作成
    console.log('Creating product variants...');
    const variants = [
      // ワイヤレスイヤホン
      { id: ulid(), productId: products[0].id, sku: 'WEP-BLK-001', price: 15800, stockQuantity: 50, size: null, color: 'ブラック', displayOrder: 1 },
      { id: ulid(), productId: products[0].id, sku: 'WEP-WHT-001', price: 15800, stockQuantity: 30, size: null, color: 'ホワイト', displayOrder: 2 },
      
      // スマートウォッチ
      { id: ulid(), productId: products[1].id, sku: 'SWX5-BLK-001', price: 32000, stockQuantity: 20, size: null, color: 'ブラック', displayOrder: 1 },
      { id: ulid(), productId: products[1].id, sku: 'SWX5-SLV-001', price: 32000, stockQuantity: 15, size: null, color: 'シルバー', displayOrder: 2 },
      
      // Tシャツ
      { id: ulid(), productId: products[2].id, sku: 'TSH-BLK-S', price: 2980, stockQuantity: 100, size: 'S', color: 'ブラック', displayOrder: 1 },
      { id: ulid(), productId: products[2].id, sku: 'TSH-BLK-M', price: 2980, stockQuantity: 150, size: 'M', color: 'ブラック', displayOrder: 2 },
      { id: ulid(), productId: products[2].id, sku: 'TSH-BLK-L', price: 2980, stockQuantity: 120, size: 'L', color: 'ブラック', displayOrder: 3 },
      { id: ulid(), productId: products[2].id, sku: 'TSH-WHT-M', price: 2980, stockQuantity: 80, size: 'M', color: 'ホワイト', displayOrder: 4 },
      
      // デニムパンツ
      { id: ulid(), productId: products[3].id, sku: 'DEN-BLU-28', price: 8900, stockQuantity: 40, size: '28', color: 'ブルー', displayOrder: 1 },
      { id: ulid(), productId: products[3].id, sku: 'DEN-BLU-30', price: 8900, stockQuantity: 60, size: '30', color: 'ブルー', displayOrder: 2 },
      { id: ulid(), productId: products[3].id, sku: 'DEN-BLU-32', price: 8900, stockQuantity: 50, size: '32', color: 'ブルー', displayOrder: 3 },
      
      // プログラミング入門書
      { id: ulid(), productId: products[4].id, sku: 'BOOK-PROG-001', price: 3200, stockQuantity: 200, size: null, color: null, displayOrder: 1 },
    ];

    await db.insert(productVariantsTable).values(
      variants.map(variant => ({
        ...variant,
        createdAt: new Date(),
        updatedAt: new Date(),
      }))
    );
    console.log(`✅ Created ${variants.length} product variants`);

    // 商品画像を作成（ダミーURL）
    console.log('Creating product images...');
    const images = [
      { id: ulid(), productId: products[0].id, productVariantId: null, imageUrl: 'https://placehold.co/600x400/000000/FFFFFF/png?text=Wireless+Earphones', displayOrder: 1 },
      { id: ulid(), productId: products[1].id, productVariantId: null, imageUrl: 'https://placehold.co/600x400/1E3A8A/FFFFFF/png?text=Smart+Watch', displayOrder: 1 },
      { id: ulid(), productId: products[2].id, productVariantId: null, imageUrl: 'https://placehold.co/600x400/DC2626/FFFFFF/png?text=T-Shirt', displayOrder: 1 },
      { id: ulid(), productId: products[3].id, productVariantId: null, imageUrl: 'https://placehold.co/600x400/2563EB/FFFFFF/png?text=Denim+Pants', displayOrder: 1 },
      { id: ulid(), productId: products[4].id, productVariantId: null, imageUrl: 'https://placehold.co/600x400/059669/FFFFFF/png?text=Programming+Book', displayOrder: 1 },
    ];

    await db.insert(productImagesTable).values(
      images.map(img => ({
        ...img,
        createdAt: new Date(),
      }))
    );
    console.log(`✅ Created ${images.length} product images`);

    console.log('✅ Database seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    client.close();
  }
}

seed();
