import { describe, it, expect } from 'vitest';
import { ProductVariant } from '../product-variant';
import { ProductVariantOption } from '../product-variant-option';
import { Money } from '../../value-objects/money';

const MAX_SKU_LENGTH = 100;
const MAX_BARCODE_LENGTH = 100;
const MAX_IMAGE_URL_LENGTH = 500;
const MIN_PRICE = 0;
const MAX_PRICE = 1000000;
const MIN_DISPLAY_ORDER = 0;
const MAX_DISPLAY_ORDER = 100;
const MIN_OPTIONS_PER_VARIANT = 1;
const MAX_OPTIONS_PER_VARIANT = 5;

describe('ProductVariant Entity', () => {
  const validParams = {
    id: '01JCQZ8X9Y0VARIANTID12345',
    productId: '01JCQZ8X9Y0PRODUCTID12345',
    sku: 'SKU-001',
    barcode: '1234567890123',
    imageUrl: 'https://example.com/image.jpg',
    price: Money.create(1000),
    displayOrder: 1,
    options: [
      ProductVariantOption.create(
        '01JCQZ8X9Y0VAROPTID123456',
        '01JCQZ8X9Y0VARIANTID12345',
        'タイトル',
        'デフォルト',
        0,
        new Date(),
        new Date()
      ),
    ],
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
          validParams.options,
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
          validParams.options,
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
          validParams.options,
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
          validParams.options,
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
          validParams.options,
            validParams.createdAt,
            validParams.updatedAt
          );
        }).not.toThrow();
      });

      it('最大文字数の場合は成功', () => {
        const sku = 'A'.repeat(MAX_SKU_LENGTH);
        expect(() => {
          ProductVariant.create(
            validParams.id,
            validParams.productId,
            sku,
            validParams.barcode,
            validParams.imageUrl,
            validParams.price,
            validParams.displayOrder,
          validParams.options,
            validParams.createdAt,
            validParams.updatedAt
          );
        }).not.toThrow();
      });

      it('最大文字数を超えた場合はエラー', () => {
        const sku = 'A'.repeat(MAX_SKU_LENGTH + 1);
        expect(() => {
          ProductVariant.create(
            validParams.id,
            validParams.productId,
            sku,
            validParams.barcode,
            validParams.imageUrl,
            validParams.price,
            validParams.displayOrder,
          validParams.options,
            validParams.createdAt,
            validParams.updatedAt
          );
        }).toThrow('SKUは100文字以内である必要があります');
      });
    });

    describe('barcode validation', () => {
      it('最大文字数の場合は成功', () => {
        const barcode = '1'.repeat(MAX_BARCODE_LENGTH);
        expect(() => {
          ProductVariant.create(
            validParams.id,
            validParams.productId,
            validParams.sku,
            barcode,
            validParams.imageUrl,
            validParams.price,
            validParams.displayOrder,
          validParams.options,
            validParams.createdAt,
            validParams.updatedAt
          );
        }).not.toThrow();
      });

      it('最大文字数を超えた場合はエラー', () => {
        const barcode = '1'.repeat(MAX_BARCODE_LENGTH + 1);
        expect(() => {
          ProductVariant.create(
            validParams.id,
            validParams.productId,
            validParams.sku,
            barcode,
            validParams.imageUrl,
            validParams.price,
            validParams.displayOrder,
          validParams.options,
            validParams.createdAt,
            validParams.updatedAt
          );
        }).toThrow('バーコードは100文字以内である必要があります');
      });
    });

    describe('imageUrl validation', () => {
      it('最大文字数の場合は成功', () => {
        const baseUrl = 'https://example.com/';
        const imageUrl = baseUrl + 'a'.repeat(MAX_IMAGE_URL_LENGTH - baseUrl.length);
        expect(() => {
          ProductVariant.create(
            validParams.id,
            validParams.productId,
            validParams.sku,
            validParams.barcode,
            imageUrl,
            validParams.price,
            validParams.displayOrder,
          validParams.options,
            validParams.createdAt,
            validParams.updatedAt
          );
        }).not.toThrow();
      });

      it('最大文字数を超えた場合はエラー', () => {
        const baseUrl = 'https://example.com/';
        const imageUrl = baseUrl + 'a'.repeat(MAX_IMAGE_URL_LENGTH - baseUrl.length + 1);
        expect(() => {
          ProductVariant.create(
            validParams.id,
            validParams.productId,
            validParams.sku,
            validParams.barcode,
            imageUrl,
            validParams.price,
            validParams.displayOrder,
          validParams.options,
            validParams.createdAt,
            validParams.updatedAt
          );
        }).toThrow('画像URLは500文字以内である必要があります');
      });
    });

    describe('price validation', () => {
      it('価格が最小値の場合は成功', () => {
        const price = Money.create(MIN_PRICE);
        expect(() => {
          ProductVariant.create(
            validParams.id,
            validParams.productId,
            validParams.sku,
            validParams.barcode,
            validParams.imageUrl,
            price,
            validParams.displayOrder,
          validParams.options,
            validParams.createdAt,
            validParams.updatedAt
          );
        }).not.toThrow();
      });

      it('価格が最大値未満の場合は成功', () => {
        const price = Money.create(MAX_PRICE - 1);
        expect(() => {
          ProductVariant.create(
            validParams.id,
            validParams.productId,
            validParams.sku,
            validParams.barcode,
            validParams.imageUrl,
            price,
            validParams.displayOrder,
          validParams.options,
            validParams.createdAt,
            validParams.updatedAt
          );
        }).not.toThrow();
      });

      it('価格が最大値以上の場合はエラー', () => {
        const price = Money.create(MAX_PRICE);
        expect(() => {
          ProductVariant.create(
            validParams.id,
            validParams.productId,
            validParams.sku,
            validParams.barcode,
            validParams.imageUrl,
            price,
            validParams.displayOrder,
          validParams.options,
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
      it('表示順序が最小値の場合は成功', () => {
        expect(() => {
          ProductVariant.create(
            validParams.id,
            validParams.productId,
            validParams.sku,
            validParams.barcode,
            validParams.imageUrl,
            validParams.price,
            MIN_DISPLAY_ORDER,
          validParams.options,
            validParams.createdAt,
            validParams.updatedAt
          );
        }).not.toThrow();
      });

      it('表示順序が最大値の場合は成功', () => {
        expect(() => {
          ProductVariant.create(
            validParams.id,
            validParams.productId,
            validParams.sku,
            validParams.barcode,
            validParams.imageUrl,
            validParams.price,
            MAX_DISPLAY_ORDER,
          validParams.options,
            validParams.createdAt,
            validParams.updatedAt
          );
        }).not.toThrow();
      });

      it('表示順序が最小値未満の場合はエラー', () => {
        expect(() => {
          ProductVariant.create(
            validParams.id,
            validParams.productId,
            validParams.sku,
            validParams.barcode,
            validParams.imageUrl,
            validParams.price,
            MIN_DISPLAY_ORDER - 1,
          validParams.options,
            validParams.createdAt,
            validParams.updatedAt
          );
        }).toThrow('表示順序は0以上100以下である必要があります');
      });

      it('表示順序が最大値超過の場合はエラー', () => {
        expect(() => {
          ProductVariant.create(
            validParams.id,
            validParams.productId,
            validParams.sku,
            validParams.barcode,
            validParams.imageUrl,
            validParams.price,
            MAX_DISPLAY_ORDER + 1,
          validParams.options,
            validParams.createdAt,
            validParams.updatedAt
          );
        }).toThrow('表示順序は0以上100以下である必要があります');
      });
    });

    describe('options validation', () => {
      it('オプションが最小数未満の場合はエラー', () => {
        expect(() => {
          ProductVariant.create(
            validParams.id,
            validParams.productId,
            validParams.sku,
            validParams.barcode,
            validParams.imageUrl,
            validParams.price,
            validParams.displayOrder,
            [],
            validParams.createdAt,
            validParams.updatedAt
          );
        }).toThrow('オプションは最低1個必要です');
      });

      it('オプションが最小数の場合は成功', () => {
        const options = Array.from({ length: MIN_OPTIONS_PER_VARIANT }, (_, i) =>
          ProductVariantOption.create(
            `01JCQZ8X9Y0VAROPTID${i}`,
            validParams.id,
            i === 0 ? 'タイトル' : `オプション${i}`,
            i === 0 ? 'デフォルト' : `値${i}`,
            i,
            new Date(),
            new Date()
          )
        );
        expect(() => {
          ProductVariant.create(
            validParams.id,
            validParams.productId,
            validParams.sku,
            validParams.barcode,
            validParams.imageUrl,
            validParams.price,
            validParams.displayOrder,
            options,
            validParams.createdAt,
            validParams.updatedAt
          );
        }).not.toThrow();
      });

      it('オプションが最大数の場合は成功', () => {
        const options = Array.from({ length: MAX_OPTIONS_PER_VARIANT }, (_, i) =>
          ProductVariantOption.create(
            `01JCQZ8X9Y0VAROPTID${i}`,
            validParams.id,
            `オプション${i}`,
            `値${i}`,
            i,
            new Date(),
            new Date()
          )
        );
        expect(() => {
          ProductVariant.create(
            validParams.id,
            validParams.productId,
            validParams.sku,
            validParams.barcode,
            validParams.imageUrl,
            validParams.price,
            validParams.displayOrder,
            options,
            validParams.createdAt,
            validParams.updatedAt
          );
        }).not.toThrow();
      });

      it('オプションが最大数を超えた場合はエラー', () => {
        const options = Array.from({ length: MAX_OPTIONS_PER_VARIANT + 1 }, (_, i) =>
          ProductVariantOption.create(
            `01JCQZ8X9Y0VAROPTID${i}`,
            validParams.id,
            `オプション${i}`,
            `値${i}`,
            i,
            new Date(),
            new Date()
          )
        );
        expect(() => {
          ProductVariant.create(
            validParams.id,
            validParams.productId,
            validParams.sku,
            validParams.barcode,
            validParams.imageUrl,
            validParams.price,
            validParams.displayOrder,
            options,
            validParams.createdAt,
            validParams.updatedAt
          );
        }).toThrow('オプションは5個以内である必要があります');
      });
    });
  });
});
