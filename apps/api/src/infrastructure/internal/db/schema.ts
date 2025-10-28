import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { ulid } from "ulid";

// ============================================================
// Categories（カテゴリー）
// ============================================================
export const categoriesTable = sqliteTable("categories", {
  id: text("id", { length: 26 }).$defaultFn(() => ulid()).primaryKey(),
  name: text("name").notNull(),
  parentId: text("parent_id"), // self reference
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

// ============================================================
// Products（商品）
// ============================================================
export const productsTable = sqliteTable("products", {
  id: text("id", { length: 26 }).$defaultFn(() => ulid()).primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  categoryId: text("category_id").notNull().references(() => categoriesTable.id),
  status: text("status", { enum: ["draft", "published", "archived"] }).notNull().default("draft"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

// ============================================================
// ProductVariants（商品バリエーション）
// ============================================================
export const productVariantsTable = sqliteTable("product_variants", {
  id: text("id", { length: 26 }).$defaultFn(() => ulid()).primaryKey(),
  productId: text("product_id").notNull().references(() => productsTable.id, { onDelete: "cascade" }),
  sku: text("sku").notNull().unique(),
  price: real("price").notNull(), // decimal を real で表現
  stockQuantity: integer("stock_quantity").notNull().default(0),
  size: text("size"),
  color: text("color"),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

// ============================================================
// ProductImages（商品画像）
// ============================================================
export const productImagesTable = sqliteTable("product_images", {
  id: text("id", { length: 26 }).$defaultFn(() => ulid()).primaryKey(),
  productId: text("product_id").references(() => productsTable.id, { onDelete: "cascade" }),
  productVariantId: text("product_variant_id").references(() => productVariantsTable.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});
