import type { CreateProductRequest, CreateProductResponse } from '@cloudflare-ec-app/types';
import type { IProductRepository } from '../../ports/repositories/product-repository.interface';
import type { ICategoryRepository } from '../../ports/repositories/category-repository.interface';
import { Product } from '../../../domain/entities/product';
import { ProductOption } from '../../../domain/entities/product-option';
import { ProductVariant } from '../../../domain/entities/product-variant';
import { ProductVariantOption } from '../../../domain/entities/product-variant-option';
import { ProductDetails } from '../../../domain/entities/product-details';
import { Money } from '../../../domain/value-objects/money';
import { ProductMapper } from '../../../infrastructure/internal/mappers/product.mapper';
import { ulid } from 'ulid';

export class CreateProductUseCase {
  constructor(
    private readonly productRepository: IProductRepository,
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  async execute(request: CreateProductRequest): Promise<CreateProductResponse> {
    // 1. カテゴリーの存在確認
    const categoriesMap = await this.categoryRepository.findByIds([request.categoryId]);
    if (!categoriesMap.has(request.categoryId)) {
      throw new Error(`Category not found: ${request.categoryId}`);
    }

    // 2. ID生成
    const productId = ulid();
    const now = new Date();

    // 3. オプション処理（指定された場合のみ生成）
    const options: ProductOption[] = [];
    if (request.options && request.options.length > 0) {
      for (const optionData of request.options) {
        const optionId = ulid();
        options.push(
          ProductOption.create(optionId, productId, optionData.optionName, optionData.displayOrder, now, now),
        );
      }
    }

    // 4. バリアント処理（指定された場合のみ生成）
    const variants: ProductVariant[] = [];
    if (request.variants && request.variants.length > 0) {
      for (const variantData of request.variants) {
        const variantId = ulid();

        // バリアントオプションを構築
        const variantOptions: ProductVariantOption[] = [];
        for (const optionData of variantData.options) {
          const variantOptionId = ulid();
          variantOptions.push(
            ProductVariantOption.create(
              variantOptionId,
              variantId,
              optionData.optionName,
              optionData.optionValue,
              optionData.displayOrder,
              now,
              now,
            ),
          );
        }

        // バリアントを構築
        const variant = ProductVariant.create(
          variantId,
          productId,
          variantData.sku,
          variantData.barcode ?? null,
          variantData.imageUrl ?? null,
          Money.create(variantData.price),
          variantData.displayOrder,
          variantOptions,
          now,
          now,
        );

        variants.push(variant);
      }
    }

    // 5. Productエンティティを構築
    const product = Product.create(
      productId,
      request.name,
      request.description,
      request.categoryId,
      request.status,
      options,
      now,
      now,
    );

    // 6. ProductDetails集約ルートを構築（ビジネスルール検証）
    const productDetails = ProductDetails.create(
      product,
      variants,
      [], // images（商品登録時は空）
    );

    // 7. リポジトリで永続化
    await this.productRepository.create(productDetails);

    // 8. レスポンスDTOを返却
    return ProductMapper.toCreateProductResponseDTO(productDetails);
  }
}
