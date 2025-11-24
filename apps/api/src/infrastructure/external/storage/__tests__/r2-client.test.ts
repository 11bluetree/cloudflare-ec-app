import { describe, it, expect, vi } from 'vitest';
import { R2Client } from '../r2-client';

describe('R2Client', () => {
  describe('put', () => {
    it('R2バケットにファイルをアップロードする', async () => {
      // Arrange
      const mockPut = vi.fn().mockResolvedValue(undefined);
      const mockBucket = {
        put: mockPut,
      } as unknown as R2Bucket;

      const r2Client = new R2Client(mockBucket);
      const key = 'products/test-product-id/test-image.jpg';
      const body = new ArrayBuffer(100);
      const options = {
        httpMetadata: {
          contentType: 'image/jpeg',
        },
      };

      // Act
      await r2Client.put(key, body, options);

      // Assert
      expect(mockPut).toHaveBeenCalledOnce();
      expect(mockPut).toHaveBeenCalledWith(key, body, options);
    });

    it('オプションなしでファイルをアップロードできる', async () => {
      // Arrange
      const mockPut = vi.fn().mockResolvedValue(undefined);
      const mockBucket = {
        put: mockPut,
      } as unknown as R2Bucket;

      const r2Client = new R2Client(mockBucket);
      const key = 'test/file.txt';
      const body = 'test content';

      // Act
      await r2Client.put(key, body);

      // Assert
      expect(mockPut).toHaveBeenCalledOnce();
      expect(mockPut).toHaveBeenCalledWith(key, body, undefined);
    });
  });

  describe('delete', () => {
    it('R2バケットから単一ファイルを削除する', async () => {
      // Arrange
      const mockDelete = vi.fn().mockResolvedValue(undefined);
      const mockBucket = {
        delete: mockDelete,
      } as unknown as R2Bucket;

      const r2Client = new R2Client(mockBucket);
      const key = 'products/test-product-id/test-image.jpg';

      // Act
      await r2Client.delete(key);

      // Assert
      expect(mockDelete).toHaveBeenCalledOnce();
      expect(mockDelete).toHaveBeenCalledWith(key);
    });
  });

  describe('deleteMany', () => {
    it('R2バケットから複数ファイルを削除する', async () => {
      // Arrange
      const mockDelete = vi.fn().mockResolvedValue(undefined);
      const mockBucket = {
        delete: mockDelete,
      } as unknown as R2Bucket;

      const r2Client = new R2Client(mockBucket);
      const keys = [
        'products/product-1/image-1.jpg',
        'products/product-1/image-2.jpg',
        'products/product-1/image-3.jpg',
      ];

      // Act
      await r2Client.deleteMany(keys);

      // Assert
      expect(mockDelete).toHaveBeenCalledOnce();
      expect(mockDelete).toHaveBeenCalledWith(keys);
    });

    it('空の配列を渡しても正常に動作する', async () => {
      // Arrange
      const mockDelete = vi.fn().mockResolvedValue(undefined);
      const mockBucket = {
        delete: mockDelete,
      } as unknown as R2Bucket;

      const r2Client = new R2Client(mockBucket);

      // Act
      await r2Client.deleteMany([]);

      // Assert
      expect(mockDelete).toHaveBeenCalledOnce();
      expect(mockDelete).toHaveBeenCalledWith([]);
    });
  });
});
