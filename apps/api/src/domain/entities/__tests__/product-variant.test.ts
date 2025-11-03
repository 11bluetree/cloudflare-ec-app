import { describe, it, expect } from 'vitest';
import { ProductVariant } from '../product-variant';
import { Money } from '../../value-objects/money';

describe('ProductVariant Entity', () => {
  const validParams = {
    id: '01JCQZ8X9Y0VARIANTID12345',
    productId: '01JCQZ8X9Y0PRODUCTID12345',
    sku: 'SKU-001',
    barcode: '1234567890123',
    imageUrl: 'https://example.com/image.jpg',
    price: Money.create(1000),
    displayOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('constructor', () => {
    it('正常な値でインスタンスを作成できる', () => {
      expect(() => {
        ProductVariant.create(
          validParams.id,
          validParams.productId,
          validParams.sku,
          validParams.barcode,
          validParams.imageUrl,
          validParams.price,
          validParams.displayOrder,
          validParams.createdAt,
          validParams.updatedAt
        );
      }).not.toThrow();
    });

    it('barcodeとimageUrlがnullでも作成できる', () => {
      expect(() => {
        ProductVariant.create(
          validParams.id,
          validParams.productId,
          validParams.sku,
          null,
          null,
          validParams.price,
          validParams.displayOrder,
          validParams.createdAt,
          validParams.updatedAt
        );
      }).not.toThrow();
    });

    describe('sku validation', () => {
      it('空文字列の場合はエラー', () => {
        expect(() => {
          ProductVariant.create(
            validParams.id,
            validParams.productId,
            '',
            validParams.barcode,
            validParams.imageUrl,
            validParams.price,
            validParams.displayOrder,
            validParams.createdAt,
            validParams.updatedAt
          );
        }).toThrow('SKUは空白のみにできません');
      });

      it('空白のみの場合はエラー', () => {
        expect(() => {
          ProductVariant.create(
            validParams.id,
            validParams.productId,
            '   ',
            validParams.barcode,
            validParams.imageUrl,
            validParams.price,
            validParams.displayOrder,
            validParams.createdAt,
            validParams.updatedAt
          );
        }).toThrow('SKUは空白のみにできません');
      });

      it('前後の空白は自動でトリミングされる', () => {
        expect(() => {
          ProductVariant.create(
            validParams.id,
            validParams.productId,
            '  SKU-001  ',
            validParams.barcode,
            validParams.imageUrl,
            validParams.price,
            validParams.displayOrder,
            validParams.createdAt,
            validParams.updatedAt
          );
        }).not.toThrow();
      });

      it('100文字の場合は成功', () => {
        const sku = 'A'.repeat(100);
        expect(() => {
          ProductVariant.create(
            validParams.id,
            validParams.productId,
            sku,
            validParams.barcode,
            validParams.imageUrl,
            validParams.price,
            validParams.displayOrder,
            validParams.createdAt,
            validParams.updatedAt
          );
        }).not.toThrow();
      });

      it('101文字の場合はエラー', () => {
        const sku = 'A'.repeat(101);
        expect(() => {
          ProductVariant.create(
            validParams.id,
            validParams.productId,
            sku,
            validParams.barcode,
            validParams.imageUrl,
            validParams.price,
            validParams.displayOrder,
            validParams.createdAt,
            validParams.updatedAt
          );
        }).toThrow('SKUは100文字以内である必要があります');
      });
    });

    describe('barcode validation', () => {
      it('100文字の場合は成功', () => {
        const barcode = '1'.repeat(100);
        expect(() => {
          ProductVariant.create(
            validParams.id,
            validParams.productId,
            validParams.sku,
            barcode,
            validParams.imageUrl,
            validParams.price,
            validParams.displayOrder,
            validParams.createdAt,
            validParams.updatedAt
          );
        }).not.toThrow();
      });

      it('101文字の場合はエラー', () => {
        const barcode = '1'.repeat(101);
        expect(() => {
          ProductVariant.create(
            validParams.id,
            validParams.productId,
            validParams.sku,
            barcode,
            validParams.imageUrl,
            validParams.price,
            validParams.displayOrder,
            validParams.createdAt,
            validParams.updatedAt
          );
        }).toThrow('バーコードは100文字以内である必要があります');
      });
    });

    describe('imageUrl validation', () => {
      it('500文字の場合は成功', () => {
        const imageUrl = 'https://example.com/' + 'a'.repeat(480);
        expect(() => {
          ProductVariant.create(
            validParams.id,
            validParams.productId,
            validParams.sku,
            validParams.barcode,
            imageUrl,
            validParams.price,
            validParams.displayOrder,
            validParams.createdAt,
            validParams.updatedAt
          );
        }).not.toThrow();
      });

      it('501文字の場合はエラー', () => {
        const imageUrl = 'https://example.com/' + 'a'.repeat(481);
        expect(() => {
          ProductVariant.create(
            validParams.id,
            validParams.productId,
            validParams.sku,
            validParams.barcode,
            imageUrl,
            validParams.price,
            validParams.displayOrder,
            validParams.createdAt,
            validParams.updatedAt
          );
        }).toThrow('画像URLは500文字以内である必要があります');
      });
    });

    describe('price validation', () => {
      it('価格が0円の場合は成功', () => {
        const price = Money.create(0);
        expect(() => {
          ProductVariant.create(
            validParams.id,
            validParams.productId,
            validParams.sku,
            validParams.barcode,
            validParams.imageUrl,
            price,
            validParams.displayOrder,
            validParams.createdAt,
            validParams.updatedAt
          );
        }).not.toThrow();
      });

      it('価格が999999円の場合は成功', () => {
        const price = Money.create(999999);
        expect(() => {
          ProductVariant.create(
            validParams.id,
            validParams.productId,
            validParams.sku,
            validParams.barcode,
            validParams.imageUrl,
            price,
            validParams.displayOrder,
            validParams.createdAt,
            validParams.updatedAt
          );
        }).not.toThrow();
      });

      it('価格が1000000円の場合はエラー', () => {
        const price = Money.create(1000000);
        expect(() => {
          ProductVariant.create(
            validParams.id,
            validParams.productId,
            validParams.sku,
            validParams.barcode,
            validParams.imageUrl,
            price,
            validParams.displayOrder,
            validParams.createdAt,
            validParams.updatedAt
          );
        }).toThrow('価格は0以上1000000円未満である必要があります');
      });

      it('価格が負の場合はエラー（Moneyの時点でエラー）', () => {
        expect(() => {
          Money.create(-1);
        }).toThrow('価格は0以上である必要があります');
      });
    });

    describe('displayOrder validation', () => {
      it('表示順序が0の場合は成功', () => {
        expect(() => {
          ProductVariant.create(
            validParams.id,
            validParams.productId,
            validParams.sku,
            validParams.barcode,
            validParams.imageUrl,
            validParams.price,
            0,
            validParams.createdAt,
            validParams.updatedAt
          );
        }).not.toThrow();
      });

      it('表示順序が500の場合は成功', () => {
        expect(() => {
          ProductVariant.create(
            validParams.id,
            validParams.productId,
            validParams.sku,
            validParams.barcode,
            validParams.imageUrl,
            validParams.price,
            500,
            validParams.createdAt,
            validParams.updatedAt
          );
        }).not.toThrow();
      });

      it('表示順序が-1の場合はエラー', () => {
        expect(() => {
          ProductVariant.create(
            validParams.id,
            validParams.productId,
            validParams.sku,
            validParams.barcode,
            validParams.imageUrl,
            validParams.price,
            -1,
            validParams.createdAt,
            validParams.updatedAt
          );
        }).toThrow('表示順序は0以上500以下である必要があります');
      });

      it('表示順序が501の場合はエラー', () => {
        expect(() => {
          ProductVariant.create(
            validParams.id,
            validParams.productId,
            validParams.sku,
            validParams.barcode,
            validParams.imageUrl,
            validParams.price,
            501,
            validParams.createdAt,
            validParams.updatedAt
          );
        }).toThrow('表示順序は0以上500以下である必要があります');
      });
    });
  });
});
