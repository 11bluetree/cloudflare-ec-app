export class Category {
  private static readonly MAX_NAME_LENGTH = 50;

  constructor(
    public readonly id: string,
    private _name: string,
    public readonly parentId: string | null,
    public readonly displayOrder: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {
    // 名前のトリミング
    _name = _name.trim();

    // 文字数制約
    if (_name.length === 0) {
      throw new Error('カテゴリー名は空白のみにできません');
    }
    if (_name.length > Category.MAX_NAME_LENGTH) {
      throw new Error(`カテゴリー名は${Category.MAX_NAME_LENGTH}文字以内である必要があります`);
    }

    // 自己参照チェック
    if (parentId === id) {
      throw new Error('自分自身を親カテゴリーに指定できません');
    }

    // 表示順序制約（0以上）
    if (displayOrder < 0) {
      throw new Error('表示順序は0以上である必要があります');
    }

    this._name = _name;
  }

  get name(): string {
    return this._name;
  }
}
