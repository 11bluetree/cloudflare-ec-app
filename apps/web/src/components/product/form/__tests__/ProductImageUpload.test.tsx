import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProductImageUpload } from '../ProductImageUpload';

// モックファイルを作成するヘルパー
const createMockFile = (name: string, size: number, type: string): File => {
  const file = new File([''], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

describe('ProductImageUpload', () => {
  const mockOnChange = vi.fn();
  const defaultProps = {
    images: [],
    onChange: mockOnChange,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // URL.createObjectURLとrevokeObjectURLをモック
    globalThis.URL.createObjectURL = vi.fn(() => 'mock-url');
    globalThis.URL.revokeObjectURL = vi.fn();
  });

  describe('初期表示', () => {
    it('画像選択UIが表示される', () => {
      render(<ProductImageUpload {...defaultProps} />);

      expect(screen.getByText(/画像を選択/i)).toBeInTheDocument();
      expect(screen.getByText(/ドラッグ&ドロップ/i)).toBeInTheDocument();
    });

    it('input要素がmultiple属性を持つ', () => {
      render(<ProductImageUpload {...defaultProps} />);

      const input = screen.getByLabelText(/画像を選択/i);
      expect(input).toHaveAttribute('multiple');
      expect(input).toHaveAttribute('accept', 'image/jpeg,image/png,image/webp,image/gif');
    });
  });

  describe('画像選択', () => {
    it('有効な画像ファイルを選択できる', async () => {
      render(<ProductImageUpload {...defaultProps} />);

      const file = createMockFile('test.jpg', 1024 * 1024, 'image/jpeg');
      const input = screen.getByLabelText(/画像を選択/i) as HTMLInputElement;

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith([file]);
      });
    });

    it('複数の画像を同時に選択できる', async () => {
      render(<ProductImageUpload {...defaultProps} />);

      const files = [
        createMockFile('test1.jpg', 1024 * 1024, 'image/jpeg'),
        createMockFile('test2.png', 2 * 1024 * 1024, 'image/png'),
        createMockFile('test3.webp', 500 * 1024, 'image/webp'),
      ];
      const input = screen.getByLabelText(/画像を選択/i) as HTMLInputElement;

      fireEvent.change(input, { target: { files } });

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(files);
      });
    });

    it('既存の画像に追加で選択できる', async () => {
      const existingFile = createMockFile('existing.jpg', 1024 * 1024, 'image/jpeg');
      render(<ProductImageUpload {...defaultProps} images={[existingFile]} />);

      const newFile = createMockFile('new.jpg', 1024 * 1024, 'image/jpeg');
      const input = screen.getByLabelText(/画像を選択/i) as HTMLInputElement;

      fireEvent.change(input, { target: { files: [newFile] } });

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith([existingFile, newFile]);
      });
    });
  });

  describe('画像枚数制限', () => {
    it('最大枚数を超えた場合はエラーメッセージが表示される', async () => {
      render(<ProductImageUpload {...defaultProps} />);

      const files = Array.from({ length: 11 }, (_, i) => createMockFile(`test${i}.jpg`, 1024 * 1024, 'image/jpeg'));
      const input = screen.getByLabelText(/画像を選択/i) as HTMLInputElement;

      fireEvent.change(input, { target: { files } });

      await waitFor(() => {
        expect(screen.getByText('画像は最大10枚までです')).toBeInTheDocument();
      });

      // onChangeは呼ばれない
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('既存画像と合わせて最大枚数を超える場合はエラー', async () => {
      const existingFiles = Array.from({ length: 8 }, (_, i) =>
        createMockFile(`existing${i}.jpg`, 1024 * 1024, 'image/jpeg'),
      );
      render(<ProductImageUpload {...defaultProps} images={existingFiles} />);

      const newFiles = Array.from({ length: 3 }, (_, i) => createMockFile(`new${i}.jpg`, 1024 * 1024, 'image/jpeg'));
      const input = screen.getByLabelText(/画像を選択/i) as HTMLInputElement;

      fireEvent.change(input, { target: { files: newFiles } });

      await waitFor(() => {
        expect(screen.getByText('画像は最大10枚までです')).toBeInTheDocument();
      });

      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('ファイルサイズ制限', () => {
    it('最大サイズを超えた場合はエラーメッセージが表示される', async () => {
      render(<ProductImageUpload {...defaultProps} />);

      const file = createMockFile('large.jpg', 11 * 1024 * 1024, 'image/jpeg');
      const input = screen.getByLabelText(/画像を選択/i) as HTMLInputElement;

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('ファイルサイズは10MB以下にしてください')).toBeInTheDocument();
      });

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('複数ファイルの一部が制限超えの場合、有効なファイルのみ追加される', async () => {
      render(<ProductImageUpload {...defaultProps} />);

      const validFile = createMockFile('valid.jpg', 5 * 1024 * 1024, 'image/jpeg');
      const invalidFile = createMockFile('invalid.jpg', 11 * 1024 * 1024, 'image/jpeg');
      const input = screen.getByLabelText(/画像を選択/i) as HTMLInputElement;

      fireEvent.change(input, { target: { files: [validFile, invalidFile] } });

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith([validFile]);
        expect(screen.getByText(/一部のファイルがスキップされました/i)).toBeInTheDocument();
      });
    });
  });

  describe('ファイル形式制限', () => {
    it('非対応の形式の場合はエラーメッセージが表示される', async () => {
      render(<ProductImageUpload {...defaultProps} />);

      const file = createMockFile('test.pdf', 1024 * 1024, 'application/pdf');
      const input = screen.getByLabelText(/画像を選択/i) as HTMLInputElement;

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('対応していないファイル形式です（JPEG, PNG, WebP, GIF）')).toBeInTheDocument();
      });

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('対応形式のみが追加される', async () => {
      render(<ProductImageUpload {...defaultProps} />);

      const validFile = createMockFile('valid.jpg', 1024 * 1024, 'image/jpeg');
      const invalidFile = createMockFile('invalid.pdf', 1024 * 1024, 'application/pdf');
      const input = screen.getByLabelText(/画像を選択/i) as HTMLInputElement;

      fireEvent.change(input, { target: { files: [validFile, invalidFile] } });

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith([validFile]);
        expect(screen.getByText(/一部のファイルがスキップされました/i)).toBeInTheDocument();
      });
    });
  });

  describe('画像プレビュー', () => {
    it('選択した画像がプレビュー表示される', async () => {
      const { rerender } = render(<ProductImageUpload {...defaultProps} />);

      const file = createMockFile('test.jpg', 1024 * 1024, 'image/jpeg');
      const input = screen.getByLabelText(/画像を選択/i) as HTMLInputElement;

      fireEvent.change(input, { target: { files: [file] } });

      // onChangeが呼ばれたことを確認し、新しいimagesで再レンダリング
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith([file]);
      });

      // コンポーネントを新しいimagesで再レンダリング
      rerender(<ProductImageUpload images={[file]} onChange={mockOnChange} />);

      await waitFor(() => {
        const previewImage = screen.getByAltText('test.jpg');
        expect(previewImage).toBeInTheDocument();
        expect(previewImage).toHaveAttribute('src', 'mock-url');
      });
    });

    it('複数画像のプレビューが表示される', async () => {
      const files = [
        createMockFile('test1.jpg', 1024 * 1024, 'image/jpeg'),
        createMockFile('test2.png', 1024 * 1024, 'image/png'),
      ];
      render(<ProductImageUpload {...defaultProps} images={files} />);

      await waitFor(() => {
        expect(screen.getByAltText('test1.jpg')).toBeInTheDocument();
        expect(screen.getByAltText('test2.png')).toBeInTheDocument();
      });
    });
  });

  describe('画像削除', () => {
    it('削除ボタンで画像を削除できる', async () => {
      const files = [
        createMockFile('test1.jpg', 1024 * 1024, 'image/jpeg'),
        createMockFile('test2.png', 1024 * 1024, 'image/png'),
      ];
      render(<ProductImageUpload {...defaultProps} images={files} />);

      const deleteButtons = screen.getAllByLabelText(/削除/i);
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith([files[1]]);
      });
    });

    it('全ての画像を削除できる', async () => {
      const file = createMockFile('test.jpg', 1024 * 1024, 'image/jpeg');
      render(<ProductImageUpload {...defaultProps} images={[file]} />);

      const deleteButton = screen.getByLabelText(/削除/i);
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith([]);
      });
    });
  });

  describe('ドラッグ&ドロップ', () => {
    it('ファイルをドロップできる', async () => {
      render(<ProductImageUpload {...defaultProps} />);

      const file = createMockFile('test.jpg', 1024 * 1024, 'image/jpeg');
      const dropZone = screen.getByText(/ドラッグ&ドロップ/i).closest('div');

      const dataTransfer = {
        files: [file],
        items: [
          {
            kind: 'file',
            type: file.type,
            getAsFile: () => file,
          },
        ],
        types: ['Files'],
      };

      fireEvent.drop(dropZone!, { dataTransfer });

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith([file]);
      });
    });

    it('ドラッグオーバー時にスタイルが変更される', () => {
      render(<ProductImageUpload {...defaultProps} />);

      // ドロップゾーンを取得（最上位のdivがドロップゾーン）
      const dropZone = screen.getByText(/ドラッグ&ドロップ/i).closest('div')?.parentElement;

      fireEvent.dragOver(dropZone!);
      expect(dropZone).toHaveClass('border-primary');

      fireEvent.dragLeave(dropZone!);
      expect(dropZone).not.toHaveClass('border-primary');
    });
  });

  describe('並び替え', () => {
    it('画像の順序を変更できる', async () => {
      // JSDOM環境ではレイアウト計算が行われないため、getBoundingClientRectをモックする
      const originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;
      HTMLElement.prototype.getBoundingClientRect = vi.fn(function (this: HTMLElement) {
        if (this.classList.contains('group') && this.getAttribute('role') === 'button') {
          const parent = this.parentElement;
          if (parent) {
            const index = Array.from(parent.children).indexOf(this);
            return {
              width: 100,
              height: 100,
              top: 0,
              left: index * 100,
              bottom: 100,
              right: (index + 1) * 100,
              x: index * 100,
              y: 0,
              toJSON: () => {},
            };
          }
        }
        return {
          width: 0,
          height: 0,
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          x: 0,
          y: 0,
          toJSON: () => {},
        };
      });

      try {
        const files = [
          createMockFile('test1.jpg', 1024 * 1024, 'image/jpeg'),
          createMockFile('test2.png', 1024 * 1024, 'image/png'),
          createMockFile('test3.webp', 1024 * 1024, 'image/webp'),
        ];
        render(<ProductImageUpload {...defaultProps} images={files} />);

        const image2 = screen.getByAltText('test2.png').closest('div[role="button"]');
        if (!image2) throw new Error('Sortable item not found');

        (image2 as HTMLElement).focus();

        // Spaceキーで持ち上げる
        fireEvent.keyDown(image2, { code: 'Space', key: ' ' });
        await new Promise((r) => setTimeout(r, 100));

        // 左矢印キーで移動
        fireEvent.keyDown(image2, { code: 'ArrowLeft', key: 'ArrowLeft' });
        await new Promise((r) => setTimeout(r, 100));

        // Spaceキーでドロップ
        fireEvent.keyDown(image2, { code: 'Space', key: ' ' });

        await waitFor(() => {
          expect(mockOnChange).toHaveBeenCalledWith([files[1], files[0], files[2]]);
        });
      } finally {
        HTMLElement.prototype.getBoundingClientRect = originalGetBoundingClientRect;
      }
    });
  });

  describe('アクセシビリティ', () => {
    it('適切なaria-labelが設定されている', () => {
      render(<ProductImageUpload {...defaultProps} />);

      expect(screen.getByLabelText(/画像を選択/i)).toBeInTheDocument();
    });

    it('エラーメッセージにrole="alert"が設定される', async () => {
      render(<ProductImageUpload {...defaultProps} />);

      const file = createMockFile('large.jpg', 11 * 1024 * 1024, 'image/jpeg');
      const input = screen.getByLabelText(/画像を選択/i) as HTMLInputElement;

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        const errorMessage = screen.getByText('ファイルサイズは10MB以下にしてください');
        expect(errorMessage.closest('[role="alert"]')).toBeInTheDocument();
      });
    });
  });
});
