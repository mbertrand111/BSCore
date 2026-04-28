import type React from 'react'
import { cn } from '@/shared/ui/utils/cn'
import { EmptyState } from './EmptyState'

/**
 * Declarative table for tabular data.
 *
 * V1 scope:
 *   - columns are declarative (label + accessor or render)
 *   - displays rows
 *   - empty state when rows.length === 0
 *   - no sort, no pagination, no grouping (per FRONTEND.md §4)
 *
 * Add features only when a real module needs them.
 */
export interface DataTableColumn<T> {
  /** Stable identifier for the column — used as React key and data-testid suffix. */
  key: string
  /** Header label shown in the <th>. */
  label: string
  /**
   * Either a property name from T (typed) or a custom renderer.
   * If both are provided, render wins.
   */
  accessor?: keyof T
  render?: (row: T) => React.ReactNode
  /** Optional className applied to <td>. */
  cellClassName?: string
  /** Optional className applied to <th>. */
  headerClassName?: string
}

export interface DataTableProps<T> {
  columns: ReadonlyArray<DataTableColumn<T>>
  rows: ReadonlyArray<T>
  /** Stable id extractor for the row's React key and data-testid suffix. */
  rowId: (row: T) => string
  /** Test id base — rows become `${testId}-row-${id}`, header becomes `${testId}-header`. */
  testId?: string
  /** Empty state title shown when rows is empty. */
  emptyTitle?: string
  /** Empty state description. */
  emptyDescription?: string
  className?: string
}

export function DataTable<T>({
  columns,
  rows,
  rowId,
  testId,
  emptyTitle = 'No items',
  emptyDescription,
  className,
}: DataTableProps<T>): React.JSX.Element {
  if (rows.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        {...(emptyDescription !== undefined ? { description: emptyDescription } : {})}
      />
    )
  }

  return (
    <div className={cn('overflow-x-auto rounded-md border border-border', className)}>
      <table
        className="w-full border-collapse text-sm"
        {...(testId !== undefined ? { 'data-testid': testId } : {})}
      >
        <thead className="bg-muted">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={cn(
                  'border-b border-border px-3 py-2 text-left font-medium text-muted-fg',
                  col.headerClassName,
                )}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const id = rowId(row)
            return (
              <tr
                key={id}
                {...(testId !== undefined ? { 'data-testid': `${testId}-row-${id}` } : {})}
                className="border-b border-border last:border-b-0 hover:bg-muted/50"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn('px-3 py-2 text-foreground', col.cellClassName)}
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

function renderCell<T>(row: T, col: DataTableColumn<T>): React.ReactNode {
  if (col.render) return col.render(row)
  if (col.accessor !== undefined) {
    const value = row[col.accessor]
    return value as React.ReactNode
  }
  return null
}
