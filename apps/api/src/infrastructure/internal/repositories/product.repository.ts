import type { DbInstance } from '../db';
import type { 
  IProductRepository, 
  ProductSearchCriteria, 
  PaginatedResult, 
  ProductWithDetails 
} from '../../../application/ports/repositories';
import { 
  toProductEntity, 
  toProductVariantEntity, 
  toProductImageEntity 
} from '../mappers/product.mapper';
import { productsTable, productVariantsTable, productImagesTable } from '../db/schema';
import { count, eq, like, and, or, desc, asc, inArray } from 'drizzle-orm';
import type { Product, ProductVariant, ProductImage } from '@cloudflare-ec-app/library';

export class ProductRepository implements IProductRepository {
  constructor(private readonly db: DbInstance) {}

  async search(criteria: ProductSearchCriteria): Promise<PaginatedResult<ProductWithDetails>> {
    // 検索条件の構築
    const conditions = [];

    if (criteria.categoryId) {
      conditions.push(eq(productsTable.categoryId, criteria.categoryId));
    }

    if (criteria.status) {
      conditions.push(eq(productsTable.status, criteria.status));
    }

    if (criteria.keyword) {
      conditions.push(
        or(
          like(productsTable.name, `%${criteria.keyword}%`),
          like(productsTable.description, `%${criteria.keyword}%`)
        )
      );
    }

    // 価格フィルター（バリアントの価格を考慮）
    // 簡略化のため、基本的な実装
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // 総件数を取得
    const [{ total }] = await this.db
      .select({ total: count() })
      .from(productsTable)
      .where(whereClause);

    // ソート順の決定（priceは商品テーブルにないので、name/createdAtのみ）
    let orderByClause;
    if (criteria.sortBy === 'name') {
      orderByClause = criteria.order === 'asc' ? asc(productsTable.name) : desc(productsTable.name);
    } else {
      orderByClause = criteria.order === 'asc' ? asc(productsTable.createdAt) : desc(productsTable.createdAt);
    }

    // ページネーション付きで商品を取得
    const offset = (criteria.page - 1) * criteria.limit;
    const productRows = await this.db
      .select()
      .from(productsTable)
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(criteria.limit)
      .offset(offset);

    // 商品IDを抽出
    const productIds = productRows.map(p => p.id);

    // バリアントと画像を一括取得
    const variants = productIds.length > 0
      ? await this.db
          .select()
          .from(productVariantsTable)
          .where(inArray(productVariantsTable.productId, productIds))
      : [];

    const images = productIds.length > 0
      ? await this.db
          .select()
          .from(productImagesTable)
          .where(inArray(productImagesTable.productId, productIds))
      : [];

    // 価格フィルタリング（バリアント価格を使用）
    let filteredProductIds = new Set(productIds);
    if (criteria.minPrice !== undefined || criteria.maxPrice !== undefined) {
      const priceFilteredIds = new Set<string>();
      for (const variant of variants) {
        const matchesMin = criteria.minPrice === undefined || variant.price >= criteria.minPrice;
        const matchesMax = criteria.maxPrice === undefined || variant.price <= criteria.maxPrice;
        if (matchesMin && matchesMax) {
          priceFilteredIds.add(variant.productId);
        }
      }
      filteredProductIds = priceFilteredIds;
    }

    // エンティティに変換
    const items: ProductWithDetails[] = productRows
      .filter(row => filteredProductIds.has(row.id))
      .map(row => {
        const product = toProductEntity(row);
        const productVariants = variants
          .filter(v => v.productId === row.id)
          .map(toProductVariantEntity);
        const productImages = images
          .filter(i => i.productId === row.id)
          .map(toProductImageEntity);

        // バリアントと画像をProductエンティティに設定
        product.setVariants(productVariants);
        product.setImages(productImages);

        return {
          product,
          variants: productVariants,
          images: productImages,
        };
      });

    return {
      items,
      pagination: {
        page: criteria.page,
        limit: criteria.limit,
        total,
        totalPages: Math.ceil(total / criteria.limit),
      },
    };
  }

  async findById(id: string): Promise<ProductWithDetails | null> {
    const [productRow] = await this.db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, id))
      .limit(1);

    if (!productRow) return null;

    const variants = await this.db
      .select()
      .from(productVariantsTable)
      .where(eq(productVariantsTable.productId, id));

    const images = await this.db
      .select()
      .from(productImagesTable)
      .where(eq(productImagesTable.productId, id));

    const product = toProductEntity(productRow);
    const productVariants = variants.map(toProductVariantEntity);
    const productImages = images.map(toProductImageEntity);

    // バリアントと画像をProductエンティティに設定
    product.setVariants(productVariants);
    product.setImages(productImages);

    return {
      product,
      variants: productVariants,
      images: productImages,
    };
  }

  async create(product: Product): Promise<Product> {
    await this.db.insert(productsTable).values({
      id: product.id,
      name: product.name,
      description: product.description,
      categoryId: product.categoryId,
      status: product.status,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    });

    return product;
  }

  async update(product: Product): Promise<Product> {
    await this.db
      .update(productsTable)
      .set({
        name: product.name,
        description: product.description,
        status: product.status,
        updatedAt: new Date(),
      })
      .where(eq(productsTable.id, product.id));

    return product;
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(productsTable).where(eq(productsTable.id, id));
  }

  async addVariant(productId: string, variant: ProductVariant): Promise<ProductVariant> {
    await this.db.insert(productVariantsTable).values({
      id: variant.id,
      productId,
      sku: variant.sku,
      price: variant.price.toNumber(),
      stockQuantity: variant.stockQuantity,
      size: variant.size,
      color: variant.color,
      displayOrder: variant.displayOrder,
      createdAt: variant.createdAt,
      updatedAt: variant.updatedAt,
    });

    return variant;
  }

  async addImage(image: ProductImage): Promise<ProductImage> {
    await this.db.insert(productImagesTable).values({
      id: image.id,
      productId: image.productId,
      productVariantId: image.productVariantId,
      imageUrl: image.imageUrl,
      displayOrder: image.displayOrder,
      createdAt: image.createdAt,
    });

    return image;
  }
}
