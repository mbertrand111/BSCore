import type React from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { cn } from '@/shared/ui/utils/cn'
import { EmptyState } from './EmptyState'

/**
 * Declarative table for tabular data.
 *
 * V1 scope:
 *   - columns are declarative (label + accessor or render)
 *   - displays rows
 *   - empty state when rows.length === 0
 *   - hover row + responsive horizontal scroll
 *   - optional sort affordances (caller controls the sort state)
 *
 * Sort is OPTIONAL and CONTROLLED. The DataTable does not sort the rows
 * itself — it only renders the affordances (clickable headers + indicators)
 * and emits the requested sort. The caller applies the sort to its data
 * before passing `rows` in.
 */
export interface DataTableColumn<T> {
  key: string
  label: string
  accessor?: keyof T
  render?: (row: T) => React.ReactNode
  cellClassName?: string
  headerClassName?: string
  minWidthClassName?: string
  /** Mark this column as sortable — clicking the header emits onSortChange. */
  sortable?: boolean
}

export type SortDirection = 'asc' | 'desc'

export interface SortState {
  key: string
  direction: SortDirection
}

export interface DataTableProps<T> {
  columns: ReadonlyArray<DataTableColumn<T>>
  rows: ReadonlyArray<T>
  rowId: (row: T) => string
  testId?: string
  emptyTitle?: string
  emptyDescription?: string
  className?: string
  onRowClick?: (row: T) => void
  /** Current sort state — null means unsorted. */
  sort?: SortState | null
  /** Called when a sortable header is clicked. Caller updates state + rows. */
  onSortChange?: (sort: SortState | null) => void
}

export function DataTable<T>({
  columns,
  rows,
  rowId,
  testId,
  emptyTitle = 'No items',
  emptyDescription,
  className,
  onRowClick,
  sort,
  onSortChange,
}: DataTableProps<T>): React.JSX.Element {
  if (rows.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        {...(emptyDescription !== undefined ? { description: emptyDescription } : {})}
      />
    )
  }

  const handleSortClick = (col: DataTableColumn<T>): void => {
    if (col.sortable !== true || onSortChange === undefined) return
    const isCurrent = sort?.key === col.key
    if (!isCurrent) {
      onSortChange({ key: col.key, direction: 'asc' })
      return
    }
    if (sort?.direction === 'asc') {
      onSortChange({ key: col.key, direction: 'desc' })
      return
    }
    onSortChange(null)
  }

  return (
    <div className={cn('overflow-x-auto rounded-md border border-border bg-surface', className)}>
      <table
        className="w-full border-collapse text-sm"
        {...(testId !== undefined ? { 'data-testid': testId } : {})}
      >
        <thead className="bg-surface-muted">
          <tr>
            {columns.map((col) => {
              const isSortable = col.sortable === true
              const isCurrent = sort?.key === col.key
              const ariaSort = isCurrent
                ? sort?.direction === 'asc'
                  ? 'ascending'
                  : 'descending'
                : isSortable
                  ? 'none'
                  : undefined

              return (
                <th
                  key={col.key}
                  scope="col"
                  aria-sort={ariaSort}
                  className={cn(
                    'whitespace-nowrap border-b border-border px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-fg',
                    col.minWidthClassName,
                    col.headerClassName,
                  )}
                >
                  {isSortable ? (
                    <button
                      type="button"
                      onClick={() => handleSortClick(col)}
                      className="inline-flex items-center gap-1 font-medium uppercase tracking-wide hover:text-foreground"
                    >
                      <span>{col.label}</span>
                      <SortIcon
                        isCurrent={isCurrent}
                        {...(sort?.direction !== undefined ? { direction: sort.direction } : {})}
                      />
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const id = rowId(row)
            const clickable = onRowClick !== undefined
            return (
              <tr
                key={id}
                {...(testId !== undefined ? { 'data-testid': `${testId}-row-${id}` } : {})}
                {...(clickable ? { onClick: () => onRowClick(row), tabIndex: 0, role: 'button' } : {})}
                className={cn(
                  'border-b border-border last:border-b-0 transition-colors duration-base',
                  'hover:bg-muted/60',
                  clickable && 'cursor-pointer focus-visible:bg-muted/60',
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn('px-4 py-3 align-middle text-foreground', col.cellClassName)}
                  >
                    {renderCell(row, col)}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function SortIcon({
  isCurrent,
  direction,
}: {
  isCurrent: boolean
  direction?: SortDirection
}): React.JSX.Element {
  if (!isCurrent) {
    return <ArrowUpDown aria-hidden="true" className="h-3 w-3 opacity-50" />
  }
  return direction === 'asc' ? (
    <ArrowUp aria-hidden="true" className="h-3 w-3 text-foreground" />
  ) : (
    <ArrowDown aria-hidden="true" className="h-3 w-3 text-foreground" />
  )
}

function renderCell<T>(row: T, col: DataTableColumn<T>): React.ReactNode {
  if (col.render) return col.render(row)
  if (col.accessor !== undefined) {
    const value = row[col.accessor]
    return value as React.ReactNode
  }
  return null
}
