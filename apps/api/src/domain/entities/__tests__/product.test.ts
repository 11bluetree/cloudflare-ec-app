import { describe, it, expect } from 'vitest';
import { Product, ProductStatus } from '../product';
import { ProductOption } from '../product-option';

const MAX_NAME_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 4096;
const MIN_OPTIONS_PER_PRODUCT = 1;
const MAX_OPTIONS_PER_PRODUCT = 5;

describe('Product Entity', () => {
  const validParams = {
    id: '01JCQZ8X9Y0ABCDEFGHIJKLMN',
    name: '商品名',
    description: '商品説明',
    categoryId: '01JCQZ8X9Y0CATEGORYID123',
    status: ProductStatus.DRAFT,
    options: [
      ProductOption.create(
        '01JCQZ8X9Y0OPTIONID123456',
        '01JCQZ8X9Y0ABCDEFGHIJKLMN',
        'タイトル',
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
        Product.create(
          validParams.id,
          validParams.name,
          validParams.description,
          validParams.categoryId,
          validParams.status,
          validParams.options,
          validParams.createdAt,
          validParams.updatedAt
        );
      }).not.toThrow();
    });

    describe('name validation', () => {
      it('空文字列の場合はエラー', () => {
        expect(() => {
          Product.create(
            validParams.id,
            '',
            validParams.description,
            validParams.categoryId,
            validParams.status,
            validParams.options,
            validParams.createdAt,
            validParams.updatedAt
          );
        }).toThrow('商品名は空白のみにできません');
      });

      it('空白のみの場合はエラー', () => {
        expect(() => {
          Product.create(
            validParams.id,
            '   ',
            validParams.description,
            validParams.categoryId,
            validParams.status,
            validParams.options,
            validParams.createdAt,
            validParams.updatedAt
          );
        }).toThrow('商品名は空白のみにできません');
      });

      it('前後の空白は自動でトリミングされる', () => {
        expect(() => {
          Product.create(
            validParams.id,
            '  商品名  ',
            validParams.description,
            validParams.categoryId,
            validParams.status,
            validParams.options,
            validParams.createdAt,
            validParams.updatedAt
          );
        }).not.toThrow();
      });

      it('最大文字数の場合は成功', () => {
        const name = 'あ'.repeat(MAX_NAME_LENGTH);
        expect(() => {
          Product.create(
            validParams.id,
            name,
            validParams.description,
            validParams.categoryId,
            validParams.status,
            validParams.options,
            validParams.createdAt,
            validParams.updatedAt
          );
        }).not.toThrow();
      });

      it('最大文字数を超えた場合はエラー', () => {
        const name = 'あ'.repeat(MAX_NAME_LENGTH + 1);
        expect(() => {
          Product.create(
            validParams.id,
            name,
            validParams.description,
            validParams.categoryId,
            validParams.status,
            validParams.options,
            validParams.createdAt,
            validParams.updatedAt
          );
        }).toThrow('商品名は200文字以内である必要があります');
      });
    });

    describe('description validation', () => {
      it('空文字列の場合はエラー', () => {
        expect(() => {
          Product.create(
            validParams.id,
            validParams.name,
            '',
            validParams.categoryId,
            validParams.status,
            validParams.options,
            validParams.createdAt,
            validParams.updatedAt
          );
        }).toThrow('商品説明は空白のみにできません');
      });

      it('空白のみの場合はエラー', () => {
        expect(() => {
          Product.create(
            validParams.id,
            validParams.name,
            '   ',
            validParams.categoryId,
            validParams.status,
            validParams.options,
            validParams.createdAt,
            validParams.updatedAt
          );
        }).toThrow('商品説明は空白のみにできません');
      });

      it('前後の空白は自動でトリミングされる', () => {
        expect(() => {
          Product.create(
            validParams.id,
            validParams.name,
            '  商品説明  ',
            validParams.categoryId,
            validParams.status,
            validParams.options,
            validParams.createdAt,
            validParams.updatedAt
          );
        }).not.toThrow();
      });

      it('最大文字数の場合は成功', () => {
        const description = 'あ'.repeat(MAX_DESCRIPTION_LENGTH);
        expect(() => {
          Product.create(
            validParams.id,
            validParams.name,
            description,
            validParams.categoryId,
            validParams.status,
            validParams.options,
            validParams.createdAt,
            validParams.updatedAt
          );
        }).not.toThrow();
      });

      it('最大文字数を超えた場合はエラー', () => {
        const description = 'あ'.repeat(MAX_DESCRIPTION_LENGTH + 1);
        expect(() => {
          Product.create(
            validParams.id,
            validParams.name,
            description,
            validParams.categoryId,
            validParams.status,
            validParams.options,
            validParams.createdAt,
            validParams.updatedAt
          );
        }).toThrow('商品説明は4096文字以内である必要があります');
      });
    });

    describe('options validation', () => {
      it('オプションが最小数未満の場合はエラー', () => {
        expect(() => {
          Product.create(
            validParams.id,
            validParams.name,
            validParams.description,
            validParams.categoryId,
            validParams.status,
            [],
            validParams.createdAt,
            validParams.updatedAt
          );
        }).toThrow('オプションは最低1個必要です');
      });

      it('オプションが最小数の場合は成功', () => {
        const options = Array.from({ length: MIN_OPTIONS_PER_PRODUCT }, (_, i) =>
          ProductOption.create(
            `01JCQZ8X9Y0OPTIONID${i}`,
            validParams.id,
            i === 0 ? 'タイトル' : `オプション${i}`,
            i,
            new Date(),
            new Date()
          )
        );
        expect(() => {
          Product.create(
            validParams.id,
            validParams.name,
            validParams.description,
            validParams.categoryId,
            validParams.status,
            options,
            validParams.createdAt,
            validParams.updatedAt
          );
        }).not.toThrow();
      });

      it('オプションが最大数の場合は成功', () => {
        const options = Array.from({ length: MAX_OPTIONS_PER_PRODUCT }, (_, i) =>
          ProductOption.create(
            `01JCQZ8X9Y0OPTIONID${i}`,
            validParams.id,
            `オプション${i}`,
            i,
            new Date(),
            new Date()
          )
        );
        expect(() => {
          Product.create(
            validParams.id,
            validParams.name,
            validParams.description,
            validParams.categoryId,
            validParams.status,
            options,
            validParams.createdAt,
            validParams.updatedAt
          );
        }).not.toThrow();
      });

      it('オプションが最大数を超えた場合はエラー', () => {
        const options = Array.from({ length: MAX_OPTIONS_PER_PRODUCT + 1 }, (_, i) =>
          ProductOption.create(
            `01JCQZ8X9Y0OPTIONID${i}`,
            validParams.id,
            `オプション${i}`,
            i,
            new Date(),
            new Date()
          )
        );
        expect(() => {
          Product.create(
            validParams.id,
            validParams.name,
            validParams.description,
            validParams.categoryId,
            validParams.status,
            options,
            validParams.createdAt,
            validParams.updatedAt
          );
        }).toThrow('オプションは5個以内である必要があります');
      });
    });
  });
});
