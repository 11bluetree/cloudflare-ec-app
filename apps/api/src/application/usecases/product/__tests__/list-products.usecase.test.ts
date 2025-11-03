import { describe, it, expect, vi, beforeEach } from 'vitest';
import { faker } from '@faker-js/faker';
import { ListProductsUseCase } from '../list-products.usecase';
import type { IProductRepository } from '../../../ports/repositories/product-repository.interface';
import type { ICategoryRepository } from '../../../ports/repositories/category-repository.interface';
import { Product, ProductStatus } from '../../../../domain/entities/product';
import { Category } from '../../../../domain/entities/category';
import { ProductOption } from '../../../../domain/entities/product-option';
import { ProductVariant } from '../../../../domain/entities/product-variant';
import { ProductVariantOption } from '../../../../domain/entities/product-variant-option';
import { Money } from '../../../../domain/value-objects/money';
import type { ProductAggregate } from '../../../../domain/entities/product-aggregate';
import type { ProductListQuery } from '@cloudflare-ec-app/types';

describe('ListProductsUseCase', () => {
  let useCase: ListProductsUseCase;
  let mockProductRepository: IProductRepository;
  let mockCategoryRepository: ICategoryRepository;

  // テストヘルパー: ProductAggregateを生成
  const createMockProduct = (overrides?: { categoryId?: string; status?: ProductStatus }): ProductAggregate => {
    const productId = faker.string.ulid();
    const optionId = faker.string.ulid();

    const option = ProductOption.create(
      optionId,
      productId,
      faker.commerce.productAdjective(),
      0,
      new Date(),
      new Date(),
    );

    const variantId = faker.string.ulid();
    const variantOption = ProductVariantOption.create(
      faker.string.ulid(),
      variantId,
      faker.commerce.productAdjective(),
      faker.commerce.productMaterial(),
      0,
      new Date(),
      new Date(),
    );

    const variant = ProductVariant.create(
      variantId,
      productId,
      faker.string.alphanumeric(10),
      null,
      null,
      Money.create(faker.number.int({ min: 1000, max: 10000 })),
      0,
      [variantOption],
      new Date(),
      new Date(),
    );

    const product = Product.create(
      productId,
      faker.commerce.productName(),
      faker.commerce.productDescription(),
      overrides?.categoryId || faker.string.ulid(),
      overrides?.status || ProductStatus.PUBLISHED,
      [option],
      new Date(),
      new Date(),
    );

    // ProductAggregateとして返す（variantsとimagesを追加）
    return {
      ...product,
      variants: [variant],
      images: [],
    };
  };

  // テストヘルパー: Categoryエンティティを生成
  const createMockCategory = (id: string): Category => {
    return Category.create(id, faker.commerce.department(), null, 0, new Date(), new Date());
  };

  beforeEach(() => {
    // モックリポジトリを初期化
    mockProductRepository = {
      findMany: vi.fn(),
      findById: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as unknown as IProductRepository;

    mockCategoryRepository = {
      findByIds: vi.fn(),
      findAll: vi.fn(),
      findById: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as unknown as ICategoryRepository;

    useCase = new ListProductsUseCase(mockProductRepository, mockCategoryRepository);
  });

  describe('正常系 - 基本動作', () => {
    it('公開済み商品一覧を取得できる', async () => {
      // Arrange
      const categoryId = faker.string.ulid();
      const mockProducts = [createMockProduct({ categoryId }), createMockProduct({ categoryId })];
      const mockCategory = createMockCategory(categoryId);

      vi.mocked(mockProductRepository.findMany).mockResolvedValue({
        products: mockProducts,
        total: mockProducts.length,
      });

      vi.mocked(mockCategoryRepository.findByIds).mockResolvedValue(new Map([[categoryId, mockCategory]]));

      const query: ProductListQuery = {
        page: 1,
        perPage: 20,
        sortBy: 'createdAt',
        order: 'desc',
      };

      // Act
      const result = await useCase.execute(query);

      // Assert
      expect(result.items).toHaveLength(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.perPage).toBe(20);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.totalPages).toBe(1);
    });

    it('商品とカテゴリ情報が正しく結合される', async () => {
      // Arrange
      const categoryId = faker.string.ulid();
      const mockProduct = createMockProduct({ categoryId });
      const mockCategory = createMockCategory(categoryId);

      vi.mocked(mockProductRepository.findMany).mockResolvedValue({
        products: [mockProduct],
        total: 1,
      });

      vi.mocked(mockCategoryRepository.findByIds).mockResolvedValue(new Map([[categoryId, mockCategory]]));

      const query: ProductListQuery = {
        page: 1,
        perPage: 20,
        sortBy: 'createdAt',
        order: 'desc',
      };

      // Act
      const result = await useCase.execute(query);

      // Assert
      expect(result.items[0].categoryName).toBe(mockCategory.name);
      expect(result.items[0].categoryId).toBe(categoryId);
    });

    it('ページネーション情報が正しく計算される', async () => {
      // Arrange
      const categoryId = faker.string.ulid();
      const mockProducts = Array.from({ length: 10 }, () => createMockProduct({ categoryId }));
      const mockCategory = createMockCategory(categoryId);

      vi.mocked(mockProductRepository.findMany).mockResolvedValue({
        products: mockProducts,
        total: 25, // 総数25件
      });

      vi.mocked(mockCategoryRepository.findByIds).mockResolvedValue(new Map([[categoryId, mockCategory]]));

      const query: ProductListQuery = {
        page: 2,
        perPage: 10,
        sortBy: 'createdAt',
        order: 'desc',
      };

      // Act
      const result = await useCase.execute(query);

      // Assert
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.perPage).toBe(10);
      expect(result.pagination.total).toBe(25);
      expect(result.pagination.totalPages).toBe(3); // 25 / 10 = 3ページ
    });
  });

  describe('正常系 - デフォルト動作', () => {
    it('statusesが未指定の場合、すべてのステータスの商品を取得する', async () => {
      // Arrange
      const categoryId = faker.string.ulid();
      const mockProduct = createMockProduct({ categoryId });
      const mockCategory = createMockCategory(categoryId);

      vi.mocked(mockProductRepository.findMany).mockResolvedValue({
        products: [mockProduct],
        total: 1,
      });

      vi.mocked(mockCategoryRepository.findByIds).mockResolvedValue(new Map([[categoryId, mockCategory]]));

      const query: ProductListQuery = {
        page: 1,
        perPage: 20,
        sortBy: 'createdAt',
        order: 'desc',
        // statuses未指定 = すべてのステータス
      };

      // Act
      await useCase.execute(query);

      // Assert
      // statusesが未指定なので、リポジトリにはそのまま渡される（WHERE句に含まれない）
      expect(mockProductRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          perPage: 20,
        }),
      );
      expect(mockProductRepository.findMany).toHaveBeenCalledWith(
        expect.not.objectContaining({
          statuses: expect.anything(),
        }),
      );
    });

    it('statusesが指定された場合、指定されたステータスで取得される', async () => {
      // Arrange
      const categoryId = faker.string.ulid();
      const mockProduct = createMockProduct({
        categoryId,
        status: ProductStatus.DRAFT,
      });
      const mockCategory = createMockCategory(categoryId);

      vi.mocked(mockProductRepository.findMany).mockResolvedValue({
        products: [mockProduct],
        total: 1,
      });

      vi.mocked(mockCategoryRepository.findByIds).mockResolvedValue(new Map([[categoryId, mockCategory]]));

      const query: ProductListQuery = {
        page: 1,
        perPage: 20,
        statuses: ['draft'],
        sortBy: 'createdAt',
        order: 'desc',
      };

      // Act
      await useCase.execute(query);

      // Assert
      expect(mockProductRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          statuses: ['draft'],
        }),
      );
    });

    it('複数のstatusesを指定した場合、それらのステータスで取得される', async () => {
      // Arrange
      const categoryId = faker.string.ulid();
      const mockProducts = [
        createMockProduct({ categoryId, status: ProductStatus.DRAFT }),
        createMockProduct({ categoryId, status: ProductStatus.PUBLISHED }),
      ];
      const mockCategory = createMockCategory(categoryId);

      vi.mocked(mockProductRepository.findMany).mockResolvedValue({
        products: mockProducts,
        total: 2,
      });

      vi.mocked(mockCategoryRepository.findByIds).mockResolvedValue(new Map([[categoryId, mockCategory]]));

      const query: ProductListQuery = {
        page: 1,
        perPage: 20,
        statuses: ['draft', 'published'],
        sortBy: 'createdAt',
        order: 'desc',
      };

      // Act
      await useCase.execute(query);

      // Assert
      expect(mockProductRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          statuses: ['draft', 'published'],
        }),
      );
    });
  });

  describe('境界値 - 空の結果', () => {
    it('商品が0件の場合、空の配列とページネーション情報を返す', async () => {
      // Arrange
      vi.mocked(mockProductRepository.findMany).mockResolvedValue({
        products: [],
        total: 0,
      });

      const query: ProductListQuery = {
        page: 1,
        perPage: 20,
        sortBy: 'createdAt',
        order: 'desc',
      };

      // Act
      const result = await useCase.execute(query);

      // Assert
      expect(result.items).toEqual([]);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
      expect(mockCategoryRepository.findByIds).not.toHaveBeenCalled();
    });

    it('検索条件に一致する商品がない場合、適切なレスポンスを返す', async () => {
      // Arrange
      vi.mocked(mockProductRepository.findMany).mockResolvedValue({
        products: [],
        total: 0,
      });

      const query: ProductListQuery = {
        page: 1,
        perPage: 20,
        keyword: 'NotExistingProduct',
        sortBy: 'createdAt',
        order: 'desc',
      };

      // Act
      const result = await useCase.execute(query);

      // Assert
      expect(result.items).toEqual([]);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.perPage).toBe(20);
    });
  });

  describe('異常系 - データ整合性', () => {
    it('商品に紐づくカテゴリが存在しない場合、エラーをスローする', async () => {
      // Arrange
      const categoryId = faker.string.ulid();
      const mockProduct = createMockProduct({ categoryId });

      vi.mocked(mockProductRepository.findMany).mockResolvedValue({
        products: [mockProduct],
        total: 1,
      });

      // カテゴリが見つからない
      vi.mocked(mockCategoryRepository.findByIds).mockResolvedValue(new Map());

      const query: ProductListQuery = {
        page: 1,
        perPage: 20,
        sortBy: 'createdAt',
        order: 'desc',
      };

      // Act & Assert
      await expect(useCase.execute(query)).rejects.toThrow(`Category not found: ${categoryId}`);
    });
  });

  describe('パフォーマンス - N+1問題', () => {
    it('複数商品がある場合、カテゴリは一括取得される', async () => {
      // Arrange
      const categoryId1 = faker.string.ulid();
      const categoryId2 = faker.string.ulid();

      const mockProducts = [
        createMockProduct({ categoryId: categoryId1 } as Partial<Product>),
        createMockProduct({ categoryId: categoryId2 } as Partial<Product>),
        createMockProduct({ categoryId: categoryId1 } as Partial<Product>), // 重複
      ];

      const mockCategories = new Map([
        [categoryId1, createMockCategory(categoryId1)],
        [categoryId2, createMockCategory(categoryId2)],
      ]);

      vi.mocked(mockProductRepository.findMany).mockResolvedValue({
        products: mockProducts,
        total: 3,
      });

      vi.mocked(mockCategoryRepository.findByIds).mockResolvedValue(mockCategories);

      const query: ProductListQuery = {
        page: 1,
        perPage: 20,
        sortBy: 'createdAt',
        order: 'desc',
      };

      // Act
      await useCase.execute(query);

      // Assert: findByIdsは1回だけ呼ばれる
      expect(mockCategoryRepository.findByIds).toHaveBeenCalledTimes(1);
    });

    it('重複したカテゴリIDは排除される', async () => {
      // Arrange
      const categoryId = faker.string.ulid();

      const mockProducts = [
        createMockProduct({ categoryId }),
        createMockProduct({ categoryId }),
        createMockProduct({ categoryId }),
      ];

      const mockCategory = createMockCategory(categoryId);

      vi.mocked(mockProductRepository.findMany).mockResolvedValue({
        products: mockProducts,
        total: 3,
      });

      vi.mocked(mockCategoryRepository.findByIds).mockResolvedValue(new Map([[categoryId, mockCategory]]));

      const query: ProductListQuery = {
        page: 1,
        perPage: 20,
        sortBy: 'createdAt',
        order: 'desc',
      };

      // Act
      await useCase.execute(query);

      // Assert: 重複が排除され、1つのIDのみ渡される
      expect(mockCategoryRepository.findByIds).toHaveBeenCalledWith([categoryId]);
    });
  });

  describe('統合テスト - 複雑なケース', () => {
    it('複数カテゴリの商品が混在する場合でも正しく動作する', async () => {
      // Arrange
      const categoryIds = [faker.string.ulid(), faker.string.ulid(), faker.string.ulid()];

      const mockProducts = [
        createMockProduct({ categoryId: categoryIds[0] } as Partial<Product>),
        createMockProduct({ categoryId: categoryIds[1] } as Partial<Product>),
        createMockProduct({ categoryId: categoryIds[2] } as Partial<Product>),
      ];

      const mockCategories = new Map(categoryIds.map((id) => [id, createMockCategory(id)]));

      vi.mocked(mockProductRepository.findMany).mockResolvedValue({
        products: mockProducts,
        total: 3,
      });

      vi.mocked(mockCategoryRepository.findByIds).mockResolvedValue(mockCategories);

      const query: ProductListQuery = {
        page: 1,
        perPage: 20,
        sortBy: 'createdAt',
        order: 'desc',
      };

      // Act
      const result = await useCase.execute(query);

      // Assert
      expect(result.items).toHaveLength(3);
      result.items.forEach((item, index) => {
        expect(item.categoryId).toBe(categoryIds[index]);
        expect(item.categoryName).toBe(mockCategories.get(categoryIds[index])?.name);
      });
    });
  });

  describe('エッジケース', () => {
    it('ページ番号が総ページ数を超える場合、空の結果を返す', async () => {
      // Arrange
      vi.mocked(mockProductRepository.findMany).mockResolvedValue({
        products: [],
        total: 0,
      });

      const query: ProductListQuery = {
        page: 999,
        perPage: 20,
        sortBy: 'createdAt',
        order: 'desc',
      };

      // Act
      const result = await useCase.execute(query);

      // Assert
      expect(result.items).toEqual([]);
      expect(result.pagination.page).toBe(999);
      expect(result.pagination.totalPages).toBe(0);
    });

    it('perPageが最大値の場合でも正しく動作する', async () => {
      // Arrange
      const categoryId = faker.string.ulid();
      const mockProducts = Array.from({ length: 100 }, () => createMockProduct({ categoryId }));
      const mockCategory = createMockCategory(categoryId);

      vi.mocked(mockProductRepository.findMany).mockResolvedValue({
        products: mockProducts,
        total: 100,
      });

      vi.mocked(mockCategoryRepository.findByIds).mockResolvedValue(new Map([[categoryId, mockCategory]]));

      const query: ProductListQuery = {
        page: 1,
        perPage: 100,
        sortBy: 'createdAt',
        order: 'desc',
      };

      // Act
      const result = await useCase.execute(query);

      // Assert
      expect(result.items).toHaveLength(100);
      expect(result.pagination.perPage).toBe(100);
      expect(result.pagination.totalPages).toBe(1);
    });

    it('perPageが最小値の場合でも正しく動作する', async () => {
      // Arrange
      const categoryId = faker.string.ulid();
      const mockProduct = createMockProduct({ categoryId });
      const mockCategory = createMockCategory(categoryId);

      vi.mocked(mockProductRepository.findMany).mockResolvedValue({
        products: [mockProduct],
        total: 10,
      });

      vi.mocked(mockCategoryRepository.findByIds).mockResolvedValue(new Map([[categoryId, mockCategory]]));

      const query: ProductListQuery = {
        page: 1,
        perPage: 1,
        sortBy: 'createdAt',
        order: 'desc',
      };

      // Act
      const result = await useCase.execute(query);

      // Assert
      expect(result.items).toHaveLength(1);
      expect(result.pagination.perPage).toBe(1);
      expect(result.pagination.totalPages).toBe(10); // 10件 / 1件 = 10ページ
    });
  });
});
