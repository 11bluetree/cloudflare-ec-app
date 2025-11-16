import { faker } from '@faker-js/faker';
import { beforeEach, describe, expect, it } from 'vitest';
import { ProductRepository } from '../product.repository';
import { createDbConnection } from '../../db/connection';
import { products, productVariants, productVariantOptions, productOptions, categories } from '../../db/schema';
import { getEnv } from '../../../../test/setup';
import { cleanupAllTables } from '../../../../test/helpers/db-cleanup';
import { Product, ProductStatus } from '../../../../domain/entities/product';
import { ProductOption } from '../../../../domain/entities/product-option';
import { ProductVariant } from '../../../../domain/entities/product-variant';
import { ProductVariantOption } from '../../../../domain/entities/product-variant-option';
import { Money } from '../../../../domain/value-objects/money';
import { ProductDetails } from '../../../../domain/entities/product-details';
import { eq } from 'drizzle-orm';
import {
  createProductWithVariantFixture,
  createCategoryFixture,
  createProductFixture,
  createProductVariantFixture,
  createProductImageFixture,
} from '../../../../test/fixture/product-fixtures';

describe('ProductRepository', () => {
  let repository: ProductRepository;
  let db: ReturnType<typeof createDbConnection>;

  beforeEach(async () => {
    const env = getEnv();
    db = createDbConnection(env.DB);

    // すべてのテーブルをクリーンアップ
    await cleanupAllTables(db);

    repository = new ProductRepository(db);
  });

  /**
   * デフォルトバリアントオプションを作成するヘルパー関数
   * すべてのバリアントには最低1つのオプションが必要
   */
  const createDefaultVariantOption = (variantId: string, now: Date) => {
    return ProductVariantOption.create(faker.string.alphanumeric(26), variantId, 'title', 'default', 1, now, now);
  };

  describe('findMany', () => {
    it('商品一覧を取得できる', async () => {
      const now = new Date();

      await createProductWithVariantFixture(db, {
        product: {
          name: 'テスト商品',
          description: 'テスト商品の説明',
          status: 'published',
          createdAt: now,
          updatedAt: now,
        },
        variant: {
          sku: 'TEST-SKU-001',
          price: 10000,
          displayOrder: 1,
          createdAt: now,
          updatedAt: now,
        },
      });

      // テスト実行
      const result = await repository.findMany({
        page: 1,
        perPage: 10,
        sortBy: 'createdAt',
        order: 'desc',
      });

      // 検証
      expect(result.total).toBe(1);
      expect(result.products).toHaveLength(1);
      expect(result.products[0].name).toBe('テスト商品');
      expect(result.products[0].variants).toHaveLength(1);
      expect(result.products[0].variants[0].sku).toBe('TEST-SKU-001');
    });

    it('ステータスでフィルタリングできる', async () => {
      const now = new Date();
      const category = await createCategoryFixture(db, {
        name: 'エレクトロニクス',
        displayOrder: 1,
        createdAt: now,
        updatedAt: now,
      });

      await createProductWithVariantFixture(db, {
        product: {
          name: '公開商品',
          description: '公開商品の説明',
          categoryId: category.id,
          status: 'published',
          createdAt: now,
          updatedAt: now,
        },
        variant: {
          sku: 'PUBLISHED-SKU',
          price: 5000,
          displayOrder: 1,
          createdAt: now,
          updatedAt: now,
        },
      });

      await createProductWithVariantFixture(db, {
        product: {
          name: '下書き商品',
          description: '下書き商品の説明',
          categoryId: category.id,
          status: 'draft',
          createdAt: now,
          updatedAt: now,
        },
        variant: {
          sku: 'DRAFT-SKU',
          price: 3000,
          displayOrder: 1,
          createdAt: now,
          updatedAt: now,
        },
      });

      // 公開済みのみ取得
      const result = await repository.findMany({
        page: 1,
        perPage: 10,
        statuses: ['published'],
        sortBy: 'createdAt',
        order: 'desc',
      });

      expect(result.total).toBe(1);
      expect(result.products).toHaveLength(1);
      expect(result.products[0].name).toBe('公開商品');
      expect(result.products[0].status).toBe('published');
    });

    it('カテゴリーでフィルタリングできる', async () => {
      const now = new Date();
      const category1 = await createCategoryFixture(db, {
        name: 'エレクトロニクス',
        displayOrder: 1,
        createdAt: now,
        updatedAt: now,
      });
      const category2 = await createCategoryFixture(db, {
        name: 'ファッション',
        displayOrder: 2,
        createdAt: now,
        updatedAt: now,
      });

      await createProductWithVariantFixture(db, {
        product: {
          name: 'スマートフォン',
          description: 'スマートフォンの説明',
          categoryId: category1.id,
          status: 'published',
          createdAt: now,
          updatedAt: now,
        },
        variant: { sku: 'PHONE-SKU', price: 80000, createdAt: now, updatedAt: now },
      });

      await createProductWithVariantFixture(db, {
        product: {
          name: 'Tシャツ',
          description: 'Tシャツの説明',
          categoryId: category2.id,
          status: 'published',
          createdAt: now,
          updatedAt: now,
        },
        variant: { sku: 'TSHIRT-SKU', price: 2000, createdAt: now, updatedAt: now },
      });

      // カテゴリー1の商品のみ取得
      const result = await repository.findMany({
        page: 1,
        perPage: 10,
        categoryId: category1.id,
        sortBy: 'createdAt',
        order: 'desc',
      });

      expect(result.total).toBe(1);
      expect(result.products).toHaveLength(1);
      expect(result.products[0].name).toBe('スマートフォン');
    });

    it('キーワードで検索できる', async () => {
      const now = new Date();
      const category = await createCategoryFixture(db, {
        name: 'エレクトロニクス',
        createdAt: now,
        updatedAt: now,
      });

      await createProductWithVariantFixture(db, {
        product: {
          name: 'iPhone 15 Pro',
          description: '最新のスマートフォン',
          categoryId: category.id,
          status: 'published',
          createdAt: now,
        },
        variant: { sku: 'IPHONE-SKU', price: 150000, createdAt: now },
      });

      await createProductWithVariantFixture(db, {
        product: {
          name: 'Galaxy S24',
          description: 'iPhone対抗の最新モデル',
          categoryId: category.id,
          status: 'published',
          createdAt: now,
        },
        variant: { sku: 'GALAXY-SKU', price: 140000, createdAt: now },
      });

      await createProductWithVariantFixture(db, {
        product: {
          name: 'Xperia 1',
          description: 'ソニーのフラッグシップモデル',
          categoryId: category.id,
          status: 'published',
          createdAt: now,
        },
        variant: { sku: 'XPERIA-SKU', price: 130000, createdAt: now },
      });

      // 'iPhone'で検索
      const result = await repository.findMany({
        page: 1,
        perPage: 10,
        keyword: 'iPhone',
        sortBy: 'createdAt',
        order: 'desc',
      });

      expect(result.total).toBe(2);
      expect(result.products).toHaveLength(2);
      const names = result.products.map((p) => p.name).sort();
      expect(names).toEqual(['Galaxy S24', 'iPhone 15 Pro']);
    });

    it('価格範囲でフィルタリングできる', async () => {
      const now = new Date();
      const category = await createCategoryFixture(db, { name: 'エレクトロニクス', createdAt: now });

      await createProductWithVariantFixture(db, {
        product: {
          name: '安い商品',
          description: '安い商品の説明',
          categoryId: category.id,
          status: 'published',
          createdAt: now,
        },
        variant: { sku: 'CHEAP-SKU', price: 1000, createdAt: now },
      });

      await createProductWithVariantFixture(db, {
        product: {
          name: '普通の商品',
          description: '普通の商品の説明',
          categoryId: category.id,
          status: 'published',
          createdAt: now,
        },
        variant: { sku: 'MEDIUM-SKU', price: 5000, createdAt: now },
      });

      await createProductWithVariantFixture(db, {
        product: {
          name: '高い商品',
          description: '高い商品の説明',
          categoryId: category.id,
          status: 'published',
          createdAt: now,
        },
        variant: { sku: 'EXPENSIVE-SKU', price: 10000, createdAt: now },
      });

      // 2000円以上7000円以下の商品を取得
      const result = await repository.findMany({
        page: 1,
        perPage: 10,
        minPrice: 2000,
        maxPrice: 7000,
        sortBy: 'createdAt',
        order: 'desc',
      });

      expect(result.products).toHaveLength(1);
      expect(result.products[0].name).toBe('普通の商品');
    });

    it('商品名でソートできる（昇順）', async () => {
      const now = new Date();
      const category = await createCategoryFixture(db, { name: 'エレクトロニクス', createdAt: now });

      await createProductWithVariantFixture(db, {
        product: {
          name: 'Ccc 商品',
          description: '説明C',
          categoryId: category.id,
          status: 'published',
          createdAt: now,
        },
        variant: { sku: 'CCC-SKU', price: 1000, createdAt: now },
      });

      await createProductWithVariantFixture(db, {
        product: {
          name: 'Bbb 商品',
          description: '説明B',
          categoryId: category.id,
          status: 'published',
          createdAt: now,
        },
        variant: { sku: 'BBB-SKU', price: 1000, createdAt: now },
      });

      await createProductWithVariantFixture(db, {
        product: {
          name: 'Aaa 商品',
          description: '説明A',
          categoryId: category.id,
          status: 'published',
          createdAt: now,
        },
        variant: { sku: 'AAA-SKU', price: 1000, createdAt: now },
      });

      // 名前で昇順ソート
      const result = await repository.findMany({
        page: 1,
        perPage: 10,
        sortBy: 'name',
        order: 'asc',
      });

      expect(result.products).toHaveLength(3);
      expect(result.products[0].name).toBe('Aaa 商品');
      expect(result.products[1].name).toBe('Bbb 商品');
      expect(result.products[2].name).toBe('Ccc 商品');
    });

    it('作成日時でソートできる（降順）', async () => {
      const date1 = new Date('2024-01-01T00:00:00Z');
      const date2 = new Date('2024-06-01T00:00:00Z');
      const date3 = new Date('2024-12-01T00:00:00Z');

      await createProductWithVariantFixture(db, {
        product: { name: '古い商品', description: '最初に作成', createdAt: date1, updatedAt: date1 },
        variant: { sku: 'OLD-SKU', createdAt: date1, updatedAt: date1 },
      });
      await createProductWithVariantFixture(db, {
        product: { name: '中間商品', description: '2番目に作成', createdAt: date2, updatedAt: date2 },
        variant: { sku: 'MID-SKU', createdAt: date2, updatedAt: date2 },
      });
      await createProductWithVariantFixture(db, {
        product: { name: '新しい商品', description: '最後に作成', createdAt: date3, updatedAt: date3 },
        variant: { sku: 'NEW-SKU', createdAt: date3, updatedAt: date3 },
      });

      // 作成日時で降順ソート
      const result = await repository.findMany({
        page: 1,
        perPage: 10,
        sortBy: 'createdAt',
        order: 'desc',
      });

      expect(result.products).toHaveLength(3);
      expect(result.products[0].name).toBe('新しい商品');
      expect(result.products[1].name).toBe('中間商品');
      expect(result.products[2].name).toBe('古い商品');
    });

    it('ページネーションが機能する', async () => {
      const now = new Date();

      for (let i = 1; i <= 5; i++) {
        await createProductWithVariantFixture(db, {
          product: {
            name: `商品${i}`,
            description: `商品${i}の説明`,
            createdAt: new Date(now.getTime() + (i - 1) * 1000),
            updatedAt: now,
          },
          variant: { sku: `SKU-${i}` },
        });
      }

      // 1ページ目（2件）
      const page1 = await repository.findMany({
        page: 1,
        perPage: 2,
        sortBy: 'createdAt',
        order: 'asc',
      });

      expect(page1.total).toBe(5);
      expect(page1.products).toHaveLength(2);
      expect(page1.products[0].name).toBe('商品1');
      expect(page1.products[1].name).toBe('商品2');

      // 2ページ目（2件）
      const page2 = await repository.findMany({
        page: 2,
        perPage: 2,
        sortBy: 'createdAt',
        order: 'asc',
      });

      expect(page2.total).toBe(5);
      expect(page2.products).toHaveLength(2);
      expect(page2.products[0].name).toBe('商品3');
      expect(page2.products[1].name).toBe('商品4');

      // 3ページ目（1件）
      const page3 = await repository.findMany({
        page: 3,
        perPage: 2,
        sortBy: 'createdAt',
        order: 'asc',
      });

      expect(page3.total).toBe(5);
      expect(page3.products).toHaveLength(1);
      expect(page3.products[0].name).toBe('商品5');
    });

    it('商品が存在しない場合は空配列を返す', async () => {
      const result = await repository.findMany({
        page: 1,
        perPage: 10,
        sortBy: 'createdAt',
        order: 'desc',
      });

      expect(result.total).toBe(0);
      expect(result.products).toEqual([]);
    });

    it('オプションとバリアントオプションを含む商品を取得できる', async () => {
      const now = new Date();
      const category = await createCategoryFixture(db, { name: 'ファッション' });
      const productData = await createProductFixture(db, {
        name: 'Tシャツ',
        description: 'カラフルなTシャツ',
        categoryId: category.id,
      });

      // オプション定義を作成（色、サイズ）
      await db.insert(productOptions).values([
        {
          id: faker.string.alphanumeric(26),
          productId: productData.id,
          optionName: '色',
          displayOrder: 1,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: faker.string.alphanumeric(26),
          productId: productData.id,
          optionName: 'サイズ',
          displayOrder: 2,
          createdAt: now,
          updatedAt: now,
        },
      ]);

      // バリアントを作成（赤・M、青・L）
      const variantRedM = await createProductVariantFixture(db, productData.id, {
        sku: 'TSHIRT-RED-M',
        price: 2000,
        displayOrder: 1,
      });
      const variantBlueL = await createProductVariantFixture(db, productData.id, {
        sku: 'TSHIRT-BLUE-L',
        price: 2200,
        displayOrder: 2,
      });

      // デフォルトオプションを削除して、カスタムオプションのみにする
      await db.delete(productVariantOptions).where(eq(productVariantOptions.productVariantId, variantRedM.id));
      await db.delete(productVariantOptions).where(eq(productVariantOptions.productVariantId, variantBlueL.id));

      // バリアントオプションを作成
      await db.insert(productVariantOptions).values([
        {
          id: faker.string.alphanumeric(26),
          productVariantId: variantRedM.id,
          optionName: '色',
          optionValue: '赤',
          displayOrder: 1,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: faker.string.alphanumeric(26),
          productVariantId: variantRedM.id,
          optionName: 'サイズ',
          optionValue: 'M',
          displayOrder: 2,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: faker.string.alphanumeric(26),
          productVariantId: variantBlueL.id,
          optionName: '色',
          optionValue: '青',
          displayOrder: 1,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: faker.string.alphanumeric(26),
          productVariantId: variantBlueL.id,
          optionName: 'サイズ',
          optionValue: 'L',
          displayOrder: 2,
          createdAt: now,
          updatedAt: now,
        },
      ]);

      // テスト実行
      const result = await repository.findMany({
        page: 1,
        perPage: 10,
        sortBy: 'createdAt',
        order: 'desc',
      });

      // 検証
      expect(result.products).toHaveLength(1);
      const product = result.products[0];

      expect(product.options).toHaveLength(2);
      expect(product.options[0].optionName).toBe('色');
      expect(product.options[1].optionName).toBe('サイズ');

      expect(product.variants).toHaveLength(2);
      expect(product.variants[0].sku).toBe('TSHIRT-RED-M');
      expect(product.variants[0].options).toHaveLength(2);
      expect(product.variants[0].options[0].optionValue).toBe('赤');
      expect(product.variants[0].options[1].optionValue).toBe('M');

      expect(product.variants[1].sku).toBe('TSHIRT-BLUE-L');
      expect(product.variants[1].options).toHaveLength(2);
      expect(product.variants[1].options[0].optionValue).toBe('青');
      expect(product.variants[1].options[1].optionValue).toBe('L');
    });

    it('画像を含む商品を取得できる', async () => {
      const category = await createCategoryFixture(db, { name: 'エレクトロニクス' });
      const productData = await createProductFixture(db, {
        name: 'ノートパソコン',
        description: '高性能ノートパソコン',
        categoryId: category.id,
      });

      const variant = await createProductVariantFixture(db, productData.id, {
        sku: 'LAPTOP-001',
        price: 100000,
      });

      // 商品画像を作成（商品全体の画像とバリアント専用の画像）
      await createProductImageFixture(db, productData.id, {
        productVariantId: null,
        imageUrl: 'https://example.com/product-main.jpg',
        displayOrder: 1,
      });
      await createProductImageFixture(db, productData.id, {
        productVariantId: variant.id,
        imageUrl: 'https://example.com/variant-detail.jpg',
        displayOrder: 2,
      });

      // テスト実行
      const result = await repository.findMany({
        page: 1,
        perPage: 10,
        sortBy: 'createdAt',
        order: 'desc',
      });

      // 検証
      expect(result.products).toHaveLength(1);
      const product = result.products[0];

      expect(product.images).toHaveLength(2);
      expect(product.images[0].imageUrl).toBe('https://example.com/product-main.jpg');
      expect(product.images[0].productVariantId).toBeNull();
      expect(product.images[1].imageUrl).toBe('https://example.com/variant-detail.jpg');
      expect(product.images[1].productVariantId).toBe(variant.id);
    });
  });

  describe('create', () => {
    it('商品を作成できる（オプションなし）', async () => {
      const now = new Date();
      const categoryId = faker.string.alphanumeric(26);

      // カテゴリーを事前に作成
      await db.insert(categories).values({
        id: categoryId,
        name: 'エレクトロニクス',
        parentId: null,
        displayOrder: 1,
        createdAt: now,
        updatedAt: now,
      });

      // デフォルトオプション定義を作成（バリアントが存在する場合、オプション定義も必要）
      const defaultOption = ProductOption.create(
        faker.string.alphanumeric(26),
        faker.string.alphanumeric(26), // productId（後で商品IDに差し替え）
        'title',
        1,
        now,
        now,
      );

      // 商品エンティティを作成
      const product = Product.create(
        faker.string.alphanumeric(26),
        'テスト商品',
        'テスト商品の説明',
        categoryId,
        ProductStatus.PUBLISHED,
        [defaultOption], // デフォルトオプションを追加
        now,
        now,
      );

      // バリアントを作成
      const variantId = faker.string.alphanumeric(26);
      const variant = ProductVariant.create(
        variantId,
        product.id,
        'TEST-SKU-001',
        null,
        null,
        Money.create(10000),
        1,
        [createDefaultVariantOption(variantId, now)],
        now,
        now,
      );

      // ProductDetailsを構築
      const productDetails = ProductDetails.create(product, [variant], []);

      // リポジトリで作成
      await repository.create(productDetails);

      // 検証: DBから取得
      const savedProducts = await db.select().from(products).where(eq(products.id, product.id));
      expect(savedProducts).toHaveLength(1);
      expect(savedProducts[0].name).toBe('テスト商品');

      const savedVariants = await db.select().from(productVariants).where(eq(productVariants.productId, product.id));
      expect(savedVariants).toHaveLength(1);
      expect(savedVariants[0].sku).toBe('TEST-SKU-001');
      expect(savedVariants[0].price).toBe(10000);
    });

    it('商品を作成できる（オプションあり）', async () => {
      const now = new Date();
      const categoryId = faker.string.alphanumeric(26);

      await db.insert(categories).values({
        id: categoryId,
        name: 'ファッション',
        parentId: null,
        displayOrder: 1,
        createdAt: now,
        updatedAt: now,
      });

      // オプション定義を作成
      const colorOption = ProductOption.create(
        faker.string.alphanumeric(26),
        faker.string.alphanumeric(26), // productId（後で商品IDに差し替え）
        '色',
        1,
        now,
        now,
      );

      const sizeOption = ProductOption.create(
        faker.string.alphanumeric(26),
        faker.string.alphanumeric(26),
        'サイズ',
        2,
        now,
        now,
      );

      // 商品エンティティを作成
      const product = Product.create(
        faker.string.alphanumeric(26),
        'Tシャツ',
        'カラフルなTシャツ',
        categoryId,
        ProductStatus.PUBLISHED,
        [colorOption, sizeOption],
        now,
        now,
      );

      // バリアントオプションを作成
      const redOption = ProductVariantOption.create(
        faker.string.alphanumeric(26),
        faker.string.alphanumeric(26), // variantId（後で差し替え）
        '色',
        '赤',
        1,
        now,
        now,
      );

      const sizeM = ProductVariantOption.create(
        faker.string.alphanumeric(26),
        faker.string.alphanumeric(26),
        'サイズ',
        'M',
        2,
        now,
        now,
      );

      // バリアントを作成
      const variant = ProductVariant.create(
        faker.string.alphanumeric(26),
        product.id,
        'TSHIRT-RED-M',
        null,
        null,
        Money.create(2000),
        1,
        [redOption, sizeM],
        now,
        now,
      );

      // ProductDetailsを構築
      const productDetails = ProductDetails.create(product, [variant], []);

      // リポジトリで作成
      await repository.create(productDetails);

      // 検証: 商品
      const savedProducts = await db.select().from(products).where(eq(products.id, product.id));
      expect(savedProducts).toHaveLength(1);
      expect(savedProducts[0].name).toBe('Tシャツ');

      // 検証: オプション定義
      const savedOptions = await db
        .select()
        .from(productOptions)
        .where(eq(productOptions.productId, product.id))
        .orderBy(productOptions.displayOrder);
      expect(savedOptions).toHaveLength(2);
      expect(savedOptions[0].optionName).toBe('色');
      expect(savedOptions[1].optionName).toBe('サイズ');

      // 検証: バリアント
      const savedVariants = await db.select().from(productVariants).where(eq(productVariants.productId, product.id));
      expect(savedVariants).toHaveLength(1);
      expect(savedVariants[0].sku).toBe('TSHIRT-RED-M');

      // 検証: バリアントオプション
      const savedVariantOptions = await db
        .select()
        .from(productVariantOptions)
        .where(eq(productVariantOptions.productVariantId, variant.id))
        .orderBy(productVariantOptions.displayOrder);
      expect(savedVariantOptions).toHaveLength(2);
      expect(savedVariantOptions[0].optionName).toBe('色');
      expect(savedVariantOptions[0].optionValue).toBe('赤');
      expect(savedVariantOptions[1].optionName).toBe('サイズ');
      expect(savedVariantOptions[1].optionValue).toBe('M');
    });

    it('複数のバリアントを持つ商品を作成できる', async () => {
      const now = new Date();
      const categoryId = faker.string.alphanumeric(26);

      await db.insert(categories).values({
        id: categoryId,
        name: 'ファッション',
        parentId: null,
        displayOrder: 1,
        createdAt: now,
        updatedAt: now,
      });

      // デフォルトオプション定義を作成（バリアントが存在する場合、オプション定義も必要）
      const defaultOption = ProductOption.create(
        faker.string.alphanumeric(26),
        faker.string.alphanumeric(26), // productId（後で商品IDに差し替え）
        'title',
        1,
        now,
        now,
      );

      // 商品を作成
      const product = Product.create(
        faker.string.alphanumeric(26),
        '靴',
        '快適な靴',
        categoryId,
        ProductStatus.PUBLISHED,
        [defaultOption], // デフォルトオプションを追加
        now,
        now,
      );

      // 3つのバリアントを作成（サイズ違い）
      const variant1Id = faker.string.alphanumeric(26);
      const variant2Id = faker.string.alphanumeric(26);
      const variant3Id = faker.string.alphanumeric(26);

      const variants = [
        ProductVariant.create(
          variant1Id,
          product.id,
          'SHOE-SIZE-25',
          null,
          null,
          Money.create(5000),
          1,
          [createDefaultVariantOption(variant1Id, now)],
          now,
          now,
        ),
        ProductVariant.create(
          variant2Id,
          product.id,
          'SHOE-SIZE-26',
          null,
          null,
          Money.create(5000),
          2,
          [createDefaultVariantOption(variant2Id, now)],
          now,
          now,
        ),
        ProductVariant.create(
          variant3Id,
          product.id,
          'SHOE-SIZE-27',
          null,
          null,
          Money.create(5000),
          3,
          [createDefaultVariantOption(variant3Id, now)],
          now,
          now,
        ),
      ];

      // ProductDetailsを構築
      const productDetails = ProductDetails.create(product, variants, []);

      // リポジトリで作成
      await repository.create(productDetails);

      // 検証: 商品
      const savedProducts = await db.select().from(products).where(eq(products.id, product.id));
      expect(savedProducts).toHaveLength(1);

      // 検証: バリアント
      const savedVariants = await db
        .select()
        .from(productVariants)
        .where(eq(productVariants.productId, product.id))
        .orderBy(productVariants.displayOrder);
      expect(savedVariants).toHaveLength(3);
      expect(savedVariants[0].sku).toBe('SHOE-SIZE-25');
      expect(savedVariants[1].sku).toBe('SHOE-SIZE-26');
      expect(savedVariants[2].sku).toBe('SHOE-SIZE-27');
    });
  });
});
