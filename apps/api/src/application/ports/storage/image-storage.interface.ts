/**
 * 画像ストレージのインターフェース
 * R2やS3などのオブジェクトストレージの抽象化
 */
export interface IImageStorage {
  /**
   * 画像をアップロード
   * @param file - アップロードするファイル（File または Blob）
   * @param path - 保存先パス（例: products/{productId}/{filename}）
   * @returns 公開URL
   */
  upload(file: File | Blob, path: string): Promise<string>;

  /**
   * 画像を削除
   * @param path - 削除する画像のパス
   */
  delete(path: string): Promise<void>;

  /**
   * 複数画像を削除
   * @param paths - 削除する画像のパス配列
   */
  deleteMany(paths: string[]): Promise<void>;
}
