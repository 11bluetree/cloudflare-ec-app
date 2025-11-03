import { describe, it, expect } from 'vitest';
import { faker } from '@faker-js/faker';
import { ProductOption } from '../product-option';

describe('ProductOption Entity', () => {
  const validParams = {
    id: faker.string.uuid(),
    productId: faker.string.uuid(),
    optionName: '色',
    displayOrder: faker.number.int({ min: 0, max: 10 }),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('constructor', () => {
    it('正常な値でインスタンスを作成できる', () => {
      expect(() => {
        ProductOption.create(
          validParams.id,
          validParams.productId,
          validParams.optionName,
          validParams.displayOrder,
          validParams.createdAt,
          validParams.updatedAt,
        );
      }).not.toThrow();
    });

    describe('optionName validation', () => {
      it('空文字列の場合はエラー', () => {
        expect(() => {
          ProductOption.create(
            validParams.id,
            validParams.productId,
            '',
            validParams.displayOrder,
            validParams.createdAt,
            validParams.updatedAt,
          );
        }).toThrow('オプション名は空白のみにできません');
      });

      it('空白のみの場合はエラー', () => {
        expect(() => {
          ProductOption.create(
            validParams.id,
            validParams.productId,
            '   ',
            validParams.displayOrder,
            validParams.createdAt,
            validParams.updatedAt,
          );
        }).toThrow('オプション名は空白のみにできません');
      });

      it('前後の空白は自動でトリミングされる', () => {
        expect(() => {
          ProductOption.create(
            validParams.id,
            validParams.productId,
            '  色  ',
            validParams.displayOrder,
            validParams.createdAt,
            validParams.updatedAt,
          );
        }).not.toThrow();
      });

      it('最大文字数の場合は成功', () => {
        const optionName = 'あ'.repeat(50);
        expect(() => {
          ProductOption.create(
            validParams.id,
            validParams.productId,
            optionName,
            validParams.displayOrder,
            validParams.createdAt,
            validParams.updatedAt,
          );
        }).not.toThrow();
      });

      it('最大文字数を超えた場合はエラー', () => {
        const optionName = 'あ'.repeat(51);
        expect(() => {
          ProductOption.create(
            validParams.id,
            validParams.productId,
            optionName,
            validParams.displayOrder,
            validParams.createdAt,
            validParams.updatedAt,
          );
        }).toThrow('オプション名は50文字以内である必要があります');
      });
    });

    describe('displayOrder validation', () => {
      it('表示順序が最小値の場合は成功', () => {
        expect(() => {
          ProductOption.create(
            validParams.id,
            validParams.productId,
            validParams.optionName,
            0,
            validParams.createdAt,
            validParams.updatedAt,
          );
        }).not.toThrow();
      });

      it('表示順序が正の整数の場合は成功', () => {
        expect(() => {
          ProductOption.create(
            validParams.id,
            validParams.productId,
            validParams.optionName,
            100,
            validParams.createdAt,
            validParams.updatedAt,
          );
        }).not.toThrow();
      });

      it('表示順序が範囲外の場合はエラー', () => {
        expect(() => {
          ProductOption.create(
            validParams.id,
            validParams.productId,
            validParams.optionName,
            -1,
            validParams.createdAt,
            validParams.updatedAt,
          );
        }).toThrow('表示順序は0以上である必要があります');
      });
    });
  });
});
