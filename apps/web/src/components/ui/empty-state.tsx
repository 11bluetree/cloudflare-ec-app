export interface EmptyStateProps {
  title: string
  description?: string
  icon?: React.ReactNode
}

/**
 * データがない状態を表示するコンポーネント
 */
export function EmptyState({ title, description, icon }: EmptyStateProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-12 text-center">
      {icon || (
        <svg
          className="mx-auto w-16 h-16 text-gray-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      )}
      <p className="text-xl text-gray-600 mb-2">{title}</p>
      {description && (
        <p className="text-sm text-gray-500">{description}</p>
      )}
    </div>
  )
}
