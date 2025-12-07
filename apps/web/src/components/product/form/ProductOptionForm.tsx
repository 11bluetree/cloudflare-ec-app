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
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { Badge, Button, Input } from '../../ui';
import type { ProductFormData } from '../../../lib/schemas/product-form';
import type { UseFormRegister, UseFormWatch } from 'react-hook-form';

type ProductOptionFormProps = {
  optionIndex: number;
  onRemoveOption: (index: number) => void;
  onAddValue: (index: number, value: string) => void;
  onRemoveValue: (optionIndex: number, valueIndex: number) => void;
  onOptionNameChange: (index: number, name: string) => void;
  onReorderValues: (optionIndex: number, newValues: { value: string; displayOrder: number }[]) => void;
  register: UseFormRegister<ProductFormData>;
  watch: UseFormWatch<ProductFormData>;
};

// Sortable Item Component
const SortableBadge = ({ id, value, onRemove }: { id: string; value: string; onRemove: () => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Badge variant="secondary" className="cursor-move gap-1 pr-1 pl-1.5 flex items-center">
        <GripVertical className="mr-1 h-3 w-3 text-slate-400" />
        {value}
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()} // Prevent drag start when clicking remove
          onClick={onRemove}
          className="ml-1 rounded-sm px-1 text-slate-500 hover:bg-slate-200 hover:text-slate-900"
        >
          ×
        </button>
      </Badge>
    </div>
  );
};

/**
 * 商品オプション定義フォームコンポーネント
 */
export const ProductOptionForm: React.FC<ProductOptionFormProps> = ({
  optionIndex,
  onRemoveOption,
  onAddValue,
  onRemoveValue,
  onOptionNameChange,
  onReorderValues,
  register,
  watch,
}) => {
  // 現在のオプション値をwatchで取得
  const currentValues = watch(`options.${optionIndex}.values`) || [];

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = currentValues.findIndex((v) => v.value === active.id);
      const newIndex = currentValues.findIndex((v) => v.value === over.id);

      const newValues = arrayMove(currentValues, oldIndex, newIndex).map((v, i) => ({
        ...v,
        displayOrder: i + 1,
      }));

      onReorderValues(optionIndex, newValues);
    }
  };

  return (
    <div className="mb-4 rounded-md border border-gray-300 p-4">
      <div className="mb-3 flex items-center justify-between">
        <Input
          {...register(`options.${optionIndex}.optionName`)}
          placeholder="オプション名（例: サイズ、色）"
          className="flex-1"
          onBlur={(e) => onOptionNameChange(optionIndex, e.target.value)}
        />
        <Button type="button" onClick={() => onRemoveOption(optionIndex)} variant="destructive" className="ml-2">
          削除
        </Button>
      </div>

      <div className="space-y-3">
        <label className="block text-sm text-gray-600">値（例: S, M, L）</label>

        {/* 入力フィールド */}
        <div className="flex items-center gap-2">
          <Input
            type="text"
            placeholder="新しい値を入力"
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                const input = e.currentTarget;
                onAddValue(optionIndex, input.value);
                input.value = '';
              }
            }}
          />
          <Button
            type="button"
            onClick={(e) => {
              const button = e.currentTarget;
              const input = button.previousElementSibling;
              if (input instanceof HTMLInputElement) {
                onAddValue(optionIndex, input.value);
                input.value = '';
              }
            }}
          >
            追加
          </Button>
        </div>

        {/* バッジ表示 */}
        {currentValues.length > 0 && (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={currentValues.map((v) => v.value)} strategy={horizontalListSortingStrategy}>
              <div className="flex flex-wrap gap-2">
                {currentValues.map((val, valueIndex) => (
                  <SortableBadge
                    key={val.value}
                    id={val.value}
                    value={val.value}
                    onRemove={() => onRemoveValue(optionIndex, valueIndex)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
};
