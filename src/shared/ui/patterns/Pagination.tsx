import type React from 'react'
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import { cn } from '@/shared/ui/utils/cn'

/**
 * Pagination control — purely presentational.
 *
 * The caller is responsible for slicing data and reading the URL state.
 *   <Pagination
 *     page={page}
 *     pageCount={Math.ceil(total / pageSize)}
 *     onPageChange={setPage}
 *   />
 *
 * Renders ellipses for long ranges (e.g. 1 … 4 5 6 … 12).
 */
export interface PaginationProps {
  /** Current page (1-indexed). */
  page: number
  /** Total number of pages. Must be >= 1. */
  pageCount: number
  /** Called with the requested page when the user clicks a number / arrow. */
  onPageChange: (page: number) => void
  /** Number of sibling pages on each side of the current one. Default 1. */
  siblingCount?: number
  className?: string
  testId?: string
}

const ELLIPSIS = '…'

export function Pagination({
  page,
  pageCount,
  onPageChange,
  siblingCount = 1,
  className,
  testId,
}: PaginationProps): React.JSX.Element | null {
  if (pageCount <= 1) return null

  const items = buildRange(page, pageCount, siblingCount)
  const prevDisabled = page <= 1
  const nextDisabled = page >= pageCount

  return (
    <nav
      role="navigation"
      aria-label="Pagination"
      className={cn('flex items-center justify-center gap-1', className)}
      {...(testId !== undefined ? { 'data-testid': testId } : {})}
    >
      <PageButton
        aria-label="Previous page"
        disabled={prevDisabled}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft className="h-4 w-4" />
      </PageButton>

      {items.map((item, idx) =>
        item === ELLIPSIS ? (
          <span
            key={`gap-${idx}`}
            aria-hidden="true"
            className="inline-flex h-9 w-9 items-center justify-center text-muted-fg"
          >
            <MoreHorizontal className="h-4 w-4" />
          </span>
        ) : (
          <PageButton
            key={item}
            aria-label={`Go to page ${item}`}
            aria-current={item === page ? 'page' : undefined}
            isActive={item === page}
            onClick={() => onPageChange(item)}
          >
            {item}
          </PageButton>
        ),
      )}

      <PageButton
        aria-label="Next page"
        disabled={nextDisabled}
        onClick={() => onPageChange(page + 1)}
      >
        <ChevronRight className="h-4 w-4" />
      </PageButton>
    </nav>
  )
}

interface PageButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isActive?: boolean
  children: React.ReactNode
}

function PageButton({
  isActive = false,
  className,
  children,
  ...rest
}: PageButtonProps): React.JSX.Element {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex h-9 min-w-9 items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors duration-base',
        isActive
          ? 'border-primary bg-primary text-primary-fg'
          : 'border-border bg-surface text-foreground hover:bg-muted',
        'disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}

/**
 * Returns the visible page range as a mix of numbers and ELLIPSIS markers.
 * Algorithm: always show first, last, current, and `siblingCount` siblings;
 * insert an ellipsis where pages are skipped.
 */
function buildRange(
  page: number,
  total: number,
  siblings: number,
): Array<number | typeof ELLIPSIS> {
  // Threshold: if every page fits without ellipses, return them all.
  const totalSlots = siblings * 2 + 5 // first + last + current + 2 siblings * 2 + 2 ellipses worst case
  if (total <= totalSlots) {
    return range(1, total)
  }

  const leftSibling = Math.max(page - siblings, 1)
  const rightSibling = Math.min(page + siblings, total)
  const showLeftEllipsis = leftSibling > 2
  const showRightEllipsis = rightSibling < total - 1

  if (!showLeftEllipsis && showRightEllipsis) {
    const leftRange = range(1, 3 + siblings * 2)
    return [...leftRange, ELLIPSIS, total]
  }

  if (showLeftEllipsis && !showRightEllipsis) {
    const rightStart = total - (3 + siblings * 2) + 1
    const rightRange = range(rightStart, total)
    return [1, ELLIPSIS, ...rightRange]
  }

  // Both ellipses
  return [1, ELLIPSIS, ...range(leftSibling, rightSibling), ELLIPSIS, total]
}

function range(start: number, end: number): number[] {
  const out: number[] = []
  for (let i = start; i <= end; i++) out.push(i)
  return out
}
