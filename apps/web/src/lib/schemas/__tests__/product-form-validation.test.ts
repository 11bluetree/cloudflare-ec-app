import { describe, it, expect } from 'vitest';
import { productFormSchema } from '../product-form';

describe('productFormSchema - オプションとバリアントのバリデーション', () => {
  const baseFormData = {
    name: '商品名',
    description: '商品説明',
    categoryId: '01234567890123456789012345', // 26文字のULID
    hasOptions: false,
    options: [],
  };

  describe('下書きの場合', () => {
    it('オプションなし・バリアントなしで作成できる', () => {
      const formData = {
        ...baseFormData,
        status: 'draft' as const,
        hasOptions: false,
        variants: [],
      };

      const result = productFormSchema.safeParse(formData);
      expect(result.success).toBe(true);
    });

    it('オプションあり・バリアントなしで作成できる', () => {
      const formData = {
        ...baseFormData,
        status: 'draft' as const,
        hasOptions: true,
        options: [
          {
            optionName: '色',
            values: [
              { value: '赤', displayOrder: 1 },
              { value: '青', displayOrder: 2 },
            ],
            displayOrder: 1,
          },
        ],
        variants: [],
      };

      const result = productFormSchema.safeParse(formData);
      expect(result.success).toBe(true);
    });

    it('オプションあり・オプション名が空の場合エラー', () => {
      const formData = {
        ...baseFormData,
        status: 'draft' as const,
        hasOptions: true,
        options: [
          {
            optionName: '',
            values: [{ value: '赤', displayOrder: 1 }],
            displayOrder: 1,
          },
        ],
        variants: [],
      };

      const result = productFormSchema.safeParse(formData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.path.includes('optionName'))).toBe(true);
      }
    });

    it('オプションあり・オプション値が空配列の場合エラー', () => {
      const formData = {
        ...baseFormData,
        status: 'draft' as const,
        hasOptions: true,
        options: [
          {
            optionName: '色',
            values: [],
            displayOrder: 1,
          },
        ],
        variants: [],
      };

      const result = productFormSchema.safeParse(formData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.message.includes('最低1つのオプション値が必要'))).toBe(true);
      }
    });
  });

  describe('公開の場合', () => {
    it('オプションなし・バリアントなしでエラー', () => {
      const formData = {
        ...baseFormData,
        status: 'published' as const,
        hasOptions: false,
        variants: [],
      };

      const result = productFormSchema.safeParse(formData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.message.includes('公開'))).toBe(true);
      }
    });

    it('オプションあり・バリアントなしでエラー', () => {
      const formData = {
        ...baseFormData,
        status: 'published' as const,
        hasOptions: true,
        options: [
          {
            optionName: '色',
            values: [{ value: '赤', displayOrder: 1 }],
            displayOrder: 1,
          },
        ],
        variants: [],
      };

      const result = productFormSchema.safeParse(formData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.message.includes('公開'))).toBe(true);
      }
    });

    it('オプションあり・オプション設定不完全（オプション名が空）でエラー', () => {
      const formData = {
        ...baseFormData,
        status: 'published' as const,
        hasOptions: true,
        options: [
          {
            optionName: '',
            values: [{ value: '赤', displayOrder: 1 }],
            displayOrder: 1,
          },
        ],
        variants: [
          {
            sku: 'TEST-SKU-001',
            price: 1000,
            barcode: undefined,
            options: [{ optionName: '', optionValue: '赤', displayOrder: 1 }],
            displayOrder: 1,
          },
        ],
      };

      const result = productFormSchema.safeParse(formData);
      expect(result.success).toBe(false);
    });

    it('バリアントあり・SKU未入力でエラー', () => {
      const formData = {
        ...baseFormData,
        status: 'published' as const,
        hasOptions: false,
        variants: [
          {
            sku: '',
            price: 1000,
            barcode: undefined,
            options: [{ optionName: 'title', optionValue: 'default', displayOrder: 1 }],
            displayOrder: 1,
          },
        ],
      };

      const result = productFormSchema.safeParse(formData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.path.includes('sku'))).toBe(true);
      }
    });

    it('バリアントあり・価格が0でエラー', () => {
      const formData = {
        ...baseFormData,
        status: 'published' as const,
        hasOptions: false,
        variants: [
          {
            sku: 'TEST-SKU-001',
            price: 0,
            barcode: undefined,
            options: [{ optionName: 'title', optionValue: 'default', displayOrder: 1 }],
            displayOrder: 1,
          },
        ],
      };

      const result = productFormSchema.safeParse(formData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.path.includes('price'))).toBe(true);
      }
    });
  });

  describe('デフォルトオプションの適用', () => {
    it('単一商品（hasOptions: false）の場合、バリアント作成時にデフォルトオプションが必要', () => {
      const formData = {
        ...baseFormData,
        status: 'published' as const,
        hasOptions: false,
        variants: [
          {
            sku: 'TEST-SKU-001',
            price: 1000,
            barcode: undefined,
            options: [{ optionName: 'title', optionValue: 'default', displayOrder: 1 }],
            displayOrder: 1,
          },
        ],
      };

      const result = productFormSchema.safeParse(formData);
      expect(result.success).toBe(true);
    });
  });
});
