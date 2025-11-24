import type { IImageStorage } from '../../../application/ports/storage/image-storage.interface';
import { R2Client } from './r2-client';

/**
 * R2を利用した画像ストレージ実装
 */
export class R2ImageStorage implements IImageStorage {
  private readonly publicUrlBase: string;

  constructor(
    private readonly r2Client: R2Client,
    bucketPublicUrl: string,
  ) {
    // 末尾のスラッシュを削除
    this.publicUrlBase = bucketPublicUrl.replace(/\/$/, '');
  }

  /**
   * 画像をR2にアップロードし、公開URLを返す
   */
  async upload(file: File | Blob, path: string): Promise<string> {
    // ファイルをArrayBufferに変換
    const arrayBuffer = await file.arrayBuffer();

    // R2にアップロード
    await this.r2Client.put(path, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    // 公開URLを生成して返す
    return `${this.publicUrlBase}/${path}`;
  }

  /**
   * 画像をR2から削除
   */
  async delete(path: string): Promise<void> {
    await this.r2Client.delete(path);
  }

  /**
   * 複数画像をR2から削除
   */
  async deleteMany(paths: string[]): Promise<void> {
    await this.r2Client.deleteMany(paths);
  }
}
