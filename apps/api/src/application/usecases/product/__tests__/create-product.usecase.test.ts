import { describe, it, expect, vi, beforeEach } from 'vitest';
import { faker } from '@faker-js/faker';
import { CreateProductUseCase } from '../create-product.usecase';
import type { IProductRepository } from '../../../ports/repositories/product-repository.interface';
import type { ICategoryRepository } from '../../../ports/repositories/category-repository.interface';
import type { IImageStorage } from '../../../ports/storage/image-storage.interface';
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
  let mockImageStorage: IImageStorage;

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

    // モックImageStorageの準備
    mockImageStorage = {
      upload: vi.fn().mockImplementation((file: File, path: string) => {
        // R2の公開URLを模擬（実際のファイル名を使用）
        return Promise.resolve(`https://pub-test.r2.dev/${path}`);
      }),
      delete: vi.fn().mockResolvedValue(undefined),
      deleteMany: vi.fn().mockResolvedValue(undefined),
    };

    useCase = new CreateProductUseCase(mockProductRepository, mockCategoryRepository, mockImageStorage);
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

  describe('画像アップロード', () => {
    it('画像ファイル配列を受け取りR2にアップロードしてProductDetailsに含める', async () => {
      // Arrange
      const optionName = 'サイズ';
      const request: CreateProductRequest = {
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        categoryId,
        status: 'published',
        options: [{ optionName, displayOrder: 1 }],
        variants: [
          {
            sku: generateTestSKU(),
            price: 1000,
            barcode: undefined,
            displayOrder: 1,
            options: [{ optionName, optionValue: 'M', displayOrder: 1 }],
          },
        ],
        // 画像ファイルを追加（この時点ではFile[]の想定）
        images: [
          new File([new Uint8Array([1, 2, 3])], 'image1.jpg', { type: 'image/jpeg' }),
          new File([new Uint8Array([4, 5, 6])], 'image2.jpg', { type: 'image/jpeg' }),
        ] as unknown as File[], // File[] にキャスト
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result).toBeDefined();
      expect(mockProductRepository.create).toHaveBeenCalledOnce();

      // ProductDetailsに画像が含まれていることを確認
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const createdProductDetails = (mockProductRepository.create as any).mock.calls[0][0];
      expect(createdProductDetails.images).toHaveLength(2);

      // 画像URLのフォーマット確認: https://...r2.dev/products/{productId}/{imageId}.jpg
      expect(createdProductDetails.images[0].imageUrl).toMatch(
        /^https:\/\/.+\/products\/[A-Z0-9]{26}\/[A-Z0-9]{26}\.jpg$/,
      );
      expect(createdProductDetails.images[1].imageUrl).toMatch(
        /^https:\/\/.+\/products\/[A-Z0-9]{26}\/[A-Z0-9]{26}\.jpg$/,
      );
    });

    it('画像が指定されない場合は空配列でProductDetailsを作成する', async () => {
      // Arrange
      const optionName = 'サイズ';
      const request: CreateProductRequest = {
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        categoryId,
        status: 'published',
        options: [{ optionName, displayOrder: 1 }],
        variants: [
          {
            sku: generateTestSKU(),
            price: 1000,
            barcode: undefined,
            displayOrder: 1,
            options: [{ optionName, optionValue: 'M', displayOrder: 1 }],
          },
        ],
        // images未指定
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result).toBeDefined();
      expect(mockProductRepository.create).toHaveBeenCalledOnce();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const createdProductDetails = (mockProductRepository.create as any).mock.calls[0][0];
      expect(createdProductDetails.images).toEqual([]);
    });

    it('画像ファイルのパスはproducts/{productId}/{filename}形式になる', async () => {
      // Arrange
      const optionName = 'サイズ';
      const request: CreateProductRequest = {
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        categoryId,
        status: 'published',
        options: [{ optionName, displayOrder: 1 }],
        variants: [
          {
            sku: generateTestSKU(),
            price: 1000,
            barcode: undefined,
            displayOrder: 1,
            options: [{ optionName, optionValue: 'M', displayOrder: 1 }],
          },
        ],
        images: [new File([new Uint8Array([1, 2, 3])], 'test-image.jpg', { type: 'image/jpeg' })] as unknown as File[],
      };

      // Act
      await useCase.execute(request);

      // Assert
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const createdProductDetails = (mockProductRepository.create as any).mock.calls[0][0];
      const imageUrl = createdProductDetails.images[0].imageUrl;

      // パス形式の検証: products/{productId}/{filename}
      expect(imageUrl).toMatch(/\/products\/[A-Z0-9]{26}\/[A-Z0-9]+\.jpg$/);
    });

    it('画像のdisplayOrderは1から連番で設定される', async () => {
      // Arrange
      const optionName = 'サイズ';
      const request: CreateProductRequest = {
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        categoryId,
        status: 'published',
        options: [{ optionName, displayOrder: 1 }],
        variants: [
          {
            sku: generateTestSKU(),
            price: 1000,
            barcode: undefined,
            displayOrder: 1,
            options: [{ optionName, optionValue: 'M', displayOrder: 1 }],
          },
        ],
        images: [
          new File([new Uint8Array([1])], 'img1.jpg', { type: 'image/jpeg' }),
          new File([new Uint8Array([2])], 'img2.jpg', { type: 'image/jpeg' }),
          new File([new Uint8Array([3])], 'img3.jpg', { type: 'image/jpeg' }),
        ] as unknown as File[],
      };

      // Act
      await useCase.execute(request);

      // Assert
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const createdProductDetails = (mockProductRepository.create as any).mock.calls[0][0];
      expect(createdProductDetails.images[0].displayOrder).toBe(1);
      expect(createdProductDetails.images[1].displayOrder).toBe(2);
      expect(createdProductDetails.images[2].displayOrder).toBe(3);
    });
  });

  describe('バリアント画像割り当て', () => {
    it('バリアントにimageIndexを指定すると、対応するProductImageのproductVariantIdが設定される', async () => {
      // Arrange
      const optionName = 'カラー';
      const request: CreateProductRequest = {
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        categoryId,
        status: 'published',
        options: [{ optionName, displayOrder: 1 }],
        variants: [
          {
            sku: generateTestSKU(),
            price: 1000,
            barcode: undefined,
            displayOrder: 1,
            options: [{ optionName, optionValue: 'Red', displayOrder: 1 }],
            imageIndex: 0, // 1枚目の画像を割り当て
          },
          {
            sku: generateTestSKU(),
            price: 1000,
            barcode: undefined,
            displayOrder: 2,
            options: [{ optionName, optionValue: 'Blue', displayOrder: 2 }],
            imageIndex: 1, // 2枚目の画像を割り当て
          },
          {
            sku: generateTestSKU(),
            price: 1000,
            barcode: undefined,
            displayOrder: 3,
            options: [{ optionName, optionValue: 'Green', displayOrder: 3 }],
            imageIndex: undefined, // 画像なし
          },
        ],
        images: [
          new File([new Uint8Array([1])], 'red.jpg', { type: 'image/jpeg' }),
          new File([new Uint8Array([2])], 'blue.jpg', { type: 'image/jpeg' }),
        ] as unknown as File[],
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result).toBeDefined();
      expect(mockProductRepository.create).toHaveBeenCalledOnce();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const createdProductDetails = (mockProductRepository.create as any).mock.calls[0][0];
      const variants = createdProductDetails.variants;
      const images = createdProductDetails.images;

      expect(variants).toHaveLength(3);
      expect(images).toHaveLength(2);

      // 画像1 (Red) は バリアント1 (Red) に紐付いていること
      expect(images[0].productVariantId).toBe(variants[0].id);

      // 画像2 (Blue) は バリアント2 (Blue) に紐付いていること
      expect(images[1].productVariantId).toBe(variants[1].id);

      // バリアント3 (Green) に紐付く画像はないこと（images配列に含まれる画像で確認）
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const greenVariantImage = images.find((img: any) => img.productVariantId === variants[2].id);
      expect(greenVariantImage).toBeUndefined();
    });
  });
});
