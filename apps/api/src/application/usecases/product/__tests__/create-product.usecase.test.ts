import { describe, it, expect, vi, beforeEach } from 'vitest';
import { faker } from '@faker-js/faker';
import { CreateProductUseCase } from '../create-product.usecase';
import type { IProductRepository } from '../../../ports/repositories/product-repository.interface';
import type { ICategoryRepository } from '../../../ports/repositories/category-repository.interface';
import { SKUBrandSchema, type CreateProductRequest } from '@cloudflare-ec-app/types';
import { Category } from '../../../../domain/entities/category';

/**
 * テスト用のSKUを生成
 */
const generateTestSKU = () => {
  const sku = faker.string.alphanumeric(10).toUpperCase();
  return SKUBrandSchema.parse(sku);
};

describe('CreateProductUseCase', () => {
  let useCase: CreateProductUseCase;
  let mockProductRepository: IProductRepository;
  let mockCategoryRepository: ICategoryRepository;

  const categoryId = faker.string.alphanumeric(26);
  const now = new Date();

  beforeEach(() => {
    // モックリポジトリの準備
    mockProductRepository = {
      findMany: vi.fn(),
      create: vi.fn(),
    };

    mockCategoryRepository = {
      findByIds: vi
        .fn()
        .mockResolvedValue(
          new Map([
            [
              categoryId,
              Category.create(
                categoryId,
                faker.commerce.department(),
                null,
                faker.number.int({ min: 1, max: 100 }),
                now,
                now,
              ),
            ],
          ]),
        ),
      findAll: vi.fn(),
    };

    useCase = new CreateProductUseCase(mockProductRepository, mockCategoryRepository);
  });

  describe('正常系', () => {
    it('オプション/バリアント未指定で商品定義のみが正しく作成される', async () => {
      // Arrange
      const request: CreateProductRequest = {
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        categoryId,
        status: 'draft',
        // options, variants は省略（商品定義のみ）
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result).toBeDefined();
      expect(result.name).toBe(request.name);
      expect(result.description).toBe(request.description);
      expect(result.categoryId).toBe(categoryId);
      expect(result.status).toBe('draft');
      expect(result.options).toEqual([]);
      expect(result.variants).toEqual([]);
      expect(mockProductRepository.create).toHaveBeenCalledOnce();
    });

    it('単一バリアント指定で商品が正しく作成される', async () => {
      // Arrange
      const optionName = faker.commerce.productAdjective();
      const sku = generateTestSKU();
      const price = faker.number.int({ min: 100, max: 99999 });

      const request: CreateProductRequest = {
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        categoryId,
        status: 'published',
        options: [{ optionName, displayOrder: 1 }],
        variants: [
          {
            sku,
            price,
            barcode: undefined,
            displayOrder: 1,
            options: [
              {
                optionName,
                optionValue: faker.commerce.productMaterial(),
                displayOrder: 1,
              },
            ],
          },
        ],
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result).toBeDefined();
      expect(result.options).toHaveLength(1);
      expect(result.variants).toHaveLength(1);
      expect(result.variants[0].sku).toBe(sku);
      expect(mockProductRepository.create).toHaveBeenCalledOnce();
    });

    it('複数バリアント（3個）指定で商品が正しく作成される', async () => {
      // Arrange
      const optionName = faker.commerce.productAdjective();
      const request: CreateProductRequest = {
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        categoryId,
        status: 'published',
        options: [{ optionName, displayOrder: 1 }],
        variants: [
          {
            sku: generateTestSKU(),
            price: faker.number.int({ min: 100, max: 99999 }),
            barcode: undefined,
            displayOrder: 1,
            options: [{ optionName, optionValue: faker.commerce.productMaterial(), displayOrder: 1 }],
          },
          {
            sku: generateTestSKU(),
            price: faker.number.int({ min: 100, max: 99999 }),
            barcode: undefined,
            displayOrder: 2,
            options: [{ optionName, optionValue: faker.commerce.productMaterial(), displayOrder: 1 }],
          },
          {
            sku: generateTestSKU(),
            price: faker.number.int({ min: 100, max: 99999 }),
            barcode: undefined,
            displayOrder: 3,
            options: [{ optionName, optionValue: faker.commerce.productMaterial(), displayOrder: 1 }],
          },
        ],
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result).toBeDefined();
      expect(result.variants).toHaveLength(3);
      expect(result.variants[0].displayOrder).toBe(1);
      expect(result.variants[1].displayOrder).toBe(2);
      expect(result.variants[2].displayOrder).toBe(3);
      expect(mockProductRepository.create).toHaveBeenCalledOnce();
    });

    it('複数オプション（色×サイズ）で商品が正しく作成される', async () => {
      // Arrange
      const colorOption = faker.color.human();
      const sizeOption = faker.commerce.productAdjective();
      const request: CreateProductRequest = {
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        categoryId,
        status: 'published',
        options: [
          { optionName: colorOption, displayOrder: 1 },
          { optionName: sizeOption, displayOrder: 2 },
        ],
        variants: [
          {
            sku: generateTestSKU(),
            price: faker.number.int({ min: 100, max: 99999 }),
            barcode: undefined,
            displayOrder: 1,
            options: [
              { optionName: colorOption, optionValue: faker.color.human(), displayOrder: 1 },
              { optionName: sizeOption, optionValue: 'M', displayOrder: 2 },
            ],
          },
        ],
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result).toBeDefined();
      expect(result.options).toHaveLength(2);
      expect(result.variants).toHaveLength(1);
      expect(result.variants[0].options).toHaveLength(2);
      expect(mockProductRepository.create).toHaveBeenCalledOnce();
    });
  });

  describe('異常系', () => {
    it('カテゴリーが存在しない場合エラー', async () => {
      // Arrange
      const invalidCategoryId = faker.string.alphanumeric(26);
      mockCategoryRepository.findByIds = vi.fn().mockResolvedValue(new Map()); // 空のMap

      const request: CreateProductRequest = {
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        categoryId: invalidCategoryId,
        status: 'draft',
      };

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow(`Category not found: ${invalidCategoryId}`);
      expect(mockProductRepository.create).not.toHaveBeenCalled();
    });

    it('商品名が空の場合バリデーションエラー', async () => {
      // Arrange
      const request: CreateProductRequest = {
        name: '', // 空文字
        description: faker.commerce.productDescription(),
        categoryId,
        status: 'draft',
      };

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow();
      expect(mockProductRepository.create).not.toHaveBeenCalled();
    });

    it('商品名が最大文字数を超える場合バリデーションエラー', async () => {
      // Arrange
      const MAX_NAME_LENGTH = 200;
      const request: CreateProductRequest = {
        name: 'あ'.repeat(MAX_NAME_LENGTH + 1), // 201文字
        description: faker.commerce.productDescription(),
        categoryId,
        status: 'draft',
      };

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow();
      expect(mockProductRepository.create).not.toHaveBeenCalled();
    });

    it('バリアント数が上限を超える場合バリデーションエラー', async () => {
      // Arrange
      const MAX_VARIANTS = 100;
      const optionName = faker.commerce.productAdjective();

      // 101個のバリアントを生成
      const variants = Array.from({ length: MAX_VARIANTS + 1 }, (_, i) => ({
        sku: generateTestSKU(),
        price: faker.number.int({ min: 100, max: 99999 }),
        barcode: undefined,
        displayOrder: i + 1,
        options: [{ optionName, optionValue: faker.commerce.productMaterial(), displayOrder: 1 }],
      }));

      const request: CreateProductRequest = {
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        categoryId,
        status: 'draft',
        options: [{ optionName, displayOrder: 1 }],
        variants,
      };

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow();
      expect(mockProductRepository.create).not.toHaveBeenCalled();
    });
  });
});
