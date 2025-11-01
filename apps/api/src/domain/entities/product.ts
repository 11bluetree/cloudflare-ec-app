import { ProductVariant } from './product-variant';
import { ProductImage } from './product-image';

export enum ProductStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export class Product {
  private static readonly MAX_VARIANTS = 500;

  private _variants: ProductVariant[] = [];
  private _images: ProductImage[] = [];

  constructor(
    public readonly id: string,
    private _name: string,
    private _description: string,
    public readonly categoryId: string,
    private _status: ProductStatus,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  get name(): string {
    return this._name;
  }

  get description(): string {
    return this._description;
  }

  get status(): ProductStatus {
    return this._status;
  }

  get variants(): ReadonlyArray<ProductVariant> {
    return this._variants;
  }

  get images(): ReadonlyArray<ProductImage> {
    return this._images;
  }

  setVariants(variants: ProductVariant[]): void {
    if (variants.length > Product.MAX_VARIANTS) {
      throw new Error(`バリアントは${Product.MAX_VARIANTS}種類までしか登録できません`);
    }
    this._variants = variants;
  }

  addVariant(variant: ProductVariant): void {
    if (this._variants.length >= Product.MAX_VARIANTS) {
      throw new Error(`バリアントは${Product.MAX_VARIANTS}種類までしか登録できません`);
    }
    this._variants.push(variant);
  }

  setImages(images: ProductImage[]): void {
    this._images = images;
  }

  isPublished(): boolean {
    return this._status === ProductStatus.PUBLISHED;
  }

  isArchived(): boolean {
    return this._status === ProductStatus.ARCHIVED;
  }

  isDraft(): boolean {
    return this._status === ProductStatus.DRAFT;
  }

  publish(): void {
    if (this._status === ProductStatus.ARCHIVED) {
      throw new Error('アーカイブ済みの商品は公開できません');
    }
    if (this._variants.length === 0) {
      throw new Error('バリアントが登録されていない商品は公開できません');
    }
    this._status = ProductStatus.PUBLISHED;
  }

  archive(): void {
    this._status = ProductStatus.ARCHIVED;
  }

  unpublish(): void {
    if (this._status === ProductStatus.ARCHIVED) {
      throw new Error('アーカイブ済みの商品は下書きに戻せません');
    }
    this._status = ProductStatus.DRAFT;
  }

  isInStock(): boolean {
    return this._variants.some((variant) => variant.isInStock());
  }

  getMinPrice(): number | null {
    if (this._variants.length === 0) return null;
    return Math.min(...this._variants.map((v) => v.price.toNumber()));
  }

  getMaxPrice(): number | null {
    if (this._variants.length === 0) return null;
    return Math.max(...this._variants.map((v) => v.price.toNumber()));
  }

  getThumbnailImage(): ProductImage | null {
    if (this._images.length === 0) return null;
    return this._images.reduce((prev, current) => {
      return prev.displayOrder < current.displayOrder ? prev : current;
    });
  }

  getVariant(variantId: string): ProductVariant | null {
    return this._variants.find((v) => v.id === variantId) || null;
  }

  findVariantBySku(sku: string): ProductVariant | null {
    return this._variants.find((v) => v.sku === sku) || null;
  }
}
