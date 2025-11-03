import { z } from 'zod';

const MAX_NAME_LENGTH = 50;
const MIN_DISPLAY_ORDER = 0;

const categorySchema = z
  .object({
    id: z.string(),
    name: z
      .string()
      .trim()
      .min(1, { message: 'カテゴリー名は空白のみにできません' })
      .max(MAX_NAME_LENGTH, { message: `カテゴリー名は${MAX_NAME_LENGTH}文字以内である必要があります` }),
    parentId: z.string().nullable(),
    displayOrder: z
      .number()
      .min(MIN_DISPLAY_ORDER, { message: `表示順序は${MIN_DISPLAY_ORDER}以上である必要があります` }),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .refine((data) => data.parentId !== data.id, {
    message: '自分自身を親カテゴリーに指定できません',
  });

export class Category {
  private constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly parentId: string | null,
    public readonly displayOrder: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(
    id: string,
    name: string,
    parentId: string | null,
    displayOrder: number,
    createdAt: Date,
    updatedAt: Date,
  ): Category {
    const validated = categorySchema.parse({
      id,
      name,
      parentId,
      displayOrder,
      createdAt,
      updatedAt,
    });

    return new Category(
      validated.id,
      validated.name,
      validated.parentId,
      validated.displayOrder,
      validated.createdAt,
      validated.updatedAt,
    );
  }
}
