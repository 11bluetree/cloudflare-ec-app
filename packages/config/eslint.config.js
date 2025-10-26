import js from '@eslint/js'
import tseslint from 'typescript-eslint'

/**
 * 全プロジェクト共通のESLint設定
 * 基本的なルールを定義
 */
export const baseConfig = [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // console.log禁止（開発時にはwarn、本番ではerrorに変更可能）
      'no-console': 'error',
      
      // debugger禁止
      'no-debugger': 'error',
      
      // 未使用変数の禁止（_で始まる変数は許可）
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      
      // any型の使用を警告
      '@typescript-eslint/no-explicit-any': 'warn',
      
      // 空の関数を警告
      '@typescript-eslint/no-empty-function': 'warn',
      
      // 厳格な等価演算子を強制（=== と !==）
      'eqeqeq': ['error', 'always'],
      
      // varの使用を禁止（const/letを使用）
      'no-var': 'error',
      
      // constを優先
      'prefer-const': 'error',
      
      // アロー関数の推奨
      'prefer-arrow-callback': 'warn',
      
      // テンプレートリテラルの推奨
      'prefer-template': 'warn',
      
      // 不要なreturnの禁止
      'no-useless-return': 'error',
      
      // 重複したimportの禁止
      'no-duplicate-imports': 'error',
      
      // 不要なコンストラクタの禁止
      'no-useless-constructor': 'error',
      
      // プロミスのベストプラクティス
      'no-async-promise-executor': 'error',
      'require-await': 'warn',
      
      // 1行の最大文字数を120文字に制限
      'max-len': [
        'error',
        {
          code: 120,
          tabWidth: 2,
          ignoreUrls: true,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
          ignoreRegExpLiterals: true,
          ignoreComments: false,
        },
      ],
    },
  },
]
