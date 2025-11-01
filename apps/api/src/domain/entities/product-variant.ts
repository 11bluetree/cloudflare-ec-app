import { Money } from '../value-objects/money';

export class ProductVariant {
  constructor(
    public readonly id: string,
    public readonly productId: string,
    public readonly sku: string,
    private _price: Money,
    private _stockQuantity: number,
    public readonly size: string | null,
    public readonly color: string | null,
    public readonly displayOrder: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {
    if (_stockQuantity < 0) {
      throw new Error('在庫数は0以上である必要があります');
    }
  }

  get price(): Money {
    return this._price;
  }

  get stockQuantity(): number {
    return this._stockQuantity;
  }

  isInStock(): boolean {
    return this._stockQuantity > 0;
  }

  hasEnoughStock(quantity: number): boolean {
    return this._stockQuantity >= quantity;
  }

  decreaseStock(quantity: number): void {
    if (quantity < 0) {
      throw new Error('数量は0以上である必要があります');
    }
    if (!this.hasEnoughStock(quantity)) {
      throw new Error('在庫が不足しています');
    }
    this._stockQuantity -= quantity;
  }

  increaseStock(quantity: number): void {
    if (quantity < 0) {
      throw new Error('数量は0以上である必要があります');
    }
    this._stockQuantity += quantity;
  }

  updatePrice(newPrice: Money): void {
    this._price = newPrice;
  }

  setStockQuantity(quantity: number): void {
    if (quantity < 0) {
      throw new Error('在庫数は0以上である必要があります');
    }
    this._stockQuantity = quantity;
  }

  getVariantName(): string {
    const parts: string[] = [];
    if (this.size) parts.push(this.size);
    if (this.color) parts.push(this.color);
    return parts.join(' / ') || 'デフォルト';
  }
}
