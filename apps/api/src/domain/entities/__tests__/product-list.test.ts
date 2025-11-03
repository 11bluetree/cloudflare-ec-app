import { describe, it, expect } from 'vitest';
import { faker } from '@faker-js/faker';
import { ProductList, ProductListItem } from '../product-list';
import { Product, ProductStatus } from '../product';
import { ProductVariant } from '../product-variant';
import { ProductVariantOption } from '../product-variant-option';
import { ProductOption } from '../product-option';
import { ProductImage } from '../product-image';
import { Category } from '../category';
import { Money } from '../../value-objects/money';

const MAX_PRODUCTS_PER_PAGE = 100;

describe('ProductListItem', () => {
  // テストデータのヘルパー関数
  const createTestCategory = (): Category => {
    return Category.create(
      faker.string.uuid(),
      faker.commerce.department(),
      null,
      1,
      faker.date.past(),
      faker.date.recent(),
    );
  };

  const createTestProduct = (productId?: string): Product => {
    const id = productId || faker.string.uuid();
    const option = ProductOption.create(
      faker.string.uuid(),
      id,
      faker.commerce.productMaterial(),
      1,
      faker.date.past(),
      faker.date.recent(),
    );

    return Product.create(
      id,
      faker.commerce.productName(),
      faker.commerce.productDescription(),
      faker.string.uuid(),
      ProductStatus.PUBLISHED,
      [option],
      faker.date.past(),
      faker.date.recent(),
    );
  };

  const createTestProductImage = (productId: string, displayOrder: number): ProductImage => {
    return ProductImage.create(
      faker.string.uuid(),
      productId,
      null,
      faker.image.url(),
      displayOrder,
      faker.date.past(),
      faker.date.recent(),
    );
  };

  const createTestVariant = (productId: string, price?: number): ProductVariant => {
    const id = faker.string.uuid();
    const variantOption = ProductVariantOption.create(
      faker.string.uuid(),
      id,
      faker.commerce.productMaterial(),
      faker.commerce.productAdjective(),
      1,
      faker.date.past(),
      faker.date.recent(),
    );

    return ProductVariant.create(
      id,
      productId,
      faker.string.alphanumeric(10),
      null,
      null,
      Money.create(price || faker.number.int({ min: 100, max: 10000 })),
      1,
      [variantOption],
      faker.date.past(),
      faker.date.recent(),
    );
  };

  describe('create', () => {
    it('正常系：有効な商品一覧アイテムを作成できる', () => {
      const productId = faker.string.uuid();
      const product = createTestProduct(productId);
      const category = createTestCategory();
      const images = [createTestProductImage(productId, 1)];
      const variants = [createTestVariant(productId)];

      const productListItem = ProductListItem.create(product, category, images, variants);

      expect(productListItem.product).toBe(product);
      expect(productListItem.category).toBe(category);
      expect(productListItem.thumbnailImageUrl).toBe(images[0].imageUrl);
      expect(productListItem.minPrice.toNumber()).toBe(variants[0].price.toNumber());
      expect(productListItem.maxPrice.toNumber()).toBe(variants[0].price.toNumber());
    });

    it('正常系：画像が空配列の場合はサムネイルがnull', () => {
      const productId = faker.string.uuid();
      const product = createTestProduct(productId);
      const category = createTestCategory();
      const images: ProductImage[] = [];
      const variants = [createTestVariant(productId)];

      const productListItem = ProductListItem.create(product, category, images, variants);

      expect(productListItem.thumbnailImageUrl).toBeNull();
    });

    it('正常系：複数画像がある場合は表示順序が最小のものをサムネイルとする', () => {
      const productId = faker.string.uuid();
      const product = createTestProduct(productId);
      const category = createTestCategory();
      const images = [
        createTestProductImage(productId, 3),
        createTestProductImage(productId, 1),
        createTestProductImage(productId, 2),
      ];
      const variants = [createTestVariant(productId)];

      const productListItem = ProductListItem.create(product, category, images, variants);

      // displayOrder=1の画像がサムネイルになる
      const thumbnailImage = images.find((img) => img.displayOrder === 1);
      expect(productListItem.thumbnailImageUrl).toBe(thumbnailImage?.imageUrl);
    });

    it('正常系：複数バリアントから価格帯を正しく計算できる', () => {
      const productId = faker.string.uuid();
      const product = createTestProduct(productId);
      const category = createTestCategory();
      const images = [createTestProductImage(productId, 1)];
      const variants = [
        createTestVariant(productId, 1000),
        createTestVariant(productId, 2000),
        createTestVariant(productId, 1500),
      ];

      const productListItem = ProductListItem.create(product, category, images, variants);

      expect(productListItem.minPrice.toNumber()).toBe(1000);
      expect(productListItem.maxPrice.toNumber()).toBe(2000);
    });

    it('異常系：バリアントが最小数未満の場合はエラー', () => {
      const product = createTestProduct();
      const category = createTestCategory();
      const images: ProductImage[] = [];
      const variants: ProductVariant[] = [];

      expect(() => ProductListItem.create(product, category, images, variants)).toThrow(
        '商品には最低1つのバリアントが必要です',
      );
    });

    it('異常系：異なる商品IDのバリアントが含まれる場合はエラー', () => {
      const productId = faker.string.uuid();
      const product = createTestProduct(productId);
      const category = createTestCategory();
      const images = [createTestProductImage(productId, 1)];
      const variants = [
        createTestVariant(productId),
        createTestVariant(faker.string.uuid()), // 異なる商品ID
      ];

      expect(() => ProductListItem.create(product, category, images, variants)).toThrow(
        'すべてのバリアントは同じ商品に属する必要があります',
      );
    });
  });
});

describe('ProductList', () => {
  // テストデータのヘルパー関数
  const createTestCategory = (): Category => {
    return Category.create(
      faker.string.uuid(),
      faker.commerce.department(),
      null,
      1,
      faker.date.past(),
      faker.date.recent(),
    );
  };

  const createTestProduct = (productId?: string): Product => {
    const id = productId || faker.string.uuid();
    const option = ProductOption.create(
      faker.string.uuid(),
      id,
      faker.commerce.productMaterial(),
      1,
      faker.date.past(),
      faker.date.recent(),
    );

    return Product.create(
      id,
      faker.commerce.productName(),
      faker.commerce.productDescription(),
      faker.string.uuid(),
      ProductStatus.PUBLISHED,
      [option],
      faker.date.past(),
      faker.date.recent(),
    );
  };

  const createTestProductImage = (productId: string, displayOrder: number): ProductImage => {
    return ProductImage.create(
      faker.string.uuid(),
      productId,
      null,
      faker.image.url(),
      displayOrder,
      faker.date.past(),
      faker.date.recent(),
    );
  };

  const createTestVariant = (productId: string, price?: number): ProductVariant => {
    const id = faker.string.uuid();
    const variantOption = ProductVariantOption.create(
      faker.string.uuid(),
      id,
      faker.commerce.productMaterial(),
      faker.commerce.productAdjective(),
      1,
      faker.date.past(),
      faker.date.recent(),
    );

    return ProductVariant.create(
      id,
      productId,
      faker.string.alphanumeric(10),
      null,
      null,
      Money.create(price || faker.number.int({ min: 100, max: 10000 })),
      1,
      [variantOption],
      faker.date.past(),
      faker.date.recent(),
    );
  };

  const createTestProductListItem = (): ProductListItem => {
    const productId = faker.string.uuid();
    const product = createTestProduct(productId);
    const category = createTestCategory();
    const images = [createTestProductImage(productId, 1)];
    const variants = [createTestVariant(productId)];

    return ProductListItem.create(product, category, images, variants);
  };

  describe('create', () => {
    it('正常系：有効な商品一覧を作成できる', () => {
      const items = [createTestProductListItem()];

      const productList = ProductList.create(items);

      expect(productList.items).toHaveLength(1);
      expect(productList.count).toBe(1);
    });

    it('正常系：空の商品一覧を作成できる', () => {
      const items: ProductListItem[] = [];

      const productList = ProductList.create(items);

      expect(productList.items).toHaveLength(0);
      expect(productList.count).toBe(0);
    });

    it('正常系：最大数の商品を含む一覧を作成できる', () => {
      const items = Array.from({ length: MAX_PRODUCTS_PER_PAGE }, () => createTestProductListItem());

      const productList = ProductList.create(items);

      expect(productList.items).toHaveLength(MAX_PRODUCTS_PER_PAGE);
      expect(productList.count).toBe(MAX_PRODUCTS_PER_PAGE);
    });

    it('異常系：商品数が最大数を超える場合はエラー', () => {
      const items = Array.from({ length: MAX_PRODUCTS_PER_PAGE + 1 }, () => createTestProductListItem());

      expect(() => ProductList.create(items)).toThrow('1ページあたりの商品数は100件以下である必要があります');
    });
  });

  describe('count', () => {
    it('正常系：商品数を取得できる', () => {
      const items = Array.from({ length: 5 }, () => createTestProductListItem());
      const productList = ProductList.create(items);

      expect(productList.count).toBe(5);
    });
  });
});
