import type { ProductListQuery } from '@cloudflare-ec-app/types';
import type { IProductRepository } from '../../../application/ports/repositories/product-repository.interface';
import { Product, ProductStatus } from '../../../domain/entities/product';
import { ProductOption } from '../../../domain/entities/product-option';
import { ProductVariant } from '../../../domain/entities/product-variant';
import { ProductVariantOption } from '../../../domain/entities/product-variant-option';
import { ProductImage } from '../../../domain/entities/product-image';
import { Money } from '../../../domain/value-objects/money';
import { eq, and, like, or, sql } from 'drizzle-orm';
import { products, productOptions, productVariants, productVariantOptions, productImages } from '../db/schema';
import type { DrizzleDB } from '../db/connection';

/**
 * 商品リポジトリ実装（Drizzle ORM + Cloudflare D1）
 */
export class ProductRepository implements IProductRepository {
  constructor(private readonly db: DrizzleDB) {}

  async findMany(query: ProductListQuery): Promise<{
    products: Product[];
    total: number;
  }> {
    const { page, perPage, categoryId, keyword, minPrice, 
      maxPrice, status: statusParam, sortBy, order: orderDir } = query;
    const offset = (page - 1) * perPage;

    // WHERE句の条件を構築
    const conditions = [];

    if (statusParam) {
      conditions.push(eq(products.status, statusParam));
    }

    if (categoryId) {
      conditions.push(eq(products.categoryId, categoryId));
    }

    if (keyword) {
      const keywordPattern = `%${keyword}%`;
      conditions.push(
        or(
          like(products.name, keywordPattern),
          like(products.description, keywordPattern)
        )
      );
    }

    // 価格フィルタは後で処理（EXISTS相当の処理が必要）
    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

    // 総件数を取得
    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(whereCondition);
    
    const total = countResult[0]?.count ?? 0;

    if (total === 0) {
      return { products: [], total: 0 };
    }

    // 商品IDの一覧を取得（ソート付き）
    let productQuery = this.db
      .select({ id: products.id })
      .from(products)
      .where(whereCondition)
      .limit(perPage)
      .offset(offset);

    // ソート順を適用
    if (sortBy === 'name') {
      productQuery = productQuery.orderBy(
        orderDir === 'asc' ? products.name : sql`${products.name} DESC`
      ) as any;
    } else {
      productQuery = productQuery.orderBy(
        orderDir === 'asc' ? products.createdAt : sql`${products.createdAt} DESC`
      ) as any;
    }

    const productRows = await productQuery;

    if (productRows.length === 0) {
      return { products: [], total };
    }

    // 各商品の詳細情報を並列取得（Product集約全体）
    const productList = await Promise.all(
      productRows.map((row) => this.getProduct(row.id))
    );

    // 価格フィルタを適用（メモリ上でフィルタリング）
    let filteredProducts = productList;
    if (minPrice !== undefined || maxPrice !== undefined) {
      filteredProducts = productList.filter((product) => {
        const variants = (product as any).variants || [];
        return variants.some((variant: ProductVariant) => {
          const price = variant.price.toNumber();
          if (minPrice !== undefined && price < minPrice) return false;
          if (maxPrice !== undefined && price > maxPrice) return false;
          return true;
        });
      });
    }

    return { products: filteredProducts, total };
  }

  /**
   * 商品を取得（Product集約全体：options, variants, images込み）
   */
  private async getProduct(productId: string): Promise<Product> {
    const productRows = await this.db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (productRows.length === 0) {
      throw new Error(`Product not found: ${productId}`);
    }

    const row = productRows[0];

    // Product集約の構成要素を並列取得
    const [opts, variants, images] = await Promise.all([
      this.getProductOptions(productId),
      this.getProductVariants(productId),
      this.getProductImages(productId),
    ]);

    // Productエンティティを構築
    const product = Product.create(
      row.id,
      row.name,
      row.description,
      row.categoryId,
      row.status as ProductStatus,
      opts,
      row.createdAt,
      row.updatedAt
    );

    // NOTE: 現在のProductエンティティにvariantsとimagesのプロパティがない場合、
    // 一時的にanyでキャストして追加（後でProductエンティティを拡張する）
    (product as any).variants = variants;
    (product as any).images = images;

    return product;
  }

  /**
   * 商品のオプション一覧を取得
   */
  private async getProductOptions(productId: string): Promise<ProductOption[]> {
    const rows = await this.db
      .select()
      .from(productOptions)
      .where(eq(productOptions.productId, productId))
      .orderBy(productOptions.displayOrder);

    return rows.map((row) =>
      ProductOption.create(
        row.id,
        row.productId,
        row.optionName,
        row.displayOrder,
        row.createdAt,
        row.updatedAt
      )
    );
  }

  /**
   * 商品画像の一覧を取得
   */
  private async getProductImages(productId: string): Promise<ProductImage[]> {
    const rows = await this.db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, productId))
      .orderBy(productImages.displayOrder);

    return rows.map((row) =>
      ProductImage.create(
        row.id,
        row.productId,
        row.productVariantId,
        row.imageUrl,
        row.displayOrder,
        row.createdAt,
        row.updatedAt
      )
    );
  }

  /**
   * 商品のバリアント一覧を取得（ドメインエンティティ）
   */
  private async getProductVariants(productId: string): Promise<ProductVariant[]> {
    const rows = await this.db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, productId))
      .orderBy(productVariants.displayOrder);

    // 各バリアントのドメインエンティティを構築
    return await Promise.all(
      rows.map(async (row) => {
        const options = await this.getVariantOptions(row.id);

        // バリアントエンティティを生成（バリデーション込み）
        return ProductVariant.create(
          row.id,
          row.productId,
          row.sku,
          row.barcode,
          row.imageUrl,
          Money.create(row.price), // number → Money
          row.displayOrder,
          options,
          row.createdAt,
          row.updatedAt
        );
      })
    );
  }

  /**
   * バリアントのオプション一覧を取得（ドメインエンティティ）
   */
  private async getVariantOptions(variantId: string): Promise<ProductVariantOption[]> {
    const rows = await this.db
      .select()
      .from(productVariantOptions)
      .where(eq(productVariantOptions.productVariantId, variantId))
      .orderBy(productVariantOptions.displayOrder);

    // オプションのドメインエンティティを生成
    return rows.map((row) =>
      ProductVariantOption.create(
        row.id,
        row.productVariantId,
        row.optionName,
        row.optionValue,
        row.displayOrder,
        row.createdAt,
        row.updatedAt
      )
    );
  }
}
