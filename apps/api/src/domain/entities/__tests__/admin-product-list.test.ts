import { describe, it, expect } from 'vitest';
import { faker } from '@faker-js/faker';
import { AdminProductList, AdminProductListItem } from '../admin-product-list';
import { Product, ProductStatus } from '../product';
import { ProductVariant } from '../product-variant';
import { ProductVariantOption } from '../product-variant-option';
import { ProductOption } from '../product-option';
import { ProductImage } from '../product-image';
import { Category } from '../category';
import { Money } from '../../value-objects/money';

const MAX_PRODUCTS_PER_PAGE = 100;

describe('AdminProductListItem', () => {
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

  const createTestProduct = (productId?: string, status: ProductStatus = ProductStatus.PUBLISHED): Product => {
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
      status,
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
    it('正常系：バリアントありの商品一覧アイテムを作成できる', () => {
      const productId = faker.string.uuid();
      const product = createTestProduct(productId);
      const category = createTestCategory();
      const images = [createTestProductImage(productId, 1)];
      const variants = [createTestVariant(productId, 1000)];

      const adminProductListItem = AdminProductListItem.create(product, category, images, variants);

      expect(adminProductListItem.product).toBe(product);
      expect(adminProductListItem.category).toBe(category);
      expect(adminProductListItem.thumbnailImageUrl).toBe(images[0].imageUrl);
      expect(adminProductListItem.minPrice?.toNumber()).toBe(1000);
      expect(adminProductListItem.maxPrice?.toNumber()).toBe(1000);
      expect(adminProductListItem.variantCount).toBe(1);
    });

    it('正常系：バリアントなし（下書き）の商品一覧アイテムを作成できる', () => {
      const productId = faker.string.uuid();
      const product = createTestProduct(productId, ProductStatus.DRAFT);
      const category = createTestCategory();
      const images: ProductImage[] = [];
      const variants: ProductVariant[] = [];

      const adminProductListItem = AdminProductListItem.create(product, category, images, variants);

      expect(adminProductListItem.product).toBe(product);
      expect(adminProductListItem.category).toBe(category);
      expect(adminProductListItem.thumbnailImageUrl).toBeNull();
      expect(adminProductListItem.minPrice).toBeNull();
      expect(adminProductListItem.maxPrice).toBeNull();
      expect(adminProductListItem.variantCount).toBe(0);
    });

    it('正常系：複数バリアントがある場合、価格帯が正しく計算される', () => {
      const productId = faker.string.uuid();
      const product = createTestProduct(productId);
      const category = createTestCategory();
      const images: ProductImage[] = [];
      const variants = [
        createTestVariant(productId, 1000),
        createTestVariant(productId, 1500),
        createTestVariant(productId, 2000),
      ];

      const adminProductListItem = AdminProductListItem.create(product, category, images, variants);

      expect(adminProductListItem.minPrice?.toNumber()).toBe(1000);
      expect(adminProductListItem.maxPrice?.toNumber()).toBe(2000);
      expect(adminProductListItem.variantCount).toBe(3);
    });

    it('正常系：複数画像がある場合、表示順序が最小の画像がサムネイルになる', () => {
      const productId = faker.string.uuid();
      const product = createTestProduct(productId);
      const category = createTestCategory();
      const images = [
        createTestProductImage(productId, 3),
        createTestProductImage(productId, 1),
        createTestProductImage(productId, 2),
      ];
      const variants = [createTestVariant(productId)];

      const adminProductListItem = AdminProductListItem.create(product, category, images, variants);

      expect(adminProductListItem.thumbnailImageUrl).toBe(images[1].imageUrl);
    });

    it('異常系：異なる商品のバリアントが含まれている場合はエラー', () => {
      const productId = faker.string.uuid();
      const product = createTestProduct(productId);
      const category = createTestCategory();
      const images: ProductImage[] = [];
      const variants = [
        createTestVariant(productId),
        createTestVariant(faker.string.uuid()), // 異なる商品ID
      ];

      expect(() => {
        AdminProductListItem.create(product, category, images, variants);
      }).toThrow('すべてのバリアントは同じ商品に属する必要があります');
    });

    it('異常系：バリアント数が上限を超えた場合はエラー', () => {
      const productId = faker.string.uuid();
      const product = createTestProduct(productId);
      const category = createTestCategory();
      const images: ProductImage[] = [];
      const variants = Array.from({ length: 101 }, () => createTestVariant(productId));

      expect(() => {
        AdminProductListItem.create(product, category, images, variants);
      }).toThrow('商品には最大100個のバリアントまで登録可能です');
    });
  });

  describe('isPublishable', () => {
    it('公開状態でバリアントがある場合はtrue', () => {
      const productId = faker.string.uuid();
      const product = createTestProduct(productId, ProductStatus.PUBLISHED);
      const category = createTestCategory();
      const variants = [createTestVariant(productId)];

      const adminProductListItem = AdminProductListItem.create(product, category, [], variants);

      expect(adminProductListItem.isPublishable()).toBe(true);
    });

    it('下書き状態でバリアントがない場合はtrue', () => {
      const productId = faker.string.uuid();
      const product = createTestProduct(productId, ProductStatus.DRAFT);
      const category = createTestCategory();

      const adminProductListItem = AdminProductListItem.create(product, category, [], []);

      expect(adminProductListItem.isPublishable()).toBe(true);
    });

    it('公開状態でバリアントがない場合はfalse', () => {
      const productId = faker.string.uuid();
      const product = createTestProduct(productId, ProductStatus.PUBLISHED);
      const category = createTestCategory();

      const adminProductListItem = AdminProductListItem.create(product, category, [], []);

      expect(adminProductListItem.isPublishable()).toBe(false);
    });
  });
});

describe('AdminProductList', () => {
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

  const createTestProduct = (productId?: string, status: ProductStatus = ProductStatus.PUBLISHED): Product => {
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
      status,
      [option],
      faker.date.past(),
      faker.date.recent(),
    );
  };

  const createTestVariant = (productId: string): ProductVariant => {
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
      Money.create(faker.number.int({ min: 100, max: 10000 })),
      1,
      [variantOption],
      faker.date.past(),
      faker.date.recent(),
    );
  };

  describe('create', () => {
    it('正常系：有効な商品一覧を作成できる', () => {
      const productId = faker.string.uuid();
      const product = createTestProduct(productId);
      const category = createTestCategory();
      const variants = [createTestVariant(productId)];
      const item = AdminProductListItem.create(product, category, [], variants);

      const adminProductList = AdminProductList.create([item]);

      expect(adminProductList.count).toBe(1);
      expect(adminProductList.items).toHaveLength(1);
    });

    it('正常系：空の商品一覧を作成できる', () => {
      const adminProductList = AdminProductList.create([]);

      expect(adminProductList.count).toBe(0);
      expect(adminProductList.items).toHaveLength(0);
    });

    it('正常系：最大件数の商品一覧を作成できる', () => {
      const items = Array.from({ length: MAX_PRODUCTS_PER_PAGE }, () => {
        const productId = faker.string.uuid();
        const product = createTestProduct(productId);
        const category = createTestCategory();
        const variants = [createTestVariant(productId)];
        return AdminProductListItem.create(product, category, [], variants);
      });

      const adminProductList = AdminProductList.create(items);

      expect(adminProductList.count).toBe(MAX_PRODUCTS_PER_PAGE);
    });

    it('異常系：最大件数を超えた場合はエラー', () => {
      const items = Array.from({ length: MAX_PRODUCTS_PER_PAGE + 1 }, () => {
        const productId = faker.string.uuid();
        const product = createTestProduct(productId);
        const category = createTestCategory();
        const variants = [createTestVariant(productId)];
        return AdminProductListItem.create(product, category, [], variants);
      });

      expect(() => {
        AdminProductList.create(items);
      }).toThrow('1ページあたりの商品数は100件以下である必要があります');
    });
  });

  describe('count', () => {
    it('商品数を返す', () => {
      const items = Array.from({ length: 3 }, () => {
        const productId = faker.string.uuid();
        const product = createTestProduct(productId);
        const category = createTestCategory();
        const variants = [createTestVariant(productId)];
        return AdminProductListItem.create(product, category, [], variants);
      });

      const adminProductList = AdminProductList.create(items);

      expect(adminProductList.count).toBe(3);
    });
  });

  describe('draftCount', () => {
    it('下書き商品数を返す', () => {
      const product1Id = faker.string.uuid();
      const product2Id = faker.string.uuid();
      const product3Id = faker.string.uuid();
      const draftProduct1 = createTestProduct(product1Id, ProductStatus.DRAFT);
      const draftProduct2 = createTestProduct(product2Id, ProductStatus.DRAFT);
      const publishedProduct = createTestProduct(product3Id, ProductStatus.PUBLISHED);
      const category = createTestCategory();

      const items = [
        AdminProductListItem.create(draftProduct1, category, [], []),
        AdminProductListItem.create(draftProduct2, category, [], []),
        AdminProductListItem.create(publishedProduct, category, [], [createTestVariant(product3Id)]),
      ];

      const adminProductList = AdminProductList.create(items);

      expect(adminProductList.draftCount).toBe(2);
    });
  });

  describe('publishedCount', () => {
    it('公開商品数を返す', () => {
      const product1Id = faker.string.uuid();
      const product2Id = faker.string.uuid();
      const product3Id = faker.string.uuid();
      const draftProduct = createTestProduct(product1Id, ProductStatus.DRAFT);
      const publishedProduct1 = createTestProduct(product2Id, ProductStatus.PUBLISHED);
      const publishedProduct2 = createTestProduct(product3Id, ProductStatus.PUBLISHED);
      const category = createTestCategory();

      const items = [
        AdminProductListItem.create(draftProduct, category, [], []),
        AdminProductListItem.create(publishedProduct1, category, [], [createTestVariant(product2Id)]),
        AdminProductListItem.create(publishedProduct2, category, [], [createTestVariant(product3Id)]),
      ];

      const adminProductList = AdminProductList.create(items);

      expect(adminProductList.publishedCount).toBe(2);
    });
  });
});
