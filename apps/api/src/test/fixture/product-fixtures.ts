import { faker } from '@faker-js/faker';
import type { DrizzleDB } from '../../infrastructure/internal/db/connection';
import {
  categories,
  products,
  productOptions,
  productVariants,
  productVariantOptions,
  productImages,
} from '../../infrastructure/internal/db/schema';

/**
 * カテゴリーのfixtureを作成
 */
export async function createCategoryFixture(
  db: DrizzleDB,
  overrides: {
    id?: string;
    name?: string;
    parentId?: string | null;
    displayOrder?: number;
    createdAt?: Date;
    updatedAt?: Date;
  } = {},
) {
  const now = overrides.createdAt ?? new Date();
  const record = {
    id: overrides.id ?? faker.string.alphanumeric(26),
    name: overrides.name ?? faker.commerce.department(),
    parentId: overrides.parentId ?? null,
    displayOrder: overrides.displayOrder ?? 1,
    createdAt: now,
    updatedAt: overrides.updatedAt ?? now,
  };

  await db.insert(categories).values(record);
  return record;
}

/**
 * 商品のfixtureを作成（カテゴリーも自動作成）
 */
export async function createProductFixture(
  db: DrizzleDB,
  overrides: {
    id?: string;
    name?: string;
    description?: string;
    categoryId?: string;
    status?: 'draft' | 'published' | 'archived';
    createdAt?: Date;
    updatedAt?: Date;
  } = {},
) {
  const now = overrides.createdAt ?? new Date();

  // categoryIdが指定されていない場合はカテゴリーを自動作成
  let categoryId = overrides.categoryId;
  if (!categoryId) {
    const category = await createCategoryFixture(db, { createdAt: now, updatedAt: now });
    categoryId = category.id;
  }

  const record = {
    id: overrides.id ?? faker.string.alphanumeric(26),
    name: overrides.name ?? faker.commerce.productName(),
    description: overrides.description ?? faker.commerce.productDescription(),
    categoryId,
    status: overrides.status ?? ('published' as const),
    createdAt: now,
    updatedAt: overrides.updatedAt ?? now,
  };

  await db.insert(products).values(record);
  return record;
}

/**
 * 商品オプション定義のfixtureを作成
 */
export async function createProductOptionFixture(
  db: DrizzleDB,
  productId: string,
  overrides: {
    id?: string;
    optionName?: string;
    displayOrder?: number;
    createdAt?: Date;
    updatedAt?: Date;
  } = {},
) {
  const now = overrides.createdAt ?? new Date();
  const record = {
    id: overrides.id ?? faker.string.alphanumeric(26),
    productId,
    optionName: overrides.optionName ?? 'オプション',
    displayOrder: overrides.displayOrder ?? 1,
    createdAt: now,
    updatedAt: overrides.updatedAt ?? now,
  };

  await db.insert(productOptions).values(record);
  return record;
}

/**
 * 商品バリアントのfixtureを作成
 */
export async function createProductVariantFixture(
  db: DrizzleDB,
  productId: string,
  overrides: {
    id?: string;
    sku?: string;
    barcode?: string | null;
    imageUrl?: string | null;
    price?: number;
    displayOrder?: number;
    createdAt?: Date;
    updatedAt?: Date;
  } = {},
) {
  const now = overrides.createdAt ?? new Date();
  const variantId = overrides.id ?? faker.string.alphanumeric(26);

  const record = {
    id: variantId,
    productId,
    sku: overrides.sku ?? faker.string.alphanumeric(12).toUpperCase(),
    barcode: overrides.barcode ?? null,
    imageUrl: overrides.imageUrl ?? null,
    price: overrides.price ?? 1000,
    displayOrder: overrides.displayOrder ?? 1,
    createdAt: now,
    updatedAt: overrides.updatedAt ?? now,
  };

  await db.insert(productVariants).values(record);

  // デフォルトでバリアントオプションを1つ追加（バリアントには最低1つ必要）
  await createProductVariantOptionFixture(db, variantId, { createdAt: now, updatedAt: now });

  return record;
}

/**
 * バリアントオプションのfixtureを作成
 */
export async function createProductVariantOptionFixture(
  db: DrizzleDB,
  productVariantId: string,
  overrides: {
    id?: string;
    optionName?: string;
    optionValue?: string;
    displayOrder?: number;
    createdAt?: Date;
    updatedAt?: Date;
  } = {},
) {
  const now = overrides.createdAt ?? new Date();
  const record = {
    id: overrides.id ?? faker.string.alphanumeric(26),
    productVariantId,
    optionName: overrides.optionName ?? 'title',
    optionValue: overrides.optionValue ?? 'default',
    displayOrder: overrides.displayOrder ?? 1,
    createdAt: now,
    updatedAt: overrides.updatedAt ?? now,
  };

  await db.insert(productVariantOptions).values(record);
  return record;
}

/**
 * 商品画像のfixtureを作成
 */
export async function createProductImageFixture(
  db: DrizzleDB,
  productId: string,
  overrides: {
    id?: string;
    productVariantId?: string | null;
    imageUrl?: string;
    displayOrder?: number;
    createdAt?: Date;
    updatedAt?: Date;
  } = {},
) {
  const now = overrides.createdAt ?? new Date();
  const record = {
    id: overrides.id ?? faker.string.alphanumeric(26),
    productId,
    productVariantId: overrides.productVariantId ?? null,
    imageUrl: overrides.imageUrl ?? faker.image.url(),
    displayOrder: overrides.displayOrder ?? 1,
    createdAt: now,
    updatedAt: overrides.updatedAt ?? now,
  };

  await db.insert(productImages).values(record);
  return record;
}

/**
 * 商品とバリアントを一括作成するヘルパー
 *
 * 最も一般的なパターン（商品1つ + バリアント1つ + デフォルトオプション）を簡単に作成
 */
export async function createProductWithVariantFixture(
  db: DrizzleDB,
  config: {
    category?: Parameters<typeof createCategoryFixture>[1];
    product?: Parameters<typeof createProductFixture>[1];
    variant?: Parameters<typeof createProductVariantFixture>[2];
    additionalVariants?: Parameters<typeof createProductVariantFixture>[2][];
  } = {},
) {
  const now = new Date();

  // カテゴリーを作成（categoryIdが指定されていない場合）
  let categoryId = config.product?.categoryId;
  if (!categoryId) {
    const category = await createCategoryFixture(db, { ...config.category, createdAt: now, updatedAt: now });
    categoryId = category.id;
  }

  // 商品を作成
  const product = await createProductFixture(db, {
    ...config.product,
    categoryId,
    createdAt: config.product?.createdAt ?? now,
    updatedAt: config.product?.updatedAt ?? now,
  });

  // メインバリアントを作成
  const variant = await createProductVariantFixture(db, product.id, {
    ...config.variant,
    createdAt: config.variant?.createdAt ?? now,
    updatedAt: config.variant?.updatedAt ?? now,
  });

  // 追加のバリアントを作成
  const additionalVariants = [];
  if (config.additionalVariants) {
    for (const variantConfig of config.additionalVariants) {
      if (!variantConfig) continue;
      const additionalVariant = await createProductVariantFixture(db, product.id, {
        ...variantConfig,
        createdAt: variantConfig.createdAt ?? now,
        updatedAt: variantConfig.updatedAt ?? now,
      });
      additionalVariants.push(additionalVariant);
    }
  }

  return {
    categoryId,
    product,
    variant,
    additionalVariants,
  };
}
