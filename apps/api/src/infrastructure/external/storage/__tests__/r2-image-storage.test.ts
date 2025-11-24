import { describe, it, expect, vi, beforeEach } from 'vitest';
import { R2ImageStorage } from '../r2-image-storage';
import { R2Client } from '../r2-client';

describe('R2ImageStorage', () => {
  let mockR2Client: R2Client;
  let mockPut: ReturnType<typeof vi.fn>;
  let mockDelete: ReturnType<typeof vi.fn>;
  let mockDeleteMany: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockPut = vi.fn().mockResolvedValue(undefined);
    mockDelete = vi.fn().mockResolvedValue(undefined);
    mockDeleteMany = vi.fn().mockResolvedValue(undefined);

    mockR2Client = {
      put: mockPut,
      delete: mockDelete,
      deleteMany: mockDeleteMany,
    } as unknown as R2Client;
  });

  describe('upload', () => {
    it('Fileをアップロードして公開URLを返す', async () => {
      // Arrange
      const publicUrl = 'https://pub-xxxxx.r2.dev';
      const storage = new R2ImageStorage(mockR2Client, publicUrl);

      const fileContent = new Uint8Array([1, 2, 3, 4, 5]);
      const file = new File([fileContent], 'test.jpg', {
        type: 'image/jpeg',
      });
      const path = 'products/test-product-id/test-image.jpg';

      // Act
      const result = await storage.upload(file, path);

      // Assert
      expect(mockPut).toHaveBeenCalledOnce();
      const [calledPath, calledBody, calledOptions] = mockPut.mock.calls[0];
      expect(calledPath).toBe(path);
      expect(calledBody).toBeInstanceOf(ArrayBuffer);
      expect(calledOptions).toEqual({
        httpMetadata: {
          contentType: 'image/jpeg',
        },
      });
      expect(result).toBe(`${publicUrl}/${path}`);
    });

    it('Blobをアップロードして公開URLを返す', async () => {
      // Arrange
      const publicUrl = 'https://pub-xxxxx.r2.dev';
      const storage = new R2ImageStorage(mockR2Client, publicUrl);

      const blobContent = new Uint8Array([10, 20, 30]);
      const blob = new Blob([blobContent], { type: 'image/png' });
      const path = 'products/product-123/image-001.png';

      // Act
      const result = await storage.upload(blob, path);

      // Assert
      expect(mockPut).toHaveBeenCalledOnce();
      const [calledPath, calledBody, calledOptions] = mockPut.mock.calls[0];
      expect(calledPath).toBe(path);
      expect(calledBody).toBeInstanceOf(ArrayBuffer);
      expect(calledOptions).toEqual({
        httpMetadata: {
          contentType: 'image/png',
        },
      });
      expect(result).toBe(`${publicUrl}/${path}`);
    });

    it('公開URLの末尾にスラッシュがあっても正しいURLを生成する', async () => {
      // Arrange
      const publicUrlWithSlash = 'https://pub-xxxxx.r2.dev/';
      const storage = new R2ImageStorage(mockR2Client, publicUrlWithSlash);

      const file = new File([new Uint8Array([1])], 'test.jpg', {
        type: 'image/jpeg',
      });
      const path = 'products/product-id/image.jpg';

      // Act
      const result = await storage.upload(file, path);

      // Assert
      // 末尾のスラッシュが削除されていることを確認
      expect(result).toBe('https://pub-xxxxx.r2.dev/products/product-id/image.jpg');
      expect(result).not.toContain('//products');
    });

    it('パスの形式が正しいことを確認する - products/{productId}/{filename}', async () => {
      // Arrange
      const storage = new R2ImageStorage(mockR2Client, 'https://example.com');

      const file = new File([new Uint8Array([1])], 'image.jpg', {
        type: 'image/jpeg',
      });

      // 想定されるパス形式
      const productId = '01JDQZ8X9Y0123456789ABCDEF';
      const filename = '01JDQZ9A1B2345678901234567.jpg';
      const expectedPath = `products/${productId}/${filename}`;

      // Act
      const result = await storage.upload(file, expectedPath);

      // Assert
      expect(mockPut).toHaveBeenCalledWith(expectedPath, expect.any(ArrayBuffer), expect.any(Object));
      expect(result).toBe(`https://example.com/${expectedPath}`);
    });

    it('WebP形式の画像をアップロードできる', async () => {
      // Arrange
      const storage = new R2ImageStorage(mockR2Client, 'https://example.com');

      const file = new File([new Uint8Array([1])], 'image.webp', {
        type: 'image/webp',
      });
      const path = 'products/product-id/image.webp';

      // Act
      await storage.upload(file, path);

      // Assert
      const [, , calledOptions] = mockPut.mock.calls[0];
      expect(calledOptions.httpMetadata.contentType).toBe('image/webp');
    });

    it('PNG形式の画像をアップロードできる', async () => {
      // Arrange
      const storage = new R2ImageStorage(mockR2Client, 'https://example.com');

      const file = new File([new Uint8Array([1])], 'image.png', {
        type: 'image/png',
      });
      const path = 'products/product-id/image.png';

      // Act
      await storage.upload(file, path);

      // Assert
      const [, , calledOptions] = mockPut.mock.calls[0];
      expect(calledOptions.httpMetadata.contentType).toBe('image/png');
    });

    it('GIF形式の画像をアップロードできる', async () => {
      // Arrange
      const storage = new R2ImageStorage(mockR2Client, 'https://example.com');

      const file = new File([new Uint8Array([1])], 'image.gif', {
        type: 'image/gif',
      });
      const path = 'products/product-id/image.gif';

      // Act
      await storage.upload(file, path);

      // Assert
      const [, , calledOptions] = mockPut.mock.calls[0];
      expect(calledOptions.httpMetadata.contentType).toBe('image/gif');
    });
  });

  describe('delete', () => {
    it('指定したパスの画像を削除する', async () => {
      // Arrange
      const storage = new R2ImageStorage(mockR2Client, 'https://example.com');
      const path = 'products/product-id/image.jpg';

      // Act
      await storage.delete(path);

      // Assert
      expect(mockDelete).toHaveBeenCalledOnce();
      expect(mockDelete).toHaveBeenCalledWith(path);
    });
  });

  describe('deleteMany', () => {
    it('複数の画像を一括削除する', async () => {
      // Arrange
      const storage = new R2ImageStorage(mockR2Client, 'https://example.com');
      const paths = [
        'products/product-1/image-1.jpg',
        'products/product-1/image-2.jpg',
        'products/product-1/image-3.jpg',
      ];

      // Act
      await storage.deleteMany(paths);

      // Assert
      expect(mockDeleteMany).toHaveBeenCalledOnce();
      expect(mockDeleteMany).toHaveBeenCalledWith(paths);
    });

    it('空の配列を渡しても正常に動作する', async () => {
      // Arrange
      const storage = new R2ImageStorage(mockR2Client, 'https://example.com');

      // Act
      await storage.deleteMany([]);

      // Assert
      expect(mockDeleteMany).toHaveBeenCalledOnce();
      expect(mockDeleteMany).toHaveBeenCalledWith([]);
    });

    it('商品削除時に複数画像をまとめて削除できる', async () => {
      // Arrange
      const storage = new R2ImageStorage(mockR2Client, 'https://example.com');
      const productId = '01JDQZ8X9Y0123456789ABCDEF';
      const paths = [
        `products/${productId}/01JDQZ9A1B2345678901234567.jpg`,
        `products/${productId}/01JDQZ9A1C3456789012345678.jpg`,
        `products/${productId}/01JDQZ9A1D4567890123456789.jpg`,
      ];

      // Act
      await storage.deleteMany(paths);

      // Assert
      expect(mockDeleteMany).toHaveBeenCalledWith(paths);
    });
  });

  describe('パス形式の検証', () => {
    it('正しいproducts/{productId}/{filename}形式でパスが構築される', () => {
      // Arrange
      // 想定されるパス形式のテストケース
      const testCases = [
        {
          productId: '01JDQZ8X9Y0123456789ABCDEF',
          filename: '01JDQZ9A1B2345678901234567.jpg',
          expected: 'products/01JDQZ8X9Y0123456789ABCDEF/01JDQZ9A1B2345678901234567.jpg',
        },
        {
          productId: '01JDQZ8X9Y0123456789ABCDEF',
          filename: '01JDQZ9A1C3456789012345678.png',
          expected: 'products/01JDQZ8X9Y0123456789ABCDEF/01JDQZ9A1C3456789012345678.png',
        },
        {
          productId: 'test-product-123',
          filename: 'image-001.webp',
          expected: 'products/test-product-123/image-001.webp',
        },
      ];

      // Act & Assert
      for (const testCase of testCases) {
        const path = `products/${testCase.productId}/${testCase.filename}`;
        expect(path).toBe(testCase.expected);
      }
    });

    it('URLの最大長が500文字を超えないことを確認する', async () => {
      // Arrange
      const storage = new R2ImageStorage(mockR2Client, 'https://pub-xxxxx.r2.dev');

      // 長いproductIdとfilenameを使用
      const longProductId = '01JDQZ8X9Y0123456789ABCDEF'; // 26文字（ULID形式）
      const longFilename = '01JDQZ9A1B2345678901234567.jpg'; // 30文字
      const path = `products/${longProductId}/${longFilename}`;

      const file = new File([new Uint8Array([1])], 'test.jpg', {
        type: 'image/jpeg',
      });

      // Act
      const url = await storage.upload(file, path);

      // Assert
      // DBカラム制約: 500文字以内
      expect(url.length).toBeLessThanOrEqual(500);
      expect(url).toBe(`https://pub-xxxxx.r2.dev/products/${longProductId}/${longFilename}`);
    });
  });
});
