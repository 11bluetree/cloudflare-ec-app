import { describe, it, expect } from 'vitest';
import { faker } from '@faker-js/faker';
import { ProductDetails } from '../product-details';
import { Product } from '../product';
import { ProductOption } from '../product-option';
import { ProductVariant } from '../product-variant';
import { ProductVariantOption } from '../product-variant-option';
import { Money } from '../../value-objects/money';

describe('ProductDetails', () => {
  const now = new Date();
  const productId = faker.string.alphanumeric(26);
  const categoryId = faker.string.alphanumeric(26);

  describe('正常系', () => {
    it('オプションとバリアントがない商品定義のみが作成できる', () => {
      // Arrange
      const product = Product.create(
        productId,
        faker.commerce.productName(),
        faker.commerce.productDescription(),
        categoryId,
        'draft',
        [], // オプションなし
        now,
        now,
      );

      // Act
      const details = ProductDetails.create(
        product,
        [], // バリアントなし
        [], // 画像なし
      );

      // Assert
      expect(details.product).toBe(product);
      expect(details.variants).toEqual([]);
      expect(details.images).toEqual([]);
    });

    it('オプションとバリアントが揃っている商品が作成できる', () => {
      // Arrange
      const optionId = faker.string.alphanumeric(26);
      const optionName = faker.commerce.productAdjective();

      const option = ProductOption.create(optionId, productId, optionName, 1, now, now);

      const product = Product.create(
        productId,
        faker.commerce.productName(),
        faker.commerce.productDescription(),
        categoryId,
        'draft',
        [option],
        now,
        now,
      );

      const variantId = faker.string.alphanumeric(26);
      const variantOptionId = faker.string.alphanumeric(26);
      const optionValue = faker.commerce.productMaterial();

      const variantOption = ProductVariantOption.create(
        variantOptionId,
        variantId,
        optionName,
        optionValue,
        1,
        now,
        now,
      );

      const variant = ProductVariant.create(
        variantId,
        productId,
        faker.string.alphanumeric(10),
        null,
        null,
        Money.create(faker.number.int({ min: 100, max: 99999 })),
        1,
        [variantOption],
        now,
        now,
      );

      // Act
      const details = ProductDetails.create(product, [variant], []);

      // Assert
      expect(details.product).toBe(product);
      expect(details.variants).toHaveLength(1);
      expect(details.variants[0]).toBe(variant);
    });

    it('下書きステータスの場合はバリアントなしでも作成できる', () => {
      // Arrange
      const product = Product.create(
        productId,
        faker.commerce.productName(),
        faker.commerce.productDescription(),
        categoryId,
        'draft', // 下書き
        [],
        now,
        now,
      );

      // Act & Assert
      expect(() => {
        ProductDetails.create(product, [], []);
      }).not.toThrow();
    });

    it('複数バリアントの商品が作成できる', () => {
      // Arrange
      const optionId = faker.string.alphanumeric(26);
      const optionName = faker.commerce.productAdjective();
      const option = ProductOption.create(optionId, productId, optionName, 1, now, now);

      const product = Product.create(
        productId,
        faker.commerce.productName(),
        faker.commerce.productDescription(),
        categoryId,
        'published',
        [option],
        now,
        now,
      );

      const variantSId = faker.string.alphanumeric(26);
      const variantS = ProductVariant.create(
        variantSId,
        productId,
        faker.string.alphanumeric(10),
        null,
        null,
        Money.create(faker.number.int({ min: 100, max: 99999 })),
        1,
        [
          ProductVariantOption.create(
            faker.string.alphanumeric(26),
            variantSId,
            optionName,
            faker.commerce.productMaterial(),
            1,
            now,
            now,
          ),
        ],
        now,
        now,
      );

      const variantMId = faker.string.alphanumeric(26);
      const variantM = ProductVariant.create(
        variantMId,
        productId,
        faker.string.alphanumeric(10),
        null,
        null,
        Money.create(faker.number.int({ min: 100, max: 99999 })),
        2,
        [
          ProductVariantOption.create(
            faker.string.alphanumeric(26),
            variantMId,
            optionName,
            faker.commerce.productMaterial(),
            1,
            now,
            now,
          ),
        ],
        now,
        now,
      );

      const variantLId = faker.string.alphanumeric(26);
      const variantL = ProductVariant.create(
        variantLId,
        productId,
        faker.string.alphanumeric(10),
        null,
        null,
        Money.create(faker.number.int({ min: 100, max: 99999 })),
        3,
        [
          ProductVariantOption.create(
            faker.string.alphanumeric(26),
            variantLId,
            optionName,
            faker.commerce.productMaterial(),
            1,
            now,
            now,
          ),
        ],
        now,
        now,
      );

      // Act
      const details = ProductDetails.create(product, [variantS, variantM, variantL], []);

      // Assert
      expect(details.variants).toHaveLength(3);
      expect(details.variants[0]).toBe(variantS);
      expect(details.variants[1]).toBe(variantM);
      expect(details.variants[2]).toBe(variantL);
    });
  });

  describe('異常系', () => {
    it('オプション定義があるがバリアントがない場合はエラー', () => {
      // Arrange
      const optionId = faker.string.alphanumeric(26);
      const option = ProductOption.create(optionId, productId, faker.commerce.productAdjective(), 1, now, now);

      const product = Product.create(
        productId,
        faker.commerce.productName(),
        faker.commerce.productDescription(),
        categoryId,
        'draft',
        [option], // オプションあり
        now,
        now,
      );

      // Act & Assert
      expect(() => {
        ProductDetails.create(
          product,
          [], // バリアントなし
          [],
        );
      }).toThrow('オプションが定義されている商品には、最低1つのバリアントが必要です');
    });

    it('バリアントがあるがオプション定義がない場合はエラー', () => {
      // Arrange
      const product = Product.create(
        productId,
        faker.commerce.productName(),
        faker.commerce.productDescription(),
        categoryId,
        'draft',
        [], // オプションなし
        now,
        now,
      );

      const variantId = faker.string.alphanumeric(26);
      const variantOption = ProductVariantOption.create(
        faker.string.alphanumeric(26),
        variantId,
        faker.commerce.productAdjective(),
        faker.commerce.productMaterial(),
        1,
        now,
        now,
      );

      const variant = ProductVariant.create(
        variantId,
        productId,
        faker.string.alphanumeric(10),
        null,
        null,
        Money.create(faker.number.int({ min: 100, max: 99999 })),
        1,
        [variantOption],
        now,
        now,
      );

      // Act & Assert
      expect(() => {
        ProductDetails.create(
          product,
          [variant], // バリアントあり
          [],
        );
      }).toThrow('バリアントが存在する商品には、オプション定義が必要です');
    });

    it('バリアントのoptionNameが商品オプションに存在しない場合エラー', () => {
      // Arrange
      const optionId = faker.string.alphanumeric(26);
      const productOptionName = faker.commerce.productAdjective();
      const option = ProductOption.create(optionId, productId, productOptionName, 1, now, now);

      const product = Product.create(
        productId,
        faker.commerce.productName(),
        faker.commerce.productDescription(),
        categoryId,
        'draft',
        [option],
        now,
        now,
      );

      const variantId = faker.string.alphanumeric(26);
      const differentOptionName = faker.color.human(); // 異なるオプション名
      const variantOption = ProductVariantOption.create(
        faker.string.alphanumeric(26),
        variantId,
        differentOptionName,
        faker.commerce.productMaterial(),
        1,
        now,
        now,
      );

      const variant = ProductVariant.create(
        variantId,
        productId,
        faker.string.alphanumeric(10),
        null,
        null,
        Money.create(faker.number.int({ min: 100, max: 99999 })),
        1,
        [variantOption],
        now,
        now,
      );

      // Act & Assert
      expect(() => {
        ProductDetails.create(product, [variant], []);
      }).toThrow(`バリアントオプション "${differentOptionName}" は商品オプションに存在しません`);
    });

    it('公開ステータスでバリアントがない場合はエラー', () => {
      // Arrange
      const product = Product.create(
        productId,
        faker.commerce.productName(),
        faker.commerce.productDescription(),
        categoryId,
        'published', // 公開状態
        [],
        now,
        now,
      );

      // Act & Assert
      expect(() => {
        ProductDetails.create(
          product,
          [], // バリアントなし
          [],
        );
      }).toThrow('公開状態の商品には、最低1つのバリアントが必要です');
    });
  });
});
