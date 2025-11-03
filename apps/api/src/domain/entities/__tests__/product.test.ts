import { describe, it, expect } from 'vitest';
import { Product, ProductStatus } from '../product';

describe('Product Entity', () => {
  const validParams = {
    id: '01JCQZ8X9Y0ABCDEFGHIJKLMN',
    name: '商品名',
    description: '商品説明',
    categoryId: '01JCQZ8X9Y0CATEGORYID123',
    status: ProductStatus.DRAFT,
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
            validParams.createdAt,
            validParams.updatedAt
          );
        }).not.toThrow();
      });

      it('200文字の場合は成功', () => {
        const name = 'あ'.repeat(200);
        expect(() => {
          Product.create(
            validParams.id,
            name,
            validParams.description,
            validParams.categoryId,
            validParams.status,
            validParams.createdAt,
            validParams.updatedAt
          );
        }).not.toThrow();
      });

      it('201文字の場合はエラー', () => {
        const name = 'あ'.repeat(201);
        expect(() => {
          Product.create(
            validParams.id,
            name,
            validParams.description,
            validParams.categoryId,
            validParams.status,
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
            validParams.createdAt,
            validParams.updatedAt
          );
        }).not.toThrow();
      });

      it('4096文字の場合は成功', () => {
        const description = 'あ'.repeat(4096);
        expect(() => {
          Product.create(
            validParams.id,
            validParams.name,
            description,
            validParams.categoryId,
            validParams.status,
            validParams.createdAt,
            validParams.updatedAt
          );
        }).not.toThrow();
      });

      it('4097文字の場合はエラー', () => {
        const description = 'あ'.repeat(4097);
        expect(() => {
          Product.create(
            validParams.id,
            validParams.name,
            description,
            validParams.categoryId,
            validParams.status,
            validParams.createdAt,
            validParams.updatedAt
          );
        }).toThrow('商品説明は4096文字以内である必要があります');
      });
    });
  });
});
