import { integer, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { ulid } from 'ulid';
import { z } from 'zod';

// ============================================================================
// Common Schema
// ============================================================================

const timestamps = {
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$default(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$default(() => new Date()),
};

// ============================================================================
// Categories（カテゴリー）
// ============================================================================
export const categories = sqliteTable('categories', {
  id: text('id', { length: 26 })
    .primaryKey()
    .$default(() => ulid()),
  name: text('name', { length: 50 }).notNull(),
  // 自己参照のため、型推論を避けて文字列で指定
  parentId: text('parent_id'),
  displayOrder: integer('display_order').notNull(),
  ...timestamps,
});

// Zod schemas for categories
export const insertCategorySchema = createInsertSchema(categories, {
  name: (schema) => schema.min(1).max(50).trim(),
  displayOrder: (schema) => schema.min(0),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const selectCategorySchema = createSelectSchema(categories);

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = z.infer<typeof selectCategorySchema>;

// ============================================================================
// Products（商品基本情報）
// ============================================================================
export const products = sqliteTable('products', {
  id: text('id', { length: 26 })
    .primaryKey()
    .$default(() => ulid()),
  name: text('name', { length: 200 }).notNull(),
  description: text('description', { length: 4096 }).notNull(),
  categoryId: text('category_id')
    .notNull()
    .references(() => categories.id),
  status: text('status', { enum: ['draft', 'published', 'archived'] })
    .notNull()
    .default('draft'),
  ...timestamps,
});

export const insertProductSchema = createInsertSchema(products, {
  name: (schema) => schema.min(1).max(200),
  description: (schema) => schema.min(1).max(4096),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const selectProductSchema = createSelectSchema(products);

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = z.infer<typeof selectProductSchema>;

// ============================================================================
// Product Options（商品オプション定義）
// ============================================================================
export const productOptions = sqliteTable(
  'product_options',
  {
    id: text('id', { length: 26 })
      .primaryKey()
      .$default(() => ulid()),
    productId: text('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    optionName: text('option_name', { length: 50 }).notNull(),
    displayOrder: integer('display_order').notNull(),
    ...timestamps,
  },
  (table) => [unique().on(table.productId, table.optionName)],
);

export const insertProductOptionSchema = createInsertSchema(productOptions, {
  optionName: (schema) => schema.min(1).max(50),
  displayOrder: (schema) => schema.min(0),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const selectProductOptionSchema = createSelectSchema(productOptions);

export type InsertProductOption = z.infer<typeof insertProductOptionSchema>;
export type ProductOption = z.infer<typeof selectProductOptionSchema>;

// ============================================================================
// Product Option Values（オプション値）
// ============================================================================
export const productOptionValues = sqliteTable(
  'product_option_values',
  {
    id: text('id', { length: 26 })
      .primaryKey()
      .$default(() => ulid()),
    productOptionId: text('product_option_id')
      .notNull()
      .references(() => productOptions.id, { onDelete: 'cascade' }),
    value: text('value', { length: 50 }).notNull(),
    displayOrder: integer('display_order').notNull(),
    ...timestamps,
  },
  (table) => [unique().on(table.productOptionId, table.value)],
);

export const insertProductOptionValueSchema = createInsertSchema(productOptionValues, {
  value: (schema) => schema.min(1).max(50),
  displayOrder: (schema) => schema.min(0),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const selectProductOptionValueSchema = createSelectSchema(productOptionValues);

export type InsertProductOptionValue = z.infer<typeof insertProductOptionValueSchema>;
export type ProductOptionValue = z.infer<typeof selectProductOptionValueSchema>;

// ============================================================================
// Product Variants（商品バリアント）
// ============================================================================
export const productVariants = sqliteTable('product_variants', {
  id: text('id', { length: 26 })
    .primaryKey()
    .$default(() => ulid()),
  productId: text('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  sku: text('sku', { length: 50 }).notNull().unique(),
  barcode: text('barcode', { length: 30 }).unique(),
  imageUrl: text('image_url', { length: 500 }),
  price: integer('price').notNull(), // 価格は整数（円単位）で保存
  displayOrder: integer('display_order').notNull(),
  ...timestamps,
});

export const insertProductVariantSchema = createInsertSchema(productVariants, {
  sku: (schema) => schema.min(1).max(50),
  barcode: (schema) => schema.max(30).nullable().optional(),
  imageUrl: (schema) => schema.url().max(500).nullable().optional(),
  price: (schema) => schema.min(0).max(999999), // 0円以上100万円未満
  displayOrder: (schema) => schema.min(0).max(100),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const selectProductVariantSchema = createSelectSchema(productVariants);

export type InsertProductVariant = z.infer<typeof insertProductVariantSchema>;
export type ProductVariant = z.infer<typeof selectProductVariantSchema>;

// ============================================================================
// Product Variant Options（バリアントオプション）
// ============================================================================
export const productVariantOptions = sqliteTable(
  'product_variant_options',
  {
    id: text('id', { length: 26 })
      .primaryKey()
      .$default(() => ulid()),
    productVariantId: text('product_variant_id')
      .notNull()
      .references(() => productVariants.id, { onDelete: 'cascade' }),
    optionName: text('option_name', { length: 50 }).notNull(),
    optionValue: text('option_value', { length: 50 }).notNull(),
    displayOrder: integer('display_order').notNull(),
    ...timestamps,
  },
  (table) => [unique().on(table.productVariantId, table.optionName)],
);

export const insertProductVariantOptionSchema = createInsertSchema(productVariantOptions, {
  optionName: (schema) => schema.min(1).max(50),
  optionValue: (schema) => schema.min(1).max(50),
  displayOrder: (schema) => schema.min(0),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const selectProductVariantOptionSchema = createSelectSchema(productVariantOptions);

export type InsertProductVariantOption = z.infer<typeof insertProductVariantOptionSchema>;
export type ProductVariantOption = z.infer<typeof selectProductVariantOptionSchema>;

// ============================================================================
// Product Images（商品画像）
// ============================================================================
export const productImages = sqliteTable('product_images', {
  id: text('id', { length: 26 })
    .primaryKey()
    .$default(() => ulid()),
  productId: text('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  productVariantId: text('product_variant_id').references(() => productVariants.id, { onDelete: 'cascade' }),
  imageUrl: text('image_url', { length: 500 }).notNull(),
  displayOrder: integer('display_order').notNull(),
  ...timestamps,
});

export const insertProductImageSchema = createInsertSchema(productImages, {
  imageUrl: (schema) => schema.min(1).max(500).url(),
  displayOrder: (schema) => schema.min(1),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const selectProductImageSchema = createSelectSchema(productImages);

export type InsertProductImage = z.infer<typeof insertProductImageSchema>;
export type ProductImage = z.infer<typeof selectProductImageSchema>;
