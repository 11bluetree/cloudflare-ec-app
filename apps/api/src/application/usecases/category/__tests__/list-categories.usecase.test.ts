import { describe, it, expect, vi, beforeEach } from 'vitest';
import { faker } from '@faker-js/faker';
import { ulid } from 'ulid';
import { ListCategoriesUseCase } from '../list-categories.usecase';
import type { ICategoryRepository } from '../../../ports/repositories/category-repository.interface';
import { Category } from '../../../../domain/entities/category';

describe('ListCategoriesUseCase', () => {
  let categoryRepository: ICategoryRepository;
  let useCase: ListCategoriesUseCase;

  beforeEach(() => {
    categoryRepository = {
      findByIds: vi.fn(),
      findAll: vi.fn(),
    };
    useCase = new ListCategoriesUseCase(categoryRepository);
  });

  describe('正常系', () => {
    it('全カテゴリーを取得して正しい形式で返す', async () => {
      // Arrange
      const now = new Date();
      const rootCategory = Category.create(ulid(), faker.commerce.department(), null, 0, now, now);
      const childCategory = Category.create(ulid(), faker.commerce.productAdjective(), rootCategory.id, 0, now, now);

      vi.mocked(categoryRepository.findAll).mockResolvedValue([rootCategory, childCategory]);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result.categories).toHaveLength(2);
      expect(result.categories[0]).toEqual({
        id: rootCategory.id,
        name: rootCategory.name,
        parentId: null,
        displayOrder: 0,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      });
      expect(result.categories[1]).toEqual({
        id: childCategory.id,
        name: childCategory.name,
        parentId: rootCategory.id,
        displayOrder: 0,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      });
    });

    it('カテゴリーが存在しない場合は空配列を返す', async () => {
      // Arrange
      vi.mocked(categoryRepository.findAll).mockResolvedValue([]);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result.categories).toEqual([]);
    });

    it('複数階層のカテゴリーを正しく返す', async () => {
      // Arrange
      const now = new Date();
      const level1 = Category.create(ulid(), '家電', null, 0, now, now);
      const level2 = Category.create(ulid(), 'パソコン', level1.id, 0, now, now);
      const level3 = Category.create(ulid(), 'ノートPC', level2.id, 0, now, now);

      vi.mocked(categoryRepository.findAll).mockResolvedValue([level1, level2, level3]);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result.categories).toHaveLength(3);
      expect(result.categories[0].parentId).toBeNull();
      expect(result.categories[1].parentId).toBe(level1.id);
      expect(result.categories[2].parentId).toBe(level2.id);
    });
  });

  describe('異常系', () => {
    it('リポジトリがエラーを投げた場合はエラーを伝播する', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      vi.mocked(categoryRepository.findAll).mockRejectedValue(error);

      // Act & Assert
      await expect(useCase.execute()).rejects.toThrow('Database connection failed');
    });
  });
});
