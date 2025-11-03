import { Button } from './button'

export interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

/**
 * ページネーションコンポーネント
 * 現在のページの前後2ページと最初・最後のページを表示し、省略記号で間を省略
 */
export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  const getPageNumbers = () => {
    return Array.from({ length: totalPages }, (_, i) => i + 1).filter((page) => {
      // 現在のページの前後2ページと最初・最後のページを表示
      return (
        page === 1 ||
        page === totalPages ||
        (page >= currentPage - 2 && page <= currentPage + 2)
      )
    })
  }

  const pageNumbers = getPageNumbers()

  return (
    <div className="flex justify-center items-center gap-2">
      <Button
        variant="outline"
        size="md"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        前へ
      </Button>

      <div className="flex gap-1">
        {pageNumbers.map((page, index, array) => {
          // 省略記号を表示
          const prevPage = array[index - 1]
          const showEllipsis = prevPage && page - prevPage > 1

          return (
            <div key={page} className="flex items-center gap-1">
              {showEllipsis && (
                <span className="px-2 text-gray-500">...</span>
              )}
              <Button
                variant={page === currentPage ? 'primary' : 'outline'}
                size="md"
                onClick={() => onPageChange(page)}
              >
                {page}
              </Button>
            </div>
          )
        })}
      </div>

      <Button
        variant="outline"
        size="md"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        次へ
      </Button>
    </div>
  )
}
