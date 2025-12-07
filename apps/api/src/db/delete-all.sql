-- 全テーブルのデータ削除（外部キー制約を考慮した順序）

DELETE FROM product_images;
DELETE FROM product_variant_options;
DELETE FROM product_option_values;
DELETE FROM product_variants;
DELETE FROM product_options;
DELETE FROM products;
DELETE FROM categories;