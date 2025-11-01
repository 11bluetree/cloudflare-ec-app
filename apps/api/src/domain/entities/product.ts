export const ProductStatus = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const;

export type ProductStatus = typeof ProductStatus[keyof typeof ProductStatus];

export class Product {
  private static readonly MAX_NAME_LENGTH = 200;
  private static readonly MAX_DESCRIPTION_LENGTH = 4096;

  constructor(
    public readonly id: string,
    private _name: string,
    private _description: string,
    public readonly categoryId: string,
    private _status: ProductStatus,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {
    // 文字数制約のバリデーション
    if (_name.length === 0 || _name.length > Product.MAX_NAME_LENGTH) {
      throw new Error(`商品名は1文字以上${Product.MAX_NAME_LENGTH}文字以内である必要があります`);
    }
    if (_description.length === 0 || _description.length > Product.MAX_DESCRIPTION_LENGTH) {
      throw new Error(`商品説明は1文字以上${Product.MAX_DESCRIPTION_LENGTH}文字以内である必要があります`);
    }
  }

  get name(): string {
    return this._name;
  }

  get description(): string {
    return this._description;
  }

  get status(): ProductStatus {
    return this._status;
  }
}
