import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useProductForm } from '../useProductForm';

// sonnerをモック
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('useProductForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('初期化', () => {
    it('デフォルト値で初期化される', () => {
      const { result } = renderHook(() => useProductForm());

      expect(result.current.hasOptions).toBe(false);
      expect(result.current.bulkPrice).toBe('');
      expect(result.current.showVariantForm).toBe(false);
      expect(result.current.optionFields.length).toBe(0);
      expect(result.current.variantFields.length).toBe(1);
    });
  });

  describe('オプション有無の切り替え', () => {
    it('オプションなしからありに切り替えると、デフォルトオプションが1つ追加される', () => {
      const { result } = renderHook(() => useProductForm());

      act(() => {
        result.current.handleHasOptionsChange(true);
      });

      expect(result.current.hasOptions).toBe(true);
      expect(result.current.optionFields.length).toBe(1);
      expect(result.current.variantFields.length).toBe(0);
    });

    it('オプションありからなしに切り替えると、バリアントがリセットされる', () => {
      const { result } = renderHook(() => useProductForm());

      // まずオプションありに
      act(() => {
        result.current.handleHasOptionsChange(true);
      });

      // オプションなしに戻す
      act(() => {
        result.current.handleHasOptionsChange(false);
      });

      expect(result.current.hasOptions).toBe(false);
      expect(result.current.optionFields.length).toBe(0);
      expect(result.current.variantFields.length).toBe(1);
      expect(result.current.showVariantForm).toBe(false);
    });
  });

  describe('オプション追加', () => {
    it('オプションは最大5個まで追加できる', async () => {
      const { result } = renderHook(() => useProductForm());

      act(() => {
        result.current.handleHasOptionsChange(true);
      });

      // すでに1つあるので、4つ追加して合計5つ
      for (let i = 1; i < 5; i++) {
        act(() => {
          result.current.handleAddOption();
        });
      }

      expect(result.current.optionFields.length).toBe(5);

      // 6つ目を追加しようとするとエラー
      const { toast } = await import('sonner');
      act(() => {
        result.current.handleAddOption();
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('オプションは最大5個までです');
      });
      expect(result.current.optionFields.length).toBe(5);
    });
  });

  describe('オプション値追加', () => {
    it('オプション値は最大50個まで追加できる', async () => {
      const { result } = renderHook(() => useProductForm());

      act(() => {
        result.current.handleHasOptionsChange(true);
      });

      // オプション名を設定
      act(() => {
        result.current.form.setValue('options.0.optionName', 'テストオプション');
      });

      // 50個まで追加
      for (let i = 1; i <= 50; i++) {
        act(() => {
          result.current.handleAddOptionValue(0, `値${i}`);
        });
      }

      const values = result.current.form.watch('options.0.values');
      expect(values.length).toBe(50);

      // 51個目を追加しようとするとエラー
      const { toast } = await import('sonner');
      act(() => {
        result.current.handleAddOptionValue(0, '値51');
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('オプション値は最大50個までです');
      });
      expect(result.current.form.watch('options.0.values').length).toBe(50);
    });

    it('同じ値は追加できない', async () => {
      const { result } = renderHook(() => useProductForm());

      act(() => {
        result.current.handleHasOptionsChange(true);
      });

      act(() => {
        result.current.form.setValue('options.0.optionName', 'サイズ');
      });

      act(() => {
        result.current.handleAddOptionValue(0, 'S');
      });

      // 同じ値をもう一度追加
      const { toast } = await import('sonner');
      act(() => {
        result.current.handleAddOptionValue(0, 'S');
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('同じ値が既に存在します');
      });

      const values = result.current.form.watch('options.0.values');
      expect(values.length).toBe(1);
    });
  });

  describe('バリアント生成', () => {
    it('2×2のオプションから4つのバリアントが生成され、SKUが仕様通りに設定される', async () => {
      const { result } = renderHook(() => useProductForm());

      act(() => {
        result.current.handleHasOptionsChange(true);
      });

      // 1つ目のオプション: サイズ（S, M）
      act(() => {
        result.current.form.setValue('options.0.optionName', 'サイズ');
        result.current.handleAddOptionValue(0, 'S');
        result.current.handleAddOptionValue(0, 'M');
      });

      // 2つ目のオプション: 色（Red, Blue）※英語で指定
      act(() => {
        result.current.handleAddOption();
      });

      act(() => {
        result.current.form.setValue('options.1.optionName', 'Color');
        result.current.handleAddOptionValue(1, 'Red');
        result.current.handleAddOptionValue(1, 'Blue');
      });

      // バリアント生成
      const { toast } = await import('sonner');
      act(() => {
        result.current.handleGenerateVariants();
      });

      await waitFor(() => {
        expect(result.current.variantFields.length).toBe(4);
        expect(toast.success).toHaveBeenCalledWith('4個のバリアントを生成しました');
      });

      // SKUが仕様通りに生成されていることを確認
      // 形式: VAR-{オプション値の頭3文字(大文字)}-{連番3桁}
      // SKUは英数字、ハイフン、アンダースコアのみ許可
      const variants = result.current.form.getValues('variants');

      // 1番目: S × Red → VAR-S-RED-001
      expect(variants[0].sku).toBe('VAR-S-RED-001');
      expect(variants[0].sku).toMatch(/^[A-Za-z0-9\-_]+$/); // SKU制約チェック
      expect(variants[0].options[0].optionValue).toBe('S');
      expect(variants[0].options[1].optionValue).toBe('Red');

      // 2番目: S × Blue → VAR-S-BLU-002
      expect(variants[1].sku).toBe('VAR-S-BLU-002');
      expect(variants[1].sku).toMatch(/^[A-Za-z0-9\-_]+$/);
      expect(variants[1].options[0].optionValue).toBe('S');
      expect(variants[1].options[1].optionValue).toBe('Blue');

      // 3番目: M × Red → VAR-M-RED-003
      expect(variants[2].sku).toBe('VAR-M-RED-003');
      expect(variants[2].sku).toMatch(/^[A-Za-z0-9\-_]+$/);
      expect(variants[2].options[0].optionValue).toBe('M');
      expect(variants[2].options[1].optionValue).toBe('Red');

      // 4番目: M × Blue → VAR-M-BLU-004
      expect(variants[3].sku).toBe('VAR-M-BLU-004');
      expect(variants[3].sku).toMatch(/^[A-Za-z0-9\-_]+$/);
      expect(variants[3].options[0].optionValue).toBe('M');
      expect(variants[3].options[1].optionValue).toBe('Blue');
    });

    it('バリアントが100個を超える場合はエラーが表示される', async () => {
      const { result } = renderHook(() => useProductForm());

      act(() => {
        result.current.handleHasOptionsChange(true);
      });

      // 11×10=110個のバリアント
      act(() => {
        result.current.form.setValue('options.0.optionName', 'サイズ');
        for (let i = 1; i <= 11; i++) {
          result.current.handleAddOptionValue(0, `S${i}`);
        }
      });

      act(() => {
        result.current.handleAddOption();
      });

      act(() => {
        result.current.form.setValue('options.1.optionName', '色');
        for (let i = 1; i <= 10; i++) {
          result.current.handleAddOptionValue(1, `色${i}`);
        }
      });

      // バリアント生成を試みる
      const { toast } = await import('sonner');
      act(() => {
        result.current.handleGenerateVariants();
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'バリアントは最大100個までです',
          expect.objectContaining({
            description: '現在の組み合わせ: 110個',
          }),
        );
      });

      // バリアントは生成されない
      expect(result.current.variantFields.length).toBe(0);
    });
  });

  describe('一括価格適用', () => {
    it('全バリアントに価格が適用される', async () => {
      const { result } = renderHook(() => useProductForm());

      act(() => {
        result.current.handleHasOptionsChange(true);
      });

      // オプションとバリアントを作成
      act(() => {
        result.current.form.setValue('options.0.optionName', 'サイズ');
        result.current.handleAddOptionValue(0, 'S');
        result.current.handleAddOptionValue(0, 'M');
      });

      act(() => {
        result.current.handleGenerateVariants();
      });

      // バリアント生成を待つ
      await waitFor(() => {
        expect(result.current.variantFields.length).toBe(2);
      });

      // 生成されたバリアントのデフォルト価格を確認
      const variantsBeforeUpdate = result.current.form.getValues('variants');
      expect(variantsBeforeUpdate[0].price).toBe(0);
      expect(variantsBeforeUpdate[1].price).toBe(0);

      // 一括価格を設定
      act(() => {
        result.current.setBulkPrice('1000');
      });

      act(() => {
        result.current.handleApplyBulkPrice();
      });

      // 価格が正しく設定されているか確認
      const variantsAfterUpdate = result.current.form.getValues('variants');
      expect(variantsAfterUpdate[0].price).toBe(1000);
      expect(variantsAfterUpdate[1].price).toBe(1000);
    });
  });

  describe('日本語オプション値対応', () => {
    it('日本語オプション値でも英数字のみのSKUが生成される', () => {
      const { result } = renderHook(() => useProductForm());

      act(() => {
        result.current.handleHasOptionsChange(true);
      });

      act(() => {
        result.current.handleAddOption();
      });

      act(() => {
        result.current.form.setValue('options.0.optionName', '色');
        result.current.handleAddOptionValue(0, '赤');
        result.current.handleAddOptionValue(0, '青');
      });

      act(() => {
        result.current.form.setValue('options.1.optionName', 'サイズ');
        result.current.handleAddOptionValue(1, 'S');
        result.current.handleAddOptionValue(1, 'M');
      });

      act(() => {
        result.current.handleGenerateVariants();
      });

      const variants = result.current.form.getValues('variants');
      expect(variants).toHaveLength(4);

      // 日本語「赤」「青」は英数字がないので 'OPT' にフォールバック
      // SKU regex に準拠していることを確認
      const skuRegex = /^[A-Za-z0-9\-_]+$/;
      variants.forEach((variant) => {
        expect(variant.sku).toMatch(skuRegex);
      });

      // 英数字のみの 'S', 'M' は正しく抽出される
      expect(variants[0].sku).toBe('VAR-OPT-S-001');
      expect(variants[1].sku).toBe('VAR-OPT-M-002');
      expect(variants[2].sku).toBe('VAR-OPT-S-003');
      expect(variants[3].sku).toBe('VAR-OPT-M-004');

      // オプション値自体は日本語のまま保持される
      expect(variants[0].options[0].optionValue).toBe('赤');
      expect(variants[1].options[0].optionValue).toBe('赤');
      expect(variants[2].options[0].optionValue).toBe('青');
      expect(variants[3].options[0].optionValue).toBe('青');
    });
  });
});
