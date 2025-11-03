import { describe, it, expect } from 'vitest';
import { faker } from '@faker-js/faker';
import { ProductImage } from '../product-image';

describe('ProductImage Entity', () => {
  const validParams = {
    id: faker.string.uuid(),
    productId: faker.string.uuid(),
    productVariantId: faker.string.uuid(),
    imageUrl: faker.image.url(),
    displayOrder: faker.number.int({ min: 1, max: 10 }),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('constructor', () => {
    it('正常な値でインスタンスを作成できる', () => {
      const image = ProductImage.create(
        validParams.id,
        validParams.productId,
        validParams.productVariantId,
        validParams.imageUrl,
        validParams.displayOrder,
        validParams.createdAt,
        validParams.updatedAt
      );

      expect(image.id).toBe(validParams.id);
      expect(image.productId).toBe(validParams.productId);
      expect(image.productVariantId).toBe(validParams.productVariantId);
      expect(image.imageUrl).toBe(validParams.imageUrl);
      expect(image.displayOrder).toBe(validParams.displayOrder);
    });

    it('productVariantIdがnullでも作成できる（商品共通画像）', () => {
      const image = ProductImage.create(
        validParams.id,
        validParams.productId,
        null,
        validParams.imageUrl,
        validParams.displayOrder,
        validParams.createdAt,
        validParams.updatedAt
      );

      expect(image.productVariantId).toBeNull();
    });

    describe('productId validation', () => {
      it('productIdが空文字列の場合はエラー', () => {
        expect(() => {
          ProductImage.create(
            validParams.id,
            '',
            validParams.productVariantId,
            validParams.imageUrl,
            validParams.displayOrder,
            validParams.createdAt,
            validParams.updatedAt
          );
        }).toThrow('product_idは必須です');
      });
    });

    describe('imageUrl validation', () => {
      it('画像URLが空文字列の場合はエラー', () => {
        expect(() => {
          ProductImage.create(
            validParams.id,
            validParams.productId,
            validParams.productVariantId,
            '',
            validParams.displayOrder,
            validParams.createdAt,
            validParams.updatedAt
          );
        }).toThrow('画像URLは1文字以上500文字以内である必要があります');
      });

      it('画像URLが最大文字数の場合は成功', () => {
        const imageUrl = 'https://example.com/' + 'a'.repeat(480);
        const image = ProductImage.create(
          validParams.id,
          validParams.productId,
          validParams.productVariantId,
          imageUrl,
          validParams.displayOrder,
          validParams.createdAt,
          validParams.updatedAt
        );
        expect(image.imageUrl).toBe(imageUrl);
      });

      it('画像URLが最大文字数を超えた場合はエラー', () => {
        const imageUrl = 'https://example.com/' + 'a'.repeat(481);
        expect(() => {
          ProductImage.create(
            validParams.id,
            validParams.productId,
            validParams.productVariantId,
            imageUrl,
            validParams.displayOrder,
            validParams.createdAt,
            validParams.updatedAt
          );
        }).toThrow('画像URLは1文字以上500文字以内である必要があります');
      });
    });

    describe('displayOrder validation', () => {
      it('表示順序が最大値の場合は成功', () => {
        const image = ProductImage.create(
          validParams.id,
          validParams.productId,
          validParams.productVariantId,
          validParams.imageUrl,
          1,
          validParams.createdAt,
          validParams.updatedAt
        );
        expect(image.displayOrder).toBe(1);
      });

      it('表示順序が範囲外の場合はエラー', () => {
        expect(() => {
          ProductImage.create(
            validParams.id,
            validParams.productId,
            validParams.productVariantId,
            validParams.imageUrl,
            0,
            validParams.createdAt,
            validParams.updatedAt
          );
        }).toThrow('表示順序は1以上である必要があります');
      });

      it('表示順序が負の場合はエラー', () => {
        expect(() => {
          ProductImage.create(
            validParams.id,
            validParams.productId,
            validParams.productVariantId,
            validParams.imageUrl,
            -1,
            validParams.createdAt,
            validParams.updatedAt
          );
        }).toThrow('表示順序は1以上である必要があります');
      });
    });
  });
});
