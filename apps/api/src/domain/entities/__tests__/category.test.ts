import { describe, it, expect } from 'vitest';
import { faker } from '@faker-js/faker';
import { Category } from '../category';

describe('Category Entity', () => {
  const validParams = {
    id: faker.string.uuid(),
    name: faker.commerce.department(),
    parentId: faker.string.uuid(),
    displayOrder: faker.number.int({ min: 1, max: 100 }),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('constructor', () => {
    it('正常な値でインスタンスを作成できる', () => {
      expect(() => {
        Category.create(
          validParams.id,
          validParams.name,
          validParams.parentId,
          validParams.displayOrder,
          validParams.createdAt,
          validParams.updatedAt
        );
      }).not.toThrow();
    });

    it('parentIdがnullでも作成できる（ルートカテゴリー）', () => {
      expect(() => {
        Category.create(
          validParams.id,
          validParams.name,
          null,
          validParams.displayOrder,
          validParams.createdAt,
          validParams.updatedAt
        );
      }).not.toThrow();
    });

    describe('name validation', () => {
      it('空文字列の場合はエラー', () => {
        expect(() => {
          Category.create(
            validParams.id,
            '',
            validParams.parentId,
            validParams.displayOrder,
            validParams.createdAt,
            validParams.updatedAt
          );
        }).toThrow('カテゴリー名は空白のみにできません');
      });

      it('空白のみの場合はエラー', () => {
        expect(() => {
          Category.create(
            validParams.id,
            '   ',
            validParams.parentId,
            validParams.displayOrder,
            validParams.createdAt,
            validParams.updatedAt
          );
        }).toThrow('カテゴリー名は空白のみにできません');
      });

      it('前後の空白は自動でトリミングされる', () => {
        expect(() => {
          Category.create(
            validParams.id,
            '  カテゴリー名  ',
            validParams.parentId,
            validParams.displayOrder,
            validParams.createdAt,
            validParams.updatedAt
          );
        }).not.toThrow();
      });

      it('最大文字数の場合は成功', () => {
        const name = 'あ'.repeat(50);
        expect(() => {
          Category.create(
            validParams.id,
            name,
            validParams.parentId,
            validParams.displayOrder,
            validParams.createdAt,
            validParams.updatedAt
          );
        }).not.toThrow();
      });

      it('最大文字数を超えた場合はエラー', () => {
        const name = 'あ'.repeat(51);
        expect(() => {
          Category.create(
            validParams.id,
            name,
            validParams.parentId,
            validParams.displayOrder,
            validParams.createdAt,
            validParams.updatedAt
          );
        }).toThrow('カテゴリー名は50文字以内である必要があります');
      });
    });

    describe('parentId validation', () => {
      it('自分自身を親に指定した場合はエラー', () => {
        expect(() => {
          Category.create(
            validParams.id,
            validParams.name,
            validParams.id, // 自分自身のIDを親に指定
            validParams.displayOrder,
            validParams.createdAt,
            validParams.updatedAt
          );
        }).toThrow('自分自身を親カテゴリーに指定できません');
      });
    });

    describe('displayOrder validation', () => {
      it('表示順序が最小値の場合は成功', () => {
        expect(() => {
          Category.create(
            validParams.id,
            validParams.name,
            validParams.parentId,
            0,
            validParams.createdAt,
            validParams.updatedAt
          );
        }).not.toThrow();
      });

      it('表示順序が正の整数の場合は成功', () => {
        expect(() => {
          Category.create(
            validParams.id,
            validParams.name,
            validParams.parentId,
            100,
            validParams.createdAt,
            validParams.updatedAt
          );
        }).not.toThrow();
      });

      it('表示順序が負の場合はエラー', () => {
        expect(() => {
          Category.create(
            validParams.id,
            validParams.name,
            validParams.parentId,
            -1,
            validParams.createdAt,
            validParams.updatedAt
          );
        }).toThrow('表示順序は0以上である必要があります');
      });
    });
  });
});
