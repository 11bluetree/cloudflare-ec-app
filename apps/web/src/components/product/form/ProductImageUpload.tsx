import React, { useRef, useState, useCallback } from 'react';
import { Upload, X } from 'lucide-react';
import { Button } from '../../ui/button';
import { cn } from '../../../lib/utils';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ProductImageUploadProps {
  images: File[];
  onChange: (images: File[]) => void;
}

// 定数
const MAX_IMAGES = 10;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_MIME_TYPES = 'image/jpeg,image/png,image/webp,image/gif';

interface ImagePreview {
  id: string;
  file: File;
  url: string;
}

// Sortable Image Component
const SortableImage = ({
  id,
  preview,
  index,
  onRemove,
}: {
  id: string;
  preview: ImagePreview;
  index: number;
  onRemove: () => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="group relative aspect-square cursor-move overflow-hidden rounded-lg border"
    >
      <img src={preview.url} alt={preview.file.name} className="h-full w-full object-cover" />
      {/* 画像操作ボタン */}
      <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
        <Button
          type="button"
          size="sm"
          variant="destructive"
          onPointerDown={(e) => e.stopPropagation()} // Prevent drag start
          onClick={onRemove}
          aria-label="削除"
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      {/* 画像番号 */}
      <div className="absolute left-2 top-2 rounded bg-black/70 px-2 py-1 text-xs text-white">{index + 1}</div>
    </div>
  );
};

export const ProductImageUpload: React.FC<ProductImageUploadProps> = ({ images, onChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previews, setPreviews] = useState<ImagePreview[]>([]);

  // 外部からのimages変更を反映
  React.useEffect(() => {
    // 既存のプレビューURLをクリーンアップ
    previews.forEach((preview) => URL.revokeObjectURL(preview.url));

    // 新しいプレビューを作成
    const newPreviews = images.map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}`,
      file,
      url: URL.createObjectURL(file),
    }));
    setPreviews(newPreviews);

    // クリーンアップ
    return () => {
      newPreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images]);

  // ファイルのバリデーション
  const validateFile = (file: File): string | null => {
    // ファイル形式チェック
    if (!ALLOWED_TYPES.includes(file.type)) {
      return '対応していないファイル形式です（JPEG, PNG, WebP, GIF）';
    }

    // ファイルサイズチェック
    if (file.size > MAX_FILE_SIZE) {
      return 'ファイルサイズは10MB以下にしてください';
    }

    return null;
  };

  // ファイル追加処理
  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;

      setError(null);

      const filesArray = Array.from(fileList);
      const currentCount = images.length;

      // 枚数制限チェック
      if (currentCount + filesArray.length > MAX_IMAGES) {
        setError('画像は最大10枚までです');
        return;
      }

      // バリデーション
      const validFiles: File[] = [];
      let hasInvalidFile = false;

      for (const file of filesArray) {
        const validationError = validateFile(file);
        if (validationError) {
          setError(validationError);
          hasInvalidFile = true;
          // 一部が無効な場合、有効なファイルのみ追加
          continue;
        }
        validFiles.push(file);
      }

      if (validFiles.length > 0) {
        onChange([...images, ...validFiles]);
        if (hasInvalidFile) {
          setError('一部のファイルがスキップされました');
        }
      }
    },
    [images, onChange],
  );

  // ファイル選択ハンドラ
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  // ドラッグ&ドロップハンドラ
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  // 画像削除
  const handleRemove = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = previews.findIndex((p) => p.id === active.id);
      const newIndex = previews.findIndex((p) => p.id === over.id);

      const newImages = arrayMove(images, oldIndex, newIndex);
      onChange(newImages);
    }
  };

  return (
    <div className="space-y-4">
      {/* アップロードエリア */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'rounded-lg border-2 border-dashed p-8 text-center transition-colors',
          isDragOver ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400',
        )}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <div className="mt-4">
          <label htmlFor="image-upload" className="cursor-pointer">
            <span className="text-sm font-medium text-blue-600 hover:text-blue-700">画像を選択</span>
            <input
              ref={fileInputRef}
              id="image-upload"
              type="file"
              multiple
              accept={ALLOWED_MIME_TYPES}
              onChange={handleFileSelect}
              className="sr-only"
              aria-label="画像を選択"
            />
          </label>
          <span className="text-sm text-gray-500"> またはドラッグ&ドロップ</span>
        </div>
        <p className="mt-2 text-xs text-gray-500">JPEG, PNG, WebP, GIF（最大10MB、{MAX_IMAGES}枚まで）</p>
      </div>

      {/* エラーメッセージ */}
      {error && (
        <div role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* プレビュー */}
      {previews.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={previews.map((p) => p.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {previews.map((preview, index) => (
                <SortableImage
                  key={preview.id}
                  id={preview.id}
                  preview={preview}
                  index={index}
                  onRemove={() => handleRemove(index)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
};
