/**
 * D1データベースのシードデータスクリプト
 *
 * 実行方法: pnpm db:seed
 */

/* eslint-disable no-console */

import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { ulid } from 'ulid';
import {
  categories,
  products,
  productOptions,
  productOptionValues,
  productVariants,
  productVariantOptions,
  productImages,
  type InsertCategory,
  type InsertProduct,
  type InsertProductOption,
  type InsertProductOptionValue,
  type InsertProductVariant,
  type InsertProductVariantOption,
  type InsertProductImage,
} from '../infrastructure/internal/db/schema';

// ローカルD1データベースのパスを取得
const localDbPath = process.env.DB_FILE_PATH!;

async function seed() {
  console.log('🌱 Seeding database...');

  // ローカルD1に接続
  const client = createClient({
    url: `file:${localDbPath}`,
  });

  const db = drizzle(client);

  try {
    // ============================================================================
    // 1. カテゴリーを作成
    // ============================================================================
    console.log('📁 Creating categories...');

    const categoryId = ulid();
    const categoryData: InsertCategory = {
      name: 'Tシャツ',
      parentId: null,
      displayOrder: 1,
    };

    await db.insert(categories).values({
      id: categoryId,
      ...categoryData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log(`✅ Created category: ${categoryData.name} (${categoryId})`);

    // ============================================================================
    // 2. 商品1: ベーシックTシャツ（1種類のバリアント）
    // ============================================================================
    console.log('\n👕 Creating Product 1: ベーシックTシャツ...');

    const product1Id = ulid();
    const product1Data: InsertProduct = {
      name: 'ベーシックTシャツ',
      description: 'シンプルで着心地の良いベーシックなTシャツです。日常使いに最適な定番アイテム。',
      categoryId,
      status: 'published',
    };

    await db.insert(products).values({
      id: product1Id,
      ...product1Data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log(`✅ Created product: ${product1Data.name} (${product1Id})`);

    // 商品1のオプション定義（デフォルトバリアント用）
    const defaultOption1Id = ulid();
    const defaultOption1Data: InsertProductOption = {
      productId: product1Id,
      optionName: 'title',
      displayOrder: 1,
    };

    await db.insert(productOptions).values({
      id: defaultOption1Id,
      ...defaultOption1Data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log(`  ✅ Created option: ${defaultOption1Data.optionName}`);

    // オプション値（default）
    const defaultValue1Id = ulid();
    const defaultValue1Data: InsertProductOptionValue = {
      productOptionId: defaultOption1Id,
      value: 'default',
      displayOrder: 1,
    };

    await db.insert(productOptionValues).values({
      id: defaultValue1Id,
      ...defaultValue1Data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log('    ✅ Created option value: default');

    // 商品1のバリアント（単品商品）
    const variant1Id = ulid();
    const variant1Data: InsertProductVariant = {
      productId: product1Id,
      sku: 'BASIC-TSH-001',
      barcode: '4901234567890',
      imageUrl: 'https://placehold.co/600x600/e3e3e3/333333?text=Basic+T-Shirt',
      price: 2980,
      displayOrder: 1,
    };

    await db.insert(productVariants).values({
      id: variant1Id,
      ...variant1Data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log(`  ✅ Created variant: ${variant1Data.sku} (¥${variant1Data.price})`);

    // バリアントオプション（デフォルト）
    const variantOption1Id = ulid();
    const variantOption1Data: InsertProductVariantOption = {
      productVariantId: variant1Id,
      optionName: 'title',
      optionValue: 'default',
      displayOrder: 0,
    };

    await db.insert(productVariantOptions).values({
      id: variantOption1Id,
      ...variantOption1Data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log('    ✅ Linked option: title = default');

    // 商品1の画像
    const image1Id = ulid();
    const image1Data: InsertProductImage = {
      productId: product1Id,
      productVariantId: variant1Id,
      imageUrl: 'https://placehold.co/800x800/e3e3e3/333333?text=Basic+T-Shirt+Front',
      displayOrder: 1,
    };

    await db.insert(productImages).values({
      id: image1Id,
      ...image1Data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log('  ✅ Created image for variant');

    // ============================================================================
    // 3. 商品2: プレミアムTシャツ（3種類のバリアント: S, M, L）
    // ============================================================================
    console.log('\n👕 Creating Product 2: プレミアムTシャツ...');

    const product2Id = ulid();
    const product2Data: InsertProduct = {
      name: 'プレミアムTシャツ',
      description: '高品質なコットン100%を使用したプレミアムTシャツ。肌触りが良く、長時間着ても快適です。',
      categoryId,
      status: 'published',
    };

    await db.insert(products).values({
      id: product2Id,
      ...product2Data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log(`✅ Created product: ${product2Data.name} (${product2Id})`);

    // 商品2のオプション定義（サイズ）
    const sizeOptionId = ulid();
    const sizeOptionData: InsertProductOption = {
      productId: product2Id,
      optionName: 'サイズ',
      displayOrder: 1,
    };

    await db.insert(productOptions).values({
      id: sizeOptionId,
      ...sizeOptionData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log(`  ✅ Created option: ${sizeOptionData.optionName}`);

    // オプション値（S, M, L）
    const sizeValues = ['S', 'M', 'L'];
    const sizeValueIds: Record<string, string> = {};

    for (let i = 0; i < sizeValues.length; i++) {
      const valueId = ulid();
      sizeValueIds[sizeValues[i]] = valueId;

      const valueData: InsertProductOptionValue = {
        productOptionId: sizeOptionId,
        value: sizeValues[i],
        displayOrder: i + 1,
      };

      await db.insert(productOptionValues).values({
        id: valueId,
        ...valueData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log(`    ✅ Created option value: ${sizeValues[i]}`);
    }

    // 商品2のバリアント（3種類: S, M, L）
    const variantConfigs = [
      { size: 'S', sku: 'PREM-TSH-S-001', barcode: '4901234567891', price: 4980 },
      { size: 'M', sku: 'PREM-TSH-M-001', barcode: '4901234567892', price: 4980 },
      { size: 'L', sku: 'PREM-TSH-L-001', barcode: '4901234567893', price: 4980 },
    ];

    for (let i = 0; i < variantConfigs.length; i++) {
      const config = variantConfigs[i];
      const variantId = ulid();

      const variantData: InsertProductVariant = {
        productId: product2Id,
        sku: config.sku,
        barcode: config.barcode,
        imageUrl: `https://placehold.co/600x600/4a90e2/ffffff?text=Premium+${config.size}`,
        price: config.price,
        displayOrder: i + 1,
      };

      await db.insert(productVariants).values({
        id: variantId,
        ...variantData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log(`  ✅ Created variant: ${variantData.sku} - ${config.size} (¥${variantData.price})`);

      // バリアントオプション（サイズ）
      const variantOptionId = ulid();
      const variantOptionData: InsertProductVariantOption = {
        productVariantId: variantId,
        optionName: 'サイズ',
        optionValue: config.size,
        displayOrder: 1,
      };

      await db.insert(productVariantOptions).values({
        id: variantOptionId,
        ...variantOptionData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log(`    ✅ Linked option: サイズ = ${config.size}`);

      // バリアントの画像
      const imageId = ulid();
      const imageData: InsertProductImage = {
        productId: product2Id,
        productVariantId: variantId,
        imageUrl: `https://placehold.co/800x800/4a90e2/ffffff?text=Premium+${config.size}+Front`,
        displayOrder: 1,
      };

      await db.insert(productImages).values({
        id: imageId,
        ...imageData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log('    ✅ Created image for variant');
    }

    // ============================================================================
    // 4. 商品3: カスタマイズTシャツ（色×サイズ×質感の組み合わせ）
    // ============================================================================
    console.log('\n👕 Creating Product 3: カスタマイズTシャツ...');

    const product3Id = ulid();
    const product3Data: InsertProduct = {
      name: 'カスタマイズTシャツ',
      description:
        '自分好みにカスタマイズできる高機能Tシャツ。色・サイズ・質感を自由に組み合わせて、あなただけの一枚を。',
      categoryId,
      status: 'published',
    };

    await db.insert(products).values({
      id: product3Id,
      ...product3Data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log(`✅ Created product: ${product3Data.name} (${product3Id})`);

    // 商品3のオプション定義（色、サイズ、質感）
    const colorOptionId = ulid();
    const colorOptionData: InsertProductOption = {
      productId: product3Id,
      optionName: '色',
      displayOrder: 1,
    };

    await db.insert(productOptions).values({
      id: colorOptionId,
      ...colorOptionData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log(`  ✅ Created option: ${colorOptionData.optionName}`);

    const sizeOption2Id = ulid();
    const sizeOption2Data: InsertProductOption = {
      productId: product3Id,
      optionName: 'サイズ',
      displayOrder: 2,
    };

    await db.insert(productOptions).values({
      id: sizeOption2Id,
      ...sizeOption2Data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log(`  ✅ Created option: ${sizeOption2Data.optionName}`);

    const textureOptionId = ulid();
    const textureOptionData: InsertProductOption = {
      productId: product3Id,
      optionName: '質感',
      displayOrder: 3,
    };

    await db.insert(productOptions).values({
      id: textureOptionId,
      ...textureOptionData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log(`  ✅ Created option: ${textureOptionData.optionName}`);

    // オプション値（色: 白、黒、グレー）
    const colorValues = ['白', '黒', 'グレー'];
    for (let i = 0; i < colorValues.length; i++) {
      const valueId = ulid();
      const valueData: InsertProductOptionValue = {
        productOptionId: colorOptionId,
        value: colorValues[i],
        displayOrder: i + 1,
      };

      await db.insert(productOptionValues).values({
        id: valueId,
        ...valueData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log(`    ✅ Created option value: 色 = ${colorValues[i]}`);
    }

    // オプション値（サイズ: S, M）
    const size2Values = ['S', 'M'];
    for (let i = 0; i < size2Values.length; i++) {
      const valueId = ulid();
      const valueData: InsertProductOptionValue = {
        productOptionId: sizeOption2Id,
        value: size2Values[i],
        displayOrder: i + 1,
      };

      await db.insert(productOptionValues).values({
        id: valueId,
        ...valueData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log(`    ✅ Created option value: サイズ = ${size2Values[i]}`);
    }

    // オプション値（質感: スムース、ラフ）
    const textureValues = ['スムース', 'ラフ'];
    for (let i = 0; i < textureValues.length; i++) {
      const valueId = ulid();
      const valueData: InsertProductOptionValue = {
        productOptionId: textureOptionId,
        value: textureValues[i],
        displayOrder: i + 1,
      };

      await db.insert(productOptionValues).values({
        id: valueId,
        ...valueData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log(`    ✅ Created option value: 質感 = ${textureValues[i]}`);
    }

    // 商品3のバリアント（色×サイズ×質感の組み合わせ = 3×2×2 = 12種類）
    const colorCodes: Record<string, string> = { 白: 'ffffff', 黒: '000000', グレー: '808080' };
    let variantCounter = 0;

    for (const color of colorValues) {
      for (const size of size2Values) {
        for (const texture of textureValues) {
          variantCounter++;
          const variantId = ulid();
          const colorCode = colorCodes[color];
          const textColor = color === '白' ? '333333' : 'ffffff';

          const variantData: InsertProductVariant = {
            productId: product3Id,
            sku: `CUSTOM-TSH-${color[0]}-${size}-${texture === 'スムース' ? 'SM' : 'RF'}-${variantCounter.toString().padStart(3, '0')}`,
            barcode: `490123456790${variantCounter}`,
            imageUrl: `https://placehold.co/600x600/${colorCode}/${textColor}?text=${color}+${size}+${texture}`,
            price: 5980,
            displayOrder: variantCounter,
          };

          await db.insert(productVariants).values({
            id: variantId,
            ...variantData,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          console.log(`  ✅ Created variant: ${variantData.sku} - ${color}/${size}/${texture} (¥${variantData.price})`);

          // バリアントオプション（色）
          const variantColorOptionId = ulid();
          await db.insert(productVariantOptions).values({
            id: variantColorOptionId,
            productVariantId: variantId,
            optionName: '色',
            optionValue: color,
            displayOrder: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          // バリアントオプション（サイズ）
          const variantSizeOptionId = ulid();
          await db.insert(productVariantOptions).values({
            id: variantSizeOptionId,
            productVariantId: variantId,
            optionName: 'サイズ',
            optionValue: size,
            displayOrder: 2,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          // バリアントオプション（質感）
          const variantTextureOptionId = ulid();
          await db.insert(productVariantOptions).values({
            id: variantTextureOptionId,
            productVariantId: variantId,
            optionName: '質感',
            optionValue: texture,
            displayOrder: 3,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          // バリアントの画像
          const imageId = ulid();
          const imageData: InsertProductImage = {
            productId: product3Id,
            productVariantId: variantId,
            imageUrl: `https://placehold.co/800x800/${colorCode}/${textColor}?text=${color}+${size}+${texture}+Front`,
            displayOrder: 1,
          };

          await db.insert(productImages).values({
            id: imageId,
            ...imageData,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }
    }

    console.log(`  ✅ Created ${variantCounter} variants with all option combinations`);

    console.log('\n✨ Database seeded successfully!');
    console.log('\n📊 Summary:');
    console.log('  - 1 category created');
    console.log('  - 3 products created');
    console.log(`  - ${4 + variantCounter} variants created (1 + 3 + ${variantCounter})`);
    console.log('  - 5 product options created');
    console.log('  - 11 option values created (1 size + 3 sizes + 3 colors + 2 sizes + 2 textures)');
    console.log(`  - ${4 + variantCounter} images created`);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    client.close();
  }
}

// スクリプト実行
seed()
  .then(() => {
    console.log('\n👋 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
