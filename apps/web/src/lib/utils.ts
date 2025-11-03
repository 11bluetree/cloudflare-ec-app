import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * clsxとtailwind-mergeを組み合わせたユーティリティ関数
 * Tailwindクラスの競合を解決しながら、条件付きクラス名を適用
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
