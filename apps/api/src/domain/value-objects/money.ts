/**
 * 値オブジェクト: 価格
 */
export class Money {
  private constructor(private readonly _amount: number) {
    if (_amount < 0) {
      throw new Error('価格は0以上である必要があります');
    }
  }

  static create(amount: number): Money {
    return new Money(amount);
  }

  get amount(): number {
    return this._amount;
  }

  add(other: Money): Money {
    return new Money(this._amount + other._amount);
  }

  multiply(quantity: number): Money {
    if (quantity < 0) {
      throw new Error('数量は0以上である必要があります');
    }
    return new Money(this._amount * quantity);
  }

  equals(other: Money): boolean {
    return this._amount === other._amount;
  }

  toNumber(): number {
    return this._amount;
  }
}
