/**
 * R2クライアント
 * Cloudflare R2との低レベルな通信を担当
 */
export class R2Client {
  constructor(private readonly bucket: R2Bucket) {}

  /**
   * ファイルをR2にアップロード
   * @param key - R2内のキー（パス）
   * @param body - アップロードするデータ
   * @param options - アップロードオプション
   */
  async put(
    key: string,
    body: ReadableStream | ArrayBuffer | string,
    options?: {
      httpMetadata?: {
        contentType?: string;
      };
    },
  ): Promise<void> {
    await this.bucket.put(key, body, options);
  }

  /**
   * ファイルをR2から削除
   * @param key - 削除するキー（パス）
   */
  async delete(key: string): Promise<void> {
    await this.bucket.delete(key);
  }

  /**
   * 複数ファイルをR2から削除
   * @param keys - 削除するキーの配列
   */
  async deleteMany(keys: string[]): Promise<void> {
    await this.bucket.delete(keys);
  }
}
